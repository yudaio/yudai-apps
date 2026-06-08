"""
Face AI Studio プロキシサーバー
使い方: python proxy.py
ブラウザで http://localhost:8080 を開く
"""
# ── torch 2.1.x 互換パッチ（他モジュールより先に実行）──────────────
try:
    import torch.utils._pytree as _pt
    if not hasattr(_pt, 'register_pytree_node'):
        _orig_reg = _pt._register_pytree_node
        def _compat_register_pytree_node(cls, flatten_fn, unflatten_fn, **kwargs):
            # torch 2.1.x の _register_pytree_node は serialized_type_name 等を受け取れないため除去
            import inspect
            sig = inspect.signature(_orig_reg)
            valid = {k: v for k, v in kwargs.items() if k in sig.parameters}
            return _orig_reg(cls, flatten_fn, unflatten_fn, **valid)
        _pt.register_pytree_node = _compat_register_pytree_node
except Exception:
    pass

import http.server
import urllib.request
import urllib.error
import json
import os
import ssl
import socket
import struct
import random
import socketserver
import threading
import tempfile
import io

# ── 進捗共有 ────────────────────────────────────────────────
_deepfake_progress = {"progress": 0, "message": ""}
_faceswap_progress = {"progress": 0, "message": ""}

def _set_progress(pct, msg=""):
    _deepfake_progress["progress"] = pct
    _deepfake_progress["message"]  = msg

def _set_fs_progress(pct, msg=""):
    _faceswap_progress["progress"] = pct
    _faceswap_progress["message"]  = msg

# ── 顔復元エンハンサー（CodeFormer 優先 → GFPGAN フォールバック）────
_restorer       = None
_restorer_lock  = threading.Lock()
_restorer_type  = None   # "codeformer" | "gfpgan" | False

def _xpu_stub():
    """torch.xpu がない環境用ダミー"""
    import torch
    if not hasattr(torch, 'xpu'):
        class _S:
            is_available    = staticmethod(lambda: False)
            empty_cache     = staticmethod(lambda: None)
            synchronize     = staticmethod(lambda: None)
            device_count    = staticmethod(lambda: 0)
            current_device  = staticmethod(lambda: 0)
            memory_allocated= staticmethod(lambda *a: 0)
            memory_reserved = staticmethod(lambda *a: 0)
            manual_seed     = staticmethod(lambda *a: None)
            manual_seed_all = staticmethod(lambda *a: None)
            set_device      = staticmethod(lambda *a: None)
            get_device_properties = staticmethod(
                lambda *a: type('P',(),{'name':'xpu','total_memory':0})())
            stream = staticmethod(
                lambda *a: type('S',(),{'__enter__':lambda s,*a:s,'__exit__':lambda s,*a:None})())
            Event  = staticmethod(
                lambda *a,**kw: type('E',(),{'record':lambda s:None,'synchronize':lambda s:None})())
        torch.xpu = _S()

def _get_restorer():
    """CodeFormer または GFPGAN を遅延初期化（初回のみ）"""
    global _restorer, _restorer_type
    if _restorer is not None or _restorer_type is False:
        return _restorer, _restorer_type
    with _restorer_lock:
        if _restorer is not None or _restorer_type is False:
            return _restorer, _restorer_type
        import warnings; warnings.filterwarnings("ignore")

        # ── 試行1: CodeFormer ────────────────────────────────────────
        try:
            import torch; _xpu_stub()
            import os as _os
            from basicsr.utils.download_util import load_file_from_url
            from basicsr.archs.rrdbnet_arch import RRDBNet  # noqa: basicsr 疎通確認
            # CodeFormer weights を取得
            cf_dir  = _os.path.join(_os.path.expanduser("~"), ".codeformer")
            _os.makedirs(cf_dir, exist_ok=True)
            cf_path = _os.path.join(cf_dir, "codeformer.pth")
            if not _os.path.exists(cf_path):
                print("[Restorer] CodeFormer weights をダウンロード中（約370MB）...")
                load_file_from_url(
                    "https://github.com/sczhou/CodeFormer/releases/download/v0.1.0/codeformer.pth",
                    model_dir=cf_dir, progress=True, file_name="codeformer.pth")
            # CodeFormer net をロード
            from basicsr.utils.misc import get_device
            from basicsr.utils import img2tensor, tensor2img
            import importlib
            cf_net = torch.load(cf_path, map_location="cpu")
            # 軽量ラッパーとして保持
            _restorer      = {"type": "codeformer", "net": cf_net,
                              "img2tensor": img2tensor, "tensor2img": tensor2img}
            _restorer_type = "codeformer"
            print("[Restorer] CodeFormer 初期化完了")
            return _restorer, _restorer_type
        except Exception as e:
            print(f"[Restorer] CodeFormer 失敗: {e}")

        # ── 試行2: GFPGAN ────────────────────────────────────────────
        try:
            import torch; _xpu_stub()
            from gfpgan import GFPGANer
            enhancer = GFPGANer(
                model_path="https://github.com/TencentARC/GFPGAN/releases/download/v1.3.4/GFPGANv1.4.pth",
                upscale=1, arch="clean", channel_multiplier=2, bg_upsampler=None,
            )
            _restorer      = enhancer
            _restorer_type = "gfpgan"
            print("[Restorer] GFPGAN 初期化完了")
            return _restorer, _restorer_type
        except Exception as e:
            print(f"[Restorer] GFPGAN 失敗: {e}")

        _restorer_type = False
        print("[Restorer] 顔復元なし（インストールされていません）")
        return None, False

# ── insightface landmark_2d_106 ベース顔輪郭マスク ─────────────────
# landmark_2d_106 の輪郭インデックス（顔外周 33点）
_FACE_OVAL_106 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
                  17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]

def _make_face_mask(img_bgr, face, bbox):
    """
    insightface landmark_2d_106 で精密な顔輪郭マスクを生成。
    ランドマークが無い場合は楕円マスクで代替。
    """
    import cv2, numpy as np
    fh, fw = img_bgr.shape[:2]

    lm = getattr(face, 'landmark_2d_106', None)
    if lm is not None:
        try:
            pts = lm.astype(np.int32)
            hull_pts = pts[_FACE_OVAL_106]
            # 凸包で顔輪郭を囲む
            hull = cv2.convexHull(hull_pts)
            mask = np.zeros((fh, fw), dtype=np.uint8)
            cv2.fillPoly(mask, [hull], 255)
            mask_f = cv2.GaussianBlur(mask.astype(np.float32)/255., (31,31), 11)
            return mask_f
        except Exception:
            pass

    # フォールバック: 楕円マスク
    face_w = bbox[2]-bbox[0]; face_h = bbox[3]-bbox[1]
    cx = (bbox[0]+bbox[2])//2; cy = (bbox[1]+bbox[3])//2
    mask = np.zeros((fh, fw), dtype=np.uint8)
    cv2.ellipse(mask, (cx,cy), (int(face_w*0.55), int(face_h*0.60)), 0,0,360,255,-1)
    return cv2.GaussianBlur(mask.astype(np.float32)/255., (31,31), 11)

def _restore_expressions(gfpgan_result, pre_gfpgan_swap, face):
    """
    GFPGAN 適用後の画像に、GFPGAN 適用前のスワップ結果から
    目・口・鼻の領域を上書きする。
    - gfpgan_result  : GFPGAN で肌を滑らかにした画像（目が正規化されている）
    - pre_gfpgan_swap: GFPGAN 前のスワップ結果（白目・表情が生きている）
    これにより「滑らかな肌 + 正確な表情」が両立する。
    """
    import cv2, numpy as np
    fh, fw = gfpgan_result.shape[:2]
    kps = getattr(face, 'kps', None)
    if kps is None or len(kps) < 2:
        return gfpgan_result

    result = gfpgan_result.copy()
    kps_i = kps.astype(np.int32)
    eye_dist = max(int(np.linalg.norm(
        kps_i[1].astype(float) - kps_i[0].astype(float))), 10)

    expr_mask = np.zeros((fh, fw), dtype=np.uint8)

    # 左目・右目
    eye_rx = max(int(eye_dist * 0.80), 24)
    eye_ry = max(int(eye_dist * 0.60), 18)
    for ep in [kps_i[0], kps_i[1]]:
        ex, ey = int(ep[0]), int(ep[1])
        if 0 <= ex < fw and 0 <= ey < fh:
            cv2.ellipse(expr_mask, (ex, ey), (eye_rx, eye_ry), 0, 0, 360, 255, -1)

    # 口
    if len(kps_i) >= 5:
        ml, mr = kps_i[3], kps_i[4]
        mx = int((ml[0] + mr[0]) // 2)
        my = int((ml[1] + mr[1]) // 2)
        mrx = max(int(np.linalg.norm(mr.astype(float) - ml.astype(float)) * 0.70), 20)
        mry = max(int(mrx * 0.60), 14)
        if 0 <= mx < fw and 0 <= my < fh:
            cv2.ellipse(expr_mask, (mx, my), (mrx, mry), 0, 0, 360, 255, -1)

    # 鼻
    if len(kps_i) >= 3:
        nx, ny = int(kps_i[2][0]), int(kps_i[2][1])
        nr = max(int(eye_dist * 0.30), 10)
        if 0 <= nx < fw and 0 <= ny < fh:
            cv2.circle(expr_mask, (nx, ny), nr, 255, -1)

    ef = cv2.GaussianBlur(expr_mask.astype(np.float32) / 255., (11, 11), 3)
    e3 = ef[:, :, np.newaxis]

    # GFPGAN結果 × (1-mask) + スワップ直後 × mask
    result = np.clip(
        result.astype(np.float32) * (1 - e3) + pre_gfpgan_swap.astype(np.float32) * e3,
        0, 255
    ).astype(np.uint8)
    return result


def _enhance_skin(img_bgr, face):
    """
    ステージ⑤: 肌品質強化（GFPGAN）
    表情復元が済んでいるため、目・口は保護不要。
    GFPGAN で肌テクスチャ・シャープネスのみ改善する。
    """
    import cv2, numpy as np
    restorer, rtype = _get_restorer()
    fh, fw = img_bgr.shape[:2]
    bbox = face.bbox.astype(int)
    face_w = bbox[2] - bbox[0]; face_h = bbox[3] - bbox[1]
    # 顔領域 + 少し余白（首・髪際まで含める）
    pad = int(max(face_w, face_h) * 0.5)
    x1 = max(0, bbox[0]-pad); y1 = max(0, bbox[1]-pad)
    x2 = min(fw, bbox[2]+pad); y2 = min(fh, bbox[3]+pad)
    if x2 - x1 < 60 or y2 - y1 < 60:
        return img_bgr

    result = img_bgr.copy()

    if restorer and rtype == "gfpgan":
        try:
            import warnings; warnings.filterwarnings("ignore")
            crop = img_bgr[y1:y2, x1:x2].copy()
            ch, cw = crop.shape[:2]
            _, _, enhanced = restorer.enhance(
                crop, has_aligned=False, only_center_face=True,
                paste_back=True, weight=0.5)
            if enhanced is not None:
                if enhanced.shape[:2] != (ch, cw):
                    enhanced = cv2.resize(enhanced, (cw, ch), interpolation=cv2.INTER_LANCZOS4)
                result[y1:y2, x1:x2] = enhanced
        except Exception as e:
            print(f"[GFPGAN] 肌強化失敗: {e}")
    else:
        # GFPGAN なし: アンシャープマスクで輪郭強調
        crop = img_bgr[y1:y2, x1:x2].copy()
        blur = cv2.GaussianBlur(crop, (0, 0), 2.0)
        result[y1:y2, x1:x2] = np.clip(
            cv2.addWeighted(crop, 1.5, blur, -0.5, 0), 0, 255).astype(np.uint8)

    return result

# ── InsightFace 利用可否チェック ──────────────────────────────
INSWAPPER_MIN_BYTES = 500 * 1024 * 1024  # 500 MB 未満は不完全とみなす

def _check_deepfake_deps():
    missing = []
    try: import insightface
    except ImportError: missing.append("insightface")
    try: import onnxruntime
    except ImportError: missing.append("onnxruntime / onnxruntime-gpu")
    try: import cv2
    except ImportError: missing.append("opencv-python")
    try: import numpy
    except ImportError: missing.append("numpy")
    return missing

def _check_inswapper():
    """inswapper_128.onnx が完全にダウンロードされているか確認"""
    path = os.path.expanduser("~/.insightface/models/inswapper_128.onnx")
    if not os.path.exists(path):
        return False, "inswapper_128.onnx が見つかりません（ダウンロード中かも）"
    size = os.path.getsize(path)
    if size < INSWAPPER_MIN_BYTES:
        mb = round(size / 1024 / 1024, 1)
        return False, f"inswapper_128.onnx がダウンロード中です（{mb}MB / 約529MB）。完了まで少しお待ちください。"
    return True, ""

SD_API     = "http://127.0.0.1:7860"
HF_API     = "https://router.huggingface.co"   # 旧 api-inference.huggingface.co は廃止
POL_API    = "https://image.pollinations.ai"
GEMINI_API = "https://generativelanguage.googleapis.com"
PORT    = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── DNS patch: HuggingFace は Windows の system DNS で解決できないため
#    Google Public DNS (8.8.8.8) で直接解決する ──────────────────────
_orig_getaddrinfo = socket.getaddrinfo

def _resolve_via_udp(hostname, dns="8.8.8.8"):
    """指定 DNS サーバー (UDP) でホスト名を A レコード解決"""
    try:
        txid = random.randint(1, 65535)
        header = struct.pack(">HHHHHH", txid, 0x0100, 1, 0, 0, 0)
        qname = b"".join(bytes([len(p)]) + p.encode() for p in hostname.split(".")) + b"\x00"
        query  = header + qname + struct.pack(">HH", 1, 1)

        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(5)
        s.sendto(query, (dns, 53))
        resp = s.recv(512)
        s.close()

        # question section をスキップ
        pos = 12
        while pos < len(resp):
            ln = resp[pos]
            if ln == 0:        pos += 1; break
            elif ln & 0xC0:    pos += 2; break
            pos += ln + 1
        pos += 4  # QTYPE + QCLASS

        # answer section
        ancount = struct.unpack(">H", resp[6:8])[0]
        for _ in range(ancount):
            while pos < len(resp):
                ln = resp[pos]
                if ln == 0:     pos += 1; break
                elif ln & 0xC0: pos += 2; break
                pos += ln + 1
            if pos + 10 > len(resp):
                break
            rtype, _, _, rdlen = struct.unpack(">HHIH", resp[pos:pos+10])
            pos += 10
            if rtype == 1 and rdlen == 4:
                ip = ".".join(str(b) for b in resp[pos:pos+4])
                return ip
            pos += rdlen
    except Exception as e:
        print(f"[DNS] {hostname} 解決失敗: {e}")
    return None

def _patched_getaddrinfo(host, port, *args, **kwargs):
    if isinstance(host, str) and host.endswith(".huggingface.co"):
        ip = _resolve_via_udp(host)
        if ip:
            print(f"[DNS] {host} → {ip} (Google DNS)")
            host = ip
    return _orig_getaddrinfo(host, port, *args, **kwargs)

socket.getaddrinfo = _patched_getaddrinfo
# ──────────────────────────────────────────────────────────────────────

ssl_ctx = ssl.create_default_context()
# Windows で証明書チェーンが不完全なケースのフォールバック
try:
    import certifi
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    pass  # certifi 未インストール時は標準コンテキストを使用
# HTTPS接続テストで失敗する環境向けの緩和設定
ssl_ctx_relaxed = ssl.create_default_context()
ssl_ctx_relaxed.check_hostname = False
ssl_ctx_relaxed.verify_mode = ssl.CERT_NONE


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.command}] {self.path}")

    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-HF-Token")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        # Strip query string for path matching
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path in ("/", "/index.html"):
            self._serve_file("index.html", "text/html; charset=utf-8")
        elif clean_path == "/status":
            self._serve_status()
        elif clean_path == "/deepfake-status":
            missing = _check_deepfake_deps()
            data = json.dumps({"ready": len(missing)==0, "missing": missing}).encode()
            self.send_response(200); self.send_header("Content-Type","application/json")
            self.send_header("Content-Length",len(data)); self.send_cors(); self.end_headers(); self.wfile.write(data)
        elif clean_path == "/deepfake-progress":
            data = json.dumps(_deepfake_progress).encode()
            self.send_response(200); self.send_header("Content-Type","application/json")
            self.send_header("Content-Length",len(data)); self.send_cors(); self.end_headers(); self.wfile.write(data)
        elif clean_path == "/faceswap-progress":
            data = json.dumps(_faceswap_progress).encode()
            self.send_response(200); self.send_header("Content-Type","application/json")
            self.send_header("Content-Length",len(data)); self.send_cors(); self.end_headers(); self.wfile.write(data)
        elif self.path.startswith("/sdapi/") or self.path.startswith("/internal/") \
                or self.path.startswith("/controlnet/"):
            self._proxy_sd("GET", self.path, None)
        elif self.path.startswith("/polapi/"):
            self._proxy_pollinations("GET", self.path[len("/polapi"):], None)
        elif self.path.startswith("/geminiapi/"):
            gemini_path = self.path[len("/geminiapi"):]
            self._proxy_gemini("GET", gemini_path, None)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
        except Exception:
            length = 0
        print(f"[POST] {self.path} Content-Length={length}")
        try:
            body = self.rfile.read(length) if length > 0 else b""
        except Exception as e:
            print(f"[POST] body read error: {e}")
            body = b""

        try:
            if self.path.startswith("/sdapi/") or self.path.startswith("/controlnet/"):
                self._proxy_sd("POST", self.path, body)
            elif self.path.startswith("/hfapi/"):
                hf_path = self.path[len("/hfapi"):]
                token   = self.headers.get("X-HF-Token", "")
                self._proxy_hf("POST", hf_path, body, token)
            elif self.path.startswith("/polapi/"):
                pol_path = self.path[len("/polapi"):]
                self._proxy_pollinations("POST", pol_path, body)
            elif self.path.startswith("/geminiapi/"):
                gemini_path = self.path[len("/geminiapi"):]
                self._proxy_gemini("POST", gemini_path, body)
            elif self.path == "/faceswap-image":
                self._run_faceswap_image(body)
            elif self.path == "/deepfake":
                self._run_deepfake(body)
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            import traceback
            print(f"[POST] unhandled error on {self.path}: {e}")
            traceback.print_exc()
            try:
                err = json.dumps({"error": str(e)}).encode()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", len(err))
                self.send_cors()
                self.end_headers()
                self.wfile.write(err)
            except Exception:
                pass

    # ── ダウンロード状況 ──────────────────────────────────────────────
    def _serve_status(self):
        TILE_PATH = r"C:\SD\stable-diffusion-webui\extensions\sd-webui-controlnet\models\control_v11f1e_sd15_tile.pth"
        RV_PATH   = r"C:\SD\stable-diffusion-webui\models\Stable-diffusion\Realistic_Vision_V5.1_fp16.safetensors"
        TILE_EXPECTED = 1_556_987_064   # HuggingFace 実サイズ (bytes)
        RV_EXPECTED   = 2_132_625_894   # HuggingFace 実サイズ (bytes)

        def info(path, expected):
            sz = os.path.getsize(path) if os.path.exists(path) else 0
            return {"size": sz, "expected": expected,
                    "pct": round(sz / expected * 100, 1) if expected else 0,
                    "complete": sz >= expected * 0.99}

        data = json.dumps({
            "tile_model": info(TILE_PATH, TILE_EXPECTED),
            "rv_model":   info(RV_PATH,   RV_EXPECTED),
        }).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(data))
        self.send_cors()
        self.end_headers()
        self.wfile.write(data)

    # ── ファイル配信 ──────────────────────────────────────────────────
    def _serve_file(self, filename, ctype):
        filepath = os.path.join(BASE_DIR, filename)
        try:
            with open(filepath, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", len(data))
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_cors()
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()

    # ── SD WebUI プロキシ ─────────────────────────────────────────────
    def _proxy_sd(self, method, path, body):
        url = SD_API + path
        try:
            req = urllib.request.Request(url, data=body, method=method)
            if body:
                req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", len(data))
                self.send_cors()
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.URLError as e:
            self._send_error(502, json.dumps({"error": f"SD WebUI接続エラー: {e.reason}"}).encode())
        except Exception as e:
            self._send_error(500, json.dumps({"error": str(e)}).encode())

    # ── HuggingFace Inference API プロキシ ───────────────────────────
    def _proxy_hf(self, method, path, body, token):
        # /models/... → /hf-inference/models/... (新エンドポイント対応)
        if path.startswith("/models/"):
            path = "/hf-inference" + path
        url = HF_API + path

        # ── InstructPix2Pix 用変換 ──────────────────────────────────
        # X-Instruction ヘッダーがある場合: 生バイナリ → JSON (base64 + parameters)
        instruction = self.headers.get("X-Instruction", "")
        if instruction and body:
            import base64 as _b64
            img_b64 = _b64.b64encode(body).decode()
            try:
                strength_val = float(self.headers.get("X-Strength", "0.35"))
            except ValueError:
                strength_val = 0.35
            # strength(0.20=弱→元画像忠実, 0.60=強→変換大きい)
            # → image_guidance_scale (高=元画像忠実 / 低=プロンプト重視)
            image_guidance = round(1.5 + (0.35 - strength_val) * 3, 2)
            image_guidance = max(0.5, min(3.0, image_guidance))
            payload = {
                "inputs": img_b64,
                "parameters": {
                    "prompt": instruction,
                    "num_inference_steps": 50,       # 20→50 で細部が大幅改善
                    "image_guidance_scale": image_guidance,
                    "guidance_scale": 7.5
                }
            }
            body = json.dumps(payload).encode()
            content_type = "application/json"
        else:
            content_type = self.headers.get("Content-Type", "application/json")

        for ctx in [ssl_ctx, ssl_ctx_relaxed]:
            try:
                req = urllib.request.Request(url, data=body, method=method)
                req.add_header("Content-Type", content_type)
                if token:
                    req.add_header("Authorization", f"Bearer {token}")
                with urllib.request.urlopen(req, timeout=180, context=ctx) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "application/octet-stream"))
                    self.send_header("Content-Length", len(data))
                    self.send_cors()
                    self.end_headers()
                    self.wfile.write(data)
                return
            except urllib.error.HTTPError as e:
                data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", len(data))
                self.send_cors()
                self.end_headers()
                self.wfile.write(data)
                return
            except urllib.error.URLError as e:
                print(f"[HF] SSL ctx {ctx.verify_mode} failed: {e.reason}")
                continue
            except Exception as e:
                self._send_error(500, json.dumps({"error": str(e)}).encode())
                return
        self._send_error(502, json.dumps({"error": "HuggingFace接続エラー: SSL/ネットワーク障害"}).encode())

    # ── Pollinations.ai プロキシ ─────────────────────────────────────
    def _proxy_pollinations(self, method, path, body=None):
        url = POL_API + path
        last_err = "unknown"
        for ctx in [ssl_ctx, ssl_ctx_relaxed]:
            try:
                req = urllib.request.Request(url, data=body, method=method)
                req.add_header("User-Agent", "Mozilla/5.0 (compatible; AI-Studio-Proxy/1.0)")
                if body:
                    req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "image/png"))
                    self.send_header("Content-Length", len(data))
                    self.send_cors()
                    self.end_headers()
                    self.wfile.write(data)
                return
            except urllib.error.HTTPError as e:
                data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", len(data))
                self.send_cors()
                self.end_headers()
                self.wfile.write(data)
                return
            except urllib.error.URLError as e:
                last_err = str(e.reason)
                continue
            except Exception as e:
                self._send_error(500, json.dumps({"error": str(e)}).encode())
                return
        self._send_error(502, json.dumps({"error": f"Pollinations接続エラー: {last_err}"}).encode())

    # ── Gemini API プロキシ ──────────────────────────────────────────
    def _proxy_gemini(self, method, path, body):
        url = GEMINI_API + path
        for ctx in [ssl_ctx, ssl_ctx_relaxed]:
            try:
                req = urllib.request.Request(url, data=body, method=method)
                if body:
                    req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", len(data))
                    self.send_cors()
                    self.end_headers()
                    self.wfile.write(data)
                return
            except urllib.error.HTTPError as e:
                data = e.read()
                self.send_response(e.code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", len(data))
                self.send_cors()
                self.end_headers()
                self.wfile.write(data)
                return
            except urllib.error.URLError as e:
                last_err = str(e.reason)
                print(f"[Gemini] SSL ctx {ctx.verify_mode} failed: {e.reason}")
                continue
            except Exception as e:
                self._send_error(500, json.dumps({"error": str(e)}).encode())
                return
        self._send_error(502, json.dumps({"error": f"Gemini API接続エラー: {last_err}"}).encode())

    def _send_error(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_cors()
        self.end_headers()
        self.wfile.write(body)

    # ── 画像顔入れ替え ───────────────────────────────────────────────
    def _run_faceswap_image(self, raw_body):
        """multipart: face(image) + target(image) → face-swapped image"""
        missing = _check_deepfake_deps()
        if missing:
            self._send_error(503, json.dumps({"error": f"未インストール: {', '.join(missing)}"}).encode())
            return
        ready, msg = _check_inswapper()
        if not ready:
            self._send_error(503, json.dumps({"error": msg}).encode())
            return
        try:
            import insightface
            from insightface.app import FaceAnalysis
            import cv2, numpy as np

            _set_fs_progress(5, "📦 multipart 解析中...")
            parts, _ = self._parse_multipart(raw_body)
            if "face" not in parts or "target" not in parts:
                _set_fs_progress(0, "")
                self._send_error(400, json.dumps({"error":"face or target missing"}).encode()); return

            tmpdir = tempfile.mkdtemp()
            face_path   = os.path.join(tmpdir, "face.jpg")
            target_path = os.path.join(tmpdir, "target.jpg")
            out_path    = os.path.join(tmpdir, "result.jpg")
            with open(face_path,   "wb") as f: f.write(parts["face"])
            with open(target_path, "wb") as f: f.write(parts["target"])

            _set_fs_progress(15, "🤖 顔認識モデル読み込み中（初回は数分かかります）...")
            app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider','CPUExecutionProvider'])
            app.prepare(ctx_id=0, det_size=(640, 640))

            _set_fs_progress(40, "⬇️ inswapper モデル読み込み中（初回は約170MBダウンロード）...")
            swapper = insightface.model_zoo.get_model('inswapper_128.onnx', download=True, download_zip=True)

            _set_fs_progress(55, "🔍 ソース顔を検出中...")
            src_img = cv2.imread(face_path)
            sh, sw = src_img.shape[:2]
            if max(sh, sw) < 512:
                scale = 512 / max(sh, sw)
                src_img = cv2.resize(src_img, (int(sw*scale), int(sh*scale)), interpolation=cv2.INTER_LANCZOS4)
            # ★ GFPGANを使わず生画像から embedding 抽出
            # → GFPGAN が表情（白目・口形等）を正規化して消してしまうため廃止
            src_faces = app.get(src_img)
            if not src_faces:
                _set_fs_progress(0, "")
                self._send_error(400, json.dumps({"error":"ソース顔が検出できませんでした。正面向きの顔写真を使用してください。"}).encode()); return
            src_face = sorted(src_faces, key=lambda f: f.bbox[2]-f.bbox[0], reverse=True)[0]

            _set_fs_progress(75, "🔍 ターゲット顔を検出中...")
            tgt_img = cv2.imread(target_path)
            tgt_faces = app.get(tgt_img)
            if not tgt_faces:
                _set_fs_progress(0, "")
                self._send_error(400, json.dumps({"error":"ターゲット画像に顔が見つかりませんでした"}).encode()); return

            # ════ ① スワップ ════
            _set_fs_progress(82, "① 顔スワップ中...")
            result = tgt_img.copy()
            for tgt_face in tgt_faces:
                result = swapper.get(result, tgt_face, src_face, paste_back=True)
            swapped_raw = result.copy()  # GFPGAN 前を保存（表情保護用）

            # ════ ② GFPGAN で肌を滑らかに ════
            _set_fs_progress(88, "② GFPGAN 肌強化中...")
            for tgt_face in tgt_faces:
                result = _enhance_skin(result, tgt_face)

            # ════ ③ 表情復元（GFPGAN で正規化された目・口を元に戻す）════
            _set_fs_progress(93, "③ 表情復元中（白目・口形を保護）...")
            for tgt_face in tgt_faces:
                result = _restore_expressions(result, swapped_raw, tgt_face)

            # ════ ④ 色補正 ════
            _set_fs_progress(97, "④ 色補正中...")
            for tgt_face in tgt_faces:
                bbox = tgt_face.bbox.astype(int)
                ih, iw = result.shape[:2]
                x1=max(0,bbox[0]); y1=max(0,bbox[1]); x2=min(iw,bbox[2]); y2=min(ih,bbox[3])
                if x2>x1+10 and y2>y1+10:
                    orig_roi = tgt_img[y1:y2,x1:x2].astype(np.float32)
                    swap_roi = result[y1:y2,x1:x2].astype(np.float32)
                    for c in range(3):
                        om = orig_roi[:,:,c].mean(); sm = swap_roi[:,:,c].mean()
                        if sm > 10:
                            gain = np.clip(om/(sm+1e-6), 0.88, 1.12)
                            result[y1:y2,x1:x2,c] = np.clip(swap_roi[:,:,c]*gain,0,255).astype(np.uint8)

            # 最高品質 PNG 出力（可逆圧縮・劣化なし）
            out_path_png = out_path.replace(".jpg", ".png")
            cv2.imwrite(out_path_png, result, [cv2.IMWRITE_PNG_COMPRESSION, 1])
            out_path = out_path_png
            with open(out_path, "rb") as f: img_data = f.read()

            import shutil; shutil.rmtree(tmpdir, ignore_errors=True)
            _set_fs_progress(100, "完了")

            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", len(img_data))
            self.send_cors(); self.end_headers(); self.wfile.write(img_data)

        except Exception as e:
            import traceback
            _set_fs_progress(0, "")
            self._send_error(500, json.dumps({"error": str(e)}).encode())

    def _parse_multipart(self, raw_body):
        """multipart/form-data を解析して {name: bytes} を返す"""
        content_type = self.headers.get("Content-Type", "")
        boundary = None
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[len("boundary="):].strip().encode()
                break
        if not boundary:
            return {}, {}
        if raw_body is None:
            return {}, {}
        parts    = {}   # name → bytes
        filenames = {}  # name → original filename
        delimiter = b"--" + boundary
        for seg in raw_body.split(delimiter)[1:]:
            if seg.strip() in (b"", b"--", b"--\r\n"): continue
            if b"\r\n\r\n" not in seg: continue
            header_part, data_part = seg.split(b"\r\n\r\n", 1)
            if data_part.endswith(b"\r\n"): data_part = data_part[:-2]
            field_name = None
            field_filename = None
            for line in header_part.decode(errors='replace').split("\r\n"):
                if "name=" in line:
                    for chunk in line.split(";"):
                        chunk = chunk.strip()
                        if chunk.startswith("name="):
                            field_name = chunk[5:].strip('"')
                        elif chunk.startswith("filename="):
                            field_filename = chunk[9:].strip('"')
            if field_name:
                parts[field_name] = data_part
                if field_filename:
                    filenames[field_name] = field_filename
        return parts, filenames

    # ── DeepFake 処理 ────────────────────────────────────────────────
    def _run_deepfake(self, raw_body):
        """multipart/form-data: face(image) + video → face-swapped video"""
        missing = _check_deepfake_deps()
        if missing:
            self._send_error(503, json.dumps({"error": f"未インストール: {', '.join(missing)}\npip install insightface onnxruntime opencv-python"}).encode())
            return
        ready, msg = _check_inswapper()
        if not ready:
            self._send_error(503, json.dumps({"error": msg}).encode())
            return
        try:
            import insightface
            from insightface.app import FaceAnalysis
            import cv2, numpy as np

            _set_progress(3, "📦 データ解析中...")

            # ── multipart 解析 ──────────────────────────────────────
            parts, filenames = self._parse_multipart(raw_body)
            if "face" not in parts or "video" not in parts:
                self._send_error(400, json.dumps({"error":"face or video missing"}).encode()); return

            _set_progress(8, "💾 一時ファイル保存中...")
            tmpdir = tempfile.mkdtemp()
            face_path  = os.path.join(tmpdir, "face.jpg")

            # 動画は元のファイル名の拡張子を維持（OpenCV がコーデックを正しく判別するため）
            video_orig_name = filenames.get("video", "video.mp4")
            video_ext = os.path.splitext(video_orig_name)[1].lower() or ".mp4"
            if video_ext not in (".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v", ".ts"):
                video_ext = ".mp4"
            video_path  = os.path.join(tmpdir, f"input_video{video_ext}")
            output_path = os.path.join(tmpdir, "output.mp4")

            with open(face_path, "wb")  as f: f.write(parts["face"])
            with open(video_path, "wb") as f: f.write(parts["video"])
            print(f"[df] video saved: {video_path} ({len(parts['video'])//1024}KB)")

            _set_progress(12, "🤖 InsightFace モデル読み込み中...")

            # ── InsightFace 初期化 ────────────────────────────────────
            app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider','CPUExecutionProvider'])
            app.prepare(ctx_id=0, det_size=(640, 640))

            _set_progress(18, "⬇️ inswapper モデル読み込み中...")
            swapper = insightface.model_zoo.get_model('inswapper_128.onnx',
                download=True, download_zip=True)

            # ── ソース顔取得 ──────────────────────────────────────────
            _set_progress(22, "🔍 ソース顔を検出中...")
            src_img = cv2.imread(face_path)
            sh, sw = src_img.shape[:2]
            if max(sh, sw) < 512:
                scale = 512 / max(sh, sw)
                src_img = cv2.resize(src_img, (int(sw*scale), int(sh*scale)), interpolation=cv2.INTER_LANCZOS4)

            src_faces = app.get(src_img)
            if not src_faces:
                self._send_error(400, json.dumps({"error":"ソース顔が検出できませんでした。正面顔の写真を使用してください。"}).encode()); return
            src_face = sorted(src_faces, key=lambda f: f.bbox[2]-f.bbox[0], reverse=True)[0]
            print(f"[df] src_face embedding: {src_face.normed_embedding is not None}")

            # フレーム検出用: 480×480（精度と速度のバランス）
            app.prepare(ctx_id=0, det_size=(480, 480))
            _set_progress(26, "✅ ソース顔取得完了、動画処理開始...")

            # ── 動画処理 ──────────────────────────────────────────────
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                self._send_error(400, json.dumps({"error": f"動画ファイルを開けません ({video_ext})。MP4/AVI/MOV形式で試してください。"}).encode()); return
            fps    = cap.get(cv2.CAP_PROP_FPS) or 25
            orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
            print(f"[df] video: {orig_w}x{orig_h} fps={fps:.1f} frames={total} ext={video_ext}")
            _set_progress(28, f"🎬 動画情報: {orig_w}x{orig_h} {fps:.0f}fps {total}フレーム")

            # 1080p 超のみ縮小
            max_dim = 1080
            scale_factor = 1.0
            if max(orig_w, orig_h) > max_dim:
                scale_factor = max_dim / max(orig_w, orig_h)
            proc_w = int(orig_w * scale_factor) & ~1
            proc_h = int(orig_h * scale_factor) & ~1

            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out_writer = cv2.VideoWriter(output_path, fourcc, fps, (proc_w, proc_h))

            # ── 状態変数 ────────────────────────────────────────────
            prev_bboxes    = []
            swapped_count  = 0
            no_face_count  = 0
            prev_result    = None   # 時系列ブレンド用（チラつき抑制）
            GFPGAN_EVERY   = 2      # 2フレームに1回 GFPGAN（品質と速度のバランス）

            frame_idx = 0
            while True:
                ret, frame = cap.read()
                if not ret: break

                if scale_factor != 1.0:
                    frame = cv2.resize(frame, (proc_w, proc_h), interpolation=cv2.INTER_LANCZOS4)

                fh, fw = frame.shape[:2]
                faces = app.get(frame)

                # 顔未検出 → 前フレームbbox周辺を640で再試行
                if not faces and prev_bboxes:
                    for pb in prev_bboxes:
                        px1,py1,px2,py2 = pb
                        pad = int((px2-px1)*0.4)
                        rx1=max(0,px1-pad); ry1=max(0,py1-pad)
                        rx2=min(fw,px2+pad); ry2=min(fh,py2+pad)
                        crop_r = frame[ry1:ry2, rx1:rx2]
                        if crop_r.size == 0: continue
                        app.prepare(ctx_id=0, det_size=(640, 640))
                        sub_faces = app.get(crop_r)
                        app.prepare(ctx_id=0, det_size=(480, 480))
                        if sub_faces:
                            for sf in sub_faces:
                                sf.bbox[0] += rx1; sf.bbox[2] += rx1
                                sf.bbox[1] += ry1; sf.bbox[3] += ry1
                                faces.append(sf)
                            break

                result = frame.copy()

                if not faces:
                    no_face_count += 1
                    prev_bboxes = []
                    prev_result = None
                else:
                    prev_bboxes = [f.bbox.astype(int).tolist() for f in faces]

                    # ════ ① スワップ ════
                    # paste_back=True: inswapper が内部で境界ブレンドまで行う
                    for face in faces:
                        before = result.copy()
                        try:
                            result = swapper.get(result, face, src_face, paste_back=True)
                        except Exception as e:
                            print(f"[swap] frame {frame_idx}: {e}"); continue
                        if float(np.abs(result.astype(np.int32)-before.astype(np.int32)).mean()) >= 0.5:
                            swapped_count += 1

                    # スワップ直後を保存（表情保護用）
                    swapped_raw = result.copy()

                    # ════ ② GFPGAN で肌を滑らかに ════
                    # 2フレームに1回適用（毎フレームだと重い）
                    if frame_idx % GFPGAN_EVERY == 0:
                        result = _enhance_skin(result, faces[0])

                    # ════ ③ 表情復元 ════
                    # GFPGAN が正規化した目・口を swapped_raw で上書き
                    # → 白目・半目・口の形が正確に保持される
                    for face in faces:
                        result = _restore_expressions(result, swapped_raw, face)

                    # ════ ④ 色補正（肌色を元動画に合わせる）════
                    for face in faces:
                        bbox = face.bbox.astype(int)
                        x1=max(0,bbox[0]); y1=max(0,bbox[1])
                        x2=min(fw,bbox[2]);  y2=min(fh,bbox[3])
                        if x2 > x1+10 and y2 > y1+10:
                            orig_roi = frame[y1:y2,x1:x2].astype(np.float32)
                            swap_roi = result[y1:y2,x1:x2].astype(np.float32)
                            for c in range(3):
                                om = orig_roi[:,:,c].mean()
                                sm = swap_roi[:,:,c].mean()
                                if sm > 10:
                                    gain = np.clip(om/(sm+1e-6), 0.88, 1.12)
                                    result[y1:y2,x1:x2,c] = np.clip(
                                        swap_roi[:,:,c]*gain, 0, 255).astype(np.uint8)

                    # ════ ⑤ 時系列ブレンド（フリッカー抑制）════
                    # 前フレームと 20% 混合するだけ → ぼやけを出さず揺れを抑える
                    if prev_result is not None:
                        result = np.clip(
                            result.astype(np.float32) * 0.80
                            + prev_result.astype(np.float32) * 0.20,
                            0, 255).astype(np.uint8)
                    prev_result = result.copy()

                out_writer.write(result)
                frame_idx += 1
                if frame_idx % 10 == 0:
                    pct = 26 + int(frame_idx / total * 68)
                    _set_progress(pct,
                        f"フレーム {frame_idx}/{total} | 入替: {swapped_count} | 未検出: {no_face_count}")
                    print(f"[df] {frame_idx}/{total} swap={swapped_count} noface={no_face_count}")

            cap.release()
            out_writer.release()
            _set_progress(98, "🎬 H.264 エンコード中...")

            # ── mp4 変換（H.264）+ ターゲット動画の音声を合成 ───────────
            final_path = os.path.join(tmpdir, "final.mp4")
            try:
                import imageio_ffmpeg, subprocess
                ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                # まず元動画に音声トラックがあるか確認
                probe = subprocess.run(
                    [ffmpeg_exe, "-i", video_path],
                    capture_output=True, timeout=30
                )
                has_audio = b"Audio" in probe.stderr

                cmd = [ffmpeg_exe, "-y",
                       "-i", output_path,       # 処理済み映像
                ]
                if has_audio:
                    cmd += ["-i", video_path,   # 元動画（音声取得用）
                            "-map", "0:v:0",    # 映像: 処理済みから
                            "-map", "1:a:0",    # 音声: 元動画から
                            "-c:a", "aac", "-b:a", "192k",  # 音声は AAC 高品質
                    ]
                else:
                    cmd += ["-map", "0:v:0"]

                cmd += [
                    "-vcodec", "libx264", "-preset", "slow",
                    "-crf", "10",
                    "-vf", "unsharp=5:5:1.2:5:5:0",
                    "-profile:v", "high", "-level", "4.1",
                    "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart",
                    final_path
                ]
                ret = subprocess.run(cmd, capture_output=True, timeout=600)
                if ret.returncode != 0:
                    print(f"[encode] ffmpeg stderr: {ret.stderr.decode(errors='replace')[-500:]}")
                video_out_path = final_path if (ret.returncode == 0 and os.path.exists(final_path)) else output_path
            except Exception as enc_err:
                print(f"[encode] ffmpeg失敗、mp4vで返します: {enc_err}")
                video_out_path = output_path

            with open(video_out_path, "rb") as f:
                video_data = f.read()

            _set_progress(100, "完了")
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Length", len(video_data))
            self.send_header("Content-Disposition", "attachment; filename=deepfake.mp4")
            self.send_cors()
            self.end_headers()
            self.wfile.write(video_data)

            # 一時ファイル削除
            import shutil
            shutil.rmtree(tmpdir, ignore_errors=True)

        except Exception as e:
            import traceback
            err_msg = json.dumps({"error": str(e), "detail": traceback.format_exc()}).encode()
            self._send_error(500, err_msg)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """並列リクエスト対応（生成中でもUIが固まらない）"""
    daemon_threads = True


class ThreadedHTTPServerV6(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """IPv6 対応版（::1 でもアクセス可能）"""
    daemon_threads = True
    address_family = socket.AF_INET6
    allow_reuse_address = True


if __name__ == "__main__":
    # 起動時に HuggingFace DNS 解決テスト（新エンドポイント）
    import socket as _sock
    try:
        test_ip = _sock.gethostbyname("router.huggingface.co")
        print(f"HuggingFace DNS: router.huggingface.co -> {test_ip}")
    except Exception as e:
        print(f"HuggingFace DNS fail: {e}")

    # IPv4 (127.0.0.1) と IPv6 (::1) の両方でリッスン
    import threading
    server4 = ThreadedHTTPServer(("127.0.0.1", PORT), ProxyHandler)
    try:
        server6 = ThreadedHTTPServerV6(("::1", PORT), ProxyHandler)
        t6 = threading.Thread(target=server6.serve_forever, daemon=True)
        t6.start()
        print(f"Proxy IPv6 ::1:{PORT} listening")
    except Exception as e:
        server6 = None
        print(f"IPv6 not available: {e}")

    server = server4
    print(f"Proxy started: http://localhost:{PORT}")
    print(f"   SD WebUI:        {SD_API}")
    print(f"   HuggingFace:     {HF_API} (via /hfapi/)")
    print(f"   Pollinations.ai: {POL_API} (via /polapi/)")
    print(f"   Gemini API:      {GEMINI_API} (via /geminiapi/)")
    print(f"   Ctrl+C で停止")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n停止しました")
