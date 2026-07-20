'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const SECTIONS = [
  { key: /①統計的傾向([\s\S]+?)(?=②|$)/, label: '① 統計的傾向', color: '#5B7BFF' },
  { key: /②心理学的考察([\s\S]+?)(?=③|$)/, label: '② 心理学的考察', color: '#A855F7' },
  { key: /③今後の指針([\s\S]+?)$/, label: '③ 今後の指針', color: '#3AFF8A' },
];

function buildImagePrompt(name, q, res) {
  const keyword = q.slice(0, 30);
  return `mystical fate oracle, cosmic destiny, ${keyword}, glowing runes, deep purple nebula, crystal ball, ethereal light, cinematic, ultra detailed, no text, no people`;
}

export default function Fate() {
  const auth = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [res, setRes] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const r = await getHistoryRemote('fate', auth.user.id);
        setHistory(r || getHistoryLocal('fate'));
      } else setHistory(getHistoryLocal('fate'));
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    setLoading(true); setImgUrl(''); setImgLoaded(false);
    const r = await callAI(
      "あなたは進化心理学・行動経済学・統計学の専門家です。答えは3セクション（①統計的傾向 ②心理学的考察 ③今後の指針）で、各3〜4文。日本語で。",
      `名前：${name}\n問い：${q}`
    );
    setRes(r);
    const prompt = buildImagePrompt(name, q, r);
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=560&height=280&nologo=true&seed=${Date.now()}`);
    await saveHistory('fate', `${name}｜${q}`, r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('fate', auth.user.id) : getHistoryLocal('fate');
    setHistory(h || []);
    setLoading(false);
  };

  const parsed = SECTIONS.map(s => ({
    label: s.label,
    color: s.color,
    text: res.match(s.key)?.[1]?.trim() || '',
  })).filter(s => s.text);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔮</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>運命診断</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>統計と心理学が「運命」を解析する</p>
      <AuthBadge />

      {step === 0 && <>
        <Label>あなたのお名前</Label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="例：田中 太郎"
          style={{ width: "100%", padding: "12px", background: "#0A0D20", border: "1px solid #182040",
            borderRadius: 10, color: "#C5D0F0", fontSize: 14, fontFamily: "inherit",
            boxSizing: "border-box", marginBottom: 16, outline: "none" }} />
        <Btn onClick={() => setStep(1)} disabled={!name.trim()}>次へ</Btn>
      </>}

      {step === 1 && !res && <>
        <Label>{name}さんが今、最も気になっていることは？</Label>
        <TA value={q} onChange={setQ} placeholder="例：転職すべきか迷っている…" rows={5} />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={() => setStep(0)} color="#1A1E38">戻る</Btn>
          <Btn onClick={run} disabled={!q.trim()}>解析する</Btn>
        </div>
      </>}

      {loading && <Loading />}

      {res && !loading && (
        <div style={{ marginTop: 8 }}>
          {imgUrl && (
            <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16,
              background: "#050A1A", minHeight: imgLoaded ? 0 : 200,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imgLoaded && <div style={{ color: "#4A5880", fontSize: 13 }}>ビジョンを生成中…</div>}
              <img src={imgUrl} alt="fate vision" onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", display: imgLoaded ? "block" : "none", opacity: 0.9 }} />
            </div>
          )}

          <div style={{ marginBottom: 12, padding: "10px 16px", background: "#0A0D20",
            border: "1px solid #2A2060", borderRadius: 10 }}>
            <span style={{ color: "#7C6FFF", fontSize: 12 }}>🔮 {name}さんへの解析</span>
            <div style={{ color: "#C5D0F0", fontSize: 13, marginTop: 4 }}>「{q.slice(0, 40)}{q.length > 40 ? '…' : ''}」</div>
          </div>

          {parsed.length > 0 ? parsed.map((s, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "14px 16px",
              background: "#0A0D20", border: `1px solid ${s.color}33`,
              borderLeft: `3px solid ${s.color}`, borderRadius: 10 }}>
              <div style={{ color: s.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
              <div style={{ color: "#C5D0F0", fontSize: 13, lineHeight: 1.9 }}>{s.text}</div>
            </div>
          )) : (
            <div style={{ padding: 16, background: "#0A0D20", borderRadius: 10,
              color: "#C5D0F0", fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{res}</div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { setRes(''); setImgUrl(''); }} style={{
              flex: 1, padding: "11px", background: "transparent",
              border: "1px solid #182040", borderRadius: 10,
              color: "#4A5880", fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>もう一度</button>
            <button onClick={() => share(`${name}の運命診断`, `「${q}」\n\n${res}`)} style={{
              flex: 1, padding: "11px", background: "#5B7BFF",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => { setRes(item.result); setStep(1); }} />
    </div>
  );
}
