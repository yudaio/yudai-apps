'use client';
import { useState, useRef, useCallback } from "react";
import { useApiKey } from "./ApiKeySetup";

const FREE_CREDITS = 2;

const getCredits = () => {
  try { return parseInt(localStorage.getItem("faceGlowCredits") ?? FREE_CREDITS); }
  catch { return FREE_CREDITS; }
};
const setCredits = (n) => { try { localStorage.setItem("faceGlowCredits", n); } catch {} };

const PACKS = [
  { id: "starter", label: "Starter", credits: 5, price: "¥490", color: "#c8a96e" },
  { id: "pro", label: "Pro", credits: 15, price: "¥990", color: "#e2c97e", badge: "人気" },
  { id: "elite", label: "Elite", credits: 40, price: "¥1,980", color: "#f0dfa0", badge: "お得" },
];

export default function FaceGlowApp() {
  const { getKey, save } = useApiKey();
  const [claudeKey, setClaudeKeyState] = useState(() => { try { return localStorage.getItem("ai_key_claude") || ""; } catch { return ""; } });
  const [keyInput, setKeyInput] = useState("");
  const [credits, setCreditsState] = useState(getCredits);
  const [phase, setPhase] = useState("upload"); // upload | analyzing | result | shop | keysetup
  const [imageData, setImageData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const fileRef = useRef();

  const spend = useCallback((n = 1) => {
    const next = credits - n;
    setCreditsState(next);
    setCredits(next);
    return next >= 0;
  }, [credits]);

  const addCredits = useCallback((n) => {
    const next = credits + n;
    setCreditsState(next);
    setCredits(next);
  }, [credits]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreviewUrl(dataUrl);
      setImageData(dataUrl.split(",")[1]);
      setPhase("upload");
      setAnalysis(null);
      setGeneratedUrl(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!imageData) return;
    const key = claudeKey || getKey("claude");
    if (!key) { setPhase("keysetup"); return; }
    if (credits <= 0) { setPhase("shop"); return; }
    spend(1);
    setPhase("analyzing");
    setError(null);

    try {
      const res = await fetch("/api/ai-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claudeKey: key,
          system: `You are a professional beauty consultant and AI portrait prompt engineer.
Analyze the face in the image and respond ONLY with a JSON object (no markdown, no preamble) with this structure:
{
  "score": <integer 1-10>,
  "improved_score": <integer 1-10>,
  "improvements": [
    {"area": "string", "tip": "string", "impact": "high"|"medium"|"low"}
  ],
  "portrait_prompt": "A highly detailed, professional portrait photo of an attractive East Asian man in his late 20s, sharp jaw, clear skin, well-groomed eyebrows, confident expression, styled black hair, wearing a dark shirt, studio lighting, 8k, photorealistic"
}
The portrait_prompt must be a highly specific, photorealistic prompt that describes an idealized version based on the person's existing features (same age, ethnicity, general face shape). Make improvements realistic, not fantasy. Keep improvements array to 4-5 items max. Write improvements in Japanese.`,
          imageBase64: imageData,
          mediaType: "image/jpeg",
        })
      });

      const data = await res.json();
      const text = data.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
      setPhase("result");
    } catch (err) {
      setError("分析に失敗しました。もう一度お試しください。");
      setPhase("upload");
    }
  };

  const generateImage = async () => {
    if (!analysis?.portrait_prompt) return;
    setGenLoading(true);
    setGeneratedUrl(null);
    const prompt = encodeURIComponent(analysis.portrait_prompt + ", ultra realistic, award winning photography");
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;
    setGeneratedUrl(url);
    setGenLoading(false);
  };

  const impactColor = (i) => i === "high" ? "#f0dfa0" : i === "medium" ? "#c8a96e" : "#8a7a5a";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0d0d14 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d0",
      padding: "0",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
        opacity: 0.4,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "32px 20px 60px" }}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: "#c8a96e", marginBottom: 8, textTransform: "uppercase" }}>
            AI Beauty Tech
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: 2, color: "#f0e8d8" }}>
            FACE<span style={{ color: "#c8a96e" }}>GLOW</span>
          </h1>
          <p style={{ fontSize: 13, color: "#7a7060", marginTop: 8, letterSpacing: 1 }}>
            AIが診断 · 理想の顔を可視化
          </p>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: 8, padding: "10px 16px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: "#c8a96e", letterSpacing: 1 }}>
            ✦ 残りクレジット: <strong style={{ fontSize: 16 }}>{credits}</strong>
          </div>
          <button onClick={() => setPhase("shop")} style={{
            background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)",
            color: "#c8a96e", borderRadius: 4, padding: "4px 12px", fontSize: 11,
            cursor: "pointer", letterSpacing: 1,
          }}>
            チャージ +
          </button>
        </div>

        {phase === "keysetup" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 400, textAlign: "center", marginBottom: 8, color: "#f0e8d8" }}>
              🔑 Claude APIキーが必要です
            </h2>
            <p style={{ fontSize: 12, color: "#7a7060", textAlign: "center", marginBottom: 20, lineHeight: 1.7 }}>
              FaceGlowは顔画像の解析にClaude AIを使用します。<br />
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                style={{ color: "#c8a96e" }}>console.anthropic.com</a> でキーを取得してください。
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              style={{
                width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(200,169,110,0.3)", borderRadius: 8,
                color: "#e8e0d0", fontSize: 14, fontFamily: "inherit", outline: "none",
                boxSizing: "border-box", marginBottom: 12,
              }}
            />
            <button onClick={() => {
              const k = keyInput.trim();
              if (!k) return;
              save("claude", k);
              setClaudeKeyState(k);
              setKeyInput("");
              setPhase("upload");
            }} disabled={!keyInput.trim()} style={{
              width: "100%", background: keyInput.trim() ? "linear-gradient(135deg, #c8a96e, #e2c97e)" : "#2a2820",
              border: "none", color: keyInput.trim() ? "#000" : "#4a4438",
              padding: 12, borderRadius: 8, cursor: keyInput.trim() ? "pointer" : "not-allowed",
              fontSize: 14, letterSpacing: 1, fontWeight: 600, marginBottom: 10,
            }}>保存して使う</button>
            <button onClick={() => setPhase("upload")} style={{
              display: "block", width: "100%",
              background: "transparent", border: "1px solid #2a2820",
              color: "#5a5040", padding: "10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
            }}>← 戻る</button>
          </div>
        )}

        {phase === "shop" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 400, textAlign: "center", marginBottom: 20, color: "#f0e8d8" }}>
              クレジットを追加
            </h2>
            {PACKS.map(p => (
              <div key={p.id} onClick={() => { addCredits(p.credits); setPhase("upload"); }}
                style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}44`,
                  borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                <div>
                  <div style={{ fontSize: 14, color: p.color, letterSpacing: 1 }}>
                    {p.label} {p.badge && <span style={{ fontSize: 10, background: p.color, color: "#000", borderRadius: 3, padding: "1px 5px", marginLeft: 6 }}>{p.badge}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#7a7060", marginTop: 2 }}>{p.credits} クレジット</div>
                </div>
                <div style={{ fontSize: 18, color: p.color, fontWeight: 300 }}>{p.price}</div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#4a4438", textAlign: "center", marginTop: 12 }}>
              ※ デモ版のため決済は発生しません。本番ではStripe連携
            </p>
            <button onClick={() => setPhase("upload")} style={{
              display: "block", width: "100%", marginTop: 8,
              background: "transparent", border: "1px solid #2a2820",
              color: "#5a5040", padding: "10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
            }}>← 戻る</button>
          </div>
        )}

        {(phase === "upload" || phase === "analyzing") && (
          <div>
            <div
              onClick={() => phase !== "analyzing" && fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: `2px dashed ${previewUrl ? "rgba(200,169,110,0.4)" : "rgba(200,169,110,0.2)"}`,
                borderRadius: 12, padding: previewUrl ? 0 : "48px 20px",
                textAlign: "center", cursor: phase === "analyzing" ? "default" : "pointer",
                background: "rgba(255,255,255,0.02)", overflow: "hidden",
              }}>
              {previewUrl ? (
                <img src={previewUrl} alt="preview" style={{ width: "100%", display: "block", borderRadius: 10 }} />
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
                  <div style={{ fontSize: 14, color: "#c8a96e", letterSpacing: 1 }}>写真をドロップ または タップ</div>
                  <div style={{ fontSize: 11, color: "#4a4438", marginTop: 8 }}>JPG / PNG 対応</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />

            {error && <div style={{ color: "#e08060", fontSize: 12, textAlign: "center", marginTop: 12 }}>{error}</div>}

            {previewUrl && phase !== "analyzing" && (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={() => { setPreviewUrl(null); setImageData(null); }} style={{
                  flex: 1, background: "transparent", border: "1px solid #2a2820",
                  color: "#5a5040", padding: 12, borderRadius: 8, cursor: "pointer", fontSize: 12,
                }}>やり直す</button>
                <button onClick={analyze} disabled={credits <= 0} style={{
                  flex: 2, background: credits > 0 ? "linear-gradient(135deg, #c8a96e, #e2c97e)" : "#2a2820",
                  border: "none", color: credits > 0 ? "#000" : "#4a4438",
                  padding: 12, borderRadius: 8, cursor: credits > 0 ? "pointer" : "not-allowed",
                  fontSize: 14, letterSpacing: 1, fontWeight: 600,
                }}>
                  {credits <= 0 ? "クレジット不足" : `✦ AI診断する (1クレジット)`}
                </button>
              </div>
            )}

            {phase === "analyzing" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 24, marginBottom: 12, animation: "spin 2s linear infinite" }}>◈</div>
                <div style={{ fontSize: 13, color: "#c8a96e", letterSpacing: 2 }}>AI分析中...</div>
                <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
              </div>
            )}
          </div>
        )}

        {phase === "result" && analysis && (
          <div>
            <div style={{
              display: "flex", justifyContent: "center", gap: 32, marginBottom: 24,
              background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)",
              borderRadius: 12, padding: "20px",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#7a7060", letterSpacing: 2, marginBottom: 4 }}>現在</div>
                <div style={{ fontSize: 42, color: "#e8e0d0", fontWeight: 300 }}>{analysis.score}</div>
                <div style={{ fontSize: 11, color: "#4a4438" }}>/ 10</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "#c8a96e", fontSize: 20 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#c8a96e", letterSpacing: 2, marginBottom: 4 }}>改善後</div>
                <div style={{ fontSize: 42, color: "#c8a96e", fontWeight: 300 }}>{analysis.improved_score}</div>
                <div style={{ fontSize: 11, color: "#4a4438" }}>/ 10</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#7a7060", marginBottom: 12, textTransform: "uppercase" }}>
                改善ポイント
              </div>
              {analysis.improvements?.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", marginTop: 5,
                    background: impactColor(item.impact), flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, color: impactColor(item.impact), marginBottom: 3 }}>{item.area}</div>
                    <div style={{ fontSize: 12, color: "#7a7060", lineHeight: 1.6 }}>{item.tip}</div>
                  </div>
                </div>
              ))}
            </div>

            {!generatedUrl && (
              <button onClick={generateImage} disabled={genLoading} style={{
                width: "100%", background: "linear-gradient(135deg, #1a1810, #2a2418)",
                border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e",
                padding: "14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, letterSpacing: 2, marginBottom: 16,
              }}>
                {genLoading ? "生成中..." : "✦ 理想の顔を生成する"}
              </button>
            )}

            {generatedUrl && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#7a7060", marginBottom: 10, textTransform: "uppercase" }}>
                  AI生成 · 理想イメージ
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#4a4438", marginBottom: 4, textAlign: "center" }}>現在</div>
                    <img src={previewUrl} style={{ width: "100%", borderRadius: 8, display: "block" }} alt="current" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#c8a96e", marginBottom: 4, textAlign: "center" }}>改善後イメージ</div>
                    <img src={generatedUrl} style={{ width: "100%", borderRadius: 8, display: "block" }}
                      alt="generated" onError={() => setError("画像生成に失敗しました")} />
                  </div>
                </div>
                <p style={{ fontSize: 10, color: "#3a3428", textAlign: "center", marginTop: 8 }}>
                  ※ AIが生成した参考イメージです
                </p>
              </div>
            )}

            <button onClick={() => { setPhase("upload"); setAnalysis(null); setGeneratedUrl(null); }} style={{
              width: "100%", background: "transparent", border: "1px solid #2a2820",
              color: "#5a5040", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 12,
            }}>← 別の写真で試す</button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 10, color: "#2a2418", letterSpacing: 1 }}>
          FACEGLOW · Powered by Claude AI
        </div>
      </div>
    </div>
  );
}
