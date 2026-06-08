'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, PageHeader, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const SECTIONS = [
  { key: /①統計的傾向([\s\S]+?)(?=②|$)/, label: '統計的傾向', color: '#6366F1', icon: '📊' },
  { key: /②心理学的考察([\s\S]+?)(?=③|$)/, label: '心理学的考察', color: '#A78BFA', icon: '🧩' },
  { key: /③今後の指針([\s\S]+?)$/, label: '今後の指針', color: '#34D399', icon: '🧭' },
];

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
      if (auth?.user) { const r = await getHistoryRemote('fate', auth.user.id); setHistory(r || getHistoryLocal('fate')); }
      else setHistory(getHistoryLocal('fate'));
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
    const prompt = `mystical fate oracle, cosmic destiny, ${q.slice(0, 30)}, glowing runes, deep purple nebula, crystal ball, ethereal light, cinematic, ultra detailed, no text, no people`;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=560&height=260&nologo=true&seed=${Date.now()}`);
    await saveHistory('fate', `${name}｜${q}`, r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('fate', auth.user.id) : getHistoryLocal('fate');
    setHistory(h || []);
    setLoading(false);
  };

  const parsed = SECTIONS.map(s => ({ ...s, text: res.match(s.key)?.[1]?.trim() || '' })).filter(s => s.text);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <PageHeader icon="🔮" title="運命診断" sub="統計と心理学が「運命」を解析する" color="#7C3AED" />
      <AuthBadge />

      {step === 0 && !res && (
        <div>
          <Label>あなたのお名前</Label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例：田中 太郎"
            style={{
              width: "100%", padding: "14px 16px", background: "#080A18",
              border: "1px solid #1E2448", borderRadius: 12, color: "#E2E8FF",
              fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", marginBottom: 16,
            }}
            onFocus={e => { e.target.style.borderColor = '#6366F155'; e.target.style.boxShadow = '0 0 0 3px #6366F110'; }}
            onBlur={e => { e.target.style.borderColor = '#1E2448'; e.target.style.boxShadow = 'none'; }}
          />
          <Btn onClick={() => setStep(1)} disabled={!name.trim()}>次へ →</Btn>
        </div>
      )}

      {step === 1 && !res && (
        <div>
          <Label>{name}さんが今、最も気になっていることは？</Label>
          <TA value={q} onChange={setQ} placeholder="例：転職すべきか迷っている…" rows={5} />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => setStep(0)} style={{
              padding: "12px 18px", background: "transparent",
              border: "1px solid #1E2448", borderRadius: 10,
              color: "#5A6890", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}>← 戻る</button>
            <Btn onClick={run} disabled={!q.trim()} style={{ flex: 1 }}>🔮 解析する</Btn>
          </div>
        </div>
      )}

      {loading && <Loading />}

      {res && !loading && (
        <div>
          {imgUrl && (
            <div style={{
              borderRadius: 16, overflow: "hidden", marginBottom: 20,
              background: "#050A1A", minHeight: imgLoaded ? 0 : 200,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #1E2448",
            }}>
              {!imgLoaded && <div style={{ color: "#3A4870", fontSize: 13 }}>ビジョンを生成中…</div>}
              <img src={imgUrl} alt="fate vision" onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", display: imgLoaded ? "block" : "none", opacity: 0.92 }} />
            </div>
          )}

          <div style={{
            padding: "14px 18px", marginBottom: 16,
            background: "linear-gradient(135deg, #0E0B1E, #0A0C1E)",
            border: "1px solid #2A2060", borderRadius: 12,
          }}>
            <div style={{ color: "#7C6FFF", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>🔮 {name}さんへの解析</div>
            <div style={{ color: "#E2E8FF", fontSize: 13 }}>「{q.slice(0, 50)}{q.length > 50 ? '…' : ''}」</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {parsed.length > 0 ? parsed.map((s, i) => (
              <div key={i} style={{
                padding: "16px 18px", background: "#0A0C1E",
                border: `1px solid ${s.color}28`, borderLeft: `3px solid ${s.color}`, borderRadius: 12,
              }}>
                <div style={{ color: s.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{s.icon} {s.label}</div>
                <div style={{ color: "#C8D0E8", fontSize: 13, lineHeight: 1.9 }}>{s.text}</div>
              </div>
            )) : (
              <div style={{ padding: "16px 18px", background: "#0A0C1E", borderRadius: 12,
                border: "1px solid #1E2448", color: "#C8D0E8", fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {res}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setRes(''); setImgUrl(''); setStep(0); setName(''); setQ(''); }} style={{
              flex: 1, padding: "12px", background: "transparent",
              border: "1px solid #1E2448", borderRadius: 10,
              color: "#5A6890", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>もう一度</button>
            <button onClick={() => share(`${name}の運命診断`, `「${q}」\n\n${res}`)} style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg, #6366F1, #A78BFA)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => { setRes(item.result); setStep(1); }} />
    </div>
  );
}
