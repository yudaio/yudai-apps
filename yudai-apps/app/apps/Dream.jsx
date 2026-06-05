'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const T = {
  ja: {
    title: "夢映像化",
    subtitle: "消えゆく夢を詩的散文として永遠に",
    inputLabel: "覚えている夢の断片を、思い出したまま書いてください",
    placeholder: "例：知らない街にいた。空の色がおかしくてオレンジと青が混ざっていた…",
    btn: "夢を映像化する",
    generating: "夢の映像を生成中...",
    shareBtn: "シェア / コピー",
    shareTitle: "夢の記録",
    titleKey: /【タイトル】([^\n]+)/,
    proseKey: /【映像詩】([\s\S]+?)(?=【|$)/,
    system: `あなたは夢を詩的散文に変換するアーティストです。出力：
【タイトル】夢の本質を捉えた詩的なタイトル
【映像詩】200〜250字、情景・色・温度・音を織り込んだ散文詩
【この夢が映す感情】1〜2文の心理的考察
あいまいな描写も積極的に拡張してください。`,
    userPrompt: (dream) => `見た夢：\n${dream}`,
  },
  en: {
    title: "Dream Visuals",
    subtitle: "Turn your fading dreams into poetry that lasts forever",
    inputLabel: "Write down whatever fragments of your dream you remember",
    placeholder: "e.g. I was in a city I didn't recognize. The sky was a strange mix of orange and blue…",
    btn: "Visualize My Dream",
    generating: "Painting your dream…",
    shareBtn: "Share / Copy",
    shareTitle: "My Dream Record",
    titleKey: /\[Title\]([^\n]+)/,
    proseKey: /\[Visual Poem\]([\s\S]+?)(?=\[|$)/,
    system: `You are an artist who transforms dreams into poetic prose. Output:
[Title] A poetic title that captures the essence of the dream
[Visual Poem] 150-200 words weaving in scenery, color, temperature, and sound
[Emotion this dream reflects] 1-2 sentences of psychological insight
Actively expand vague or fragmented descriptions into vivid imagery.`,
    userPrompt: (dream) => `Dream I had:\n${dream}`,
  },
};

const LangToggle = ({ lang, setLang }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 6 }}>
    {['ja', 'en'].map(l => (
      <button key={l} onClick={() => setLang(l)} style={{
        padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
        border: `1px solid ${lang === l ? "#5B7BFF" : "#182040"}`,
        background: lang === l ? "#1A2060" : "transparent",
        color: lang === l ? "#5B7BFF" : "#4A5880", fontSize: 12,
      }}>{l.toUpperCase()}</button>
    ))}
  </div>
);

export default function Dream() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [dream, setDream] = useState('');
  const [res, setRes] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const t = T[lang];
  const gate = useGate('dream');

  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const remote = await getHistoryRemote('dream', auth.user.id);
        setHistory(remote || getHistoryLocal('dream'));
      } else {
        setHistory(getHistoryLocal('dream'));
      }
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    if (!gate.check()) return;
    setLoading(true); setImgUrl(''); setImgLoaded(false);
    const r = await callAI(t.system, t.userPrompt(dream));
    setRes(r);
    const title = r.match(t.titleKey)?.[1]?.trim() || 'surreal dreamscape';
    const prose = r.match(t.proseKey)?.[1]?.replace(/\n/g, ' ').slice(0, 100) || '';
    const imgPrompt = `${title}, ${prose}, ethereal, surreal, soft glow, dreamlike, watercolor, cinematic`;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=512&height=320&nologo=true&seed=${Date.now()}`);
    await saveHistory('dream', dream.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? (await getHistoryRemote('dream', auth.user.id)) : getHistoryLocal('dream');
    setHistory(h || []);
    gate.increment();
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <LangToggle lang={lang} setLang={setLang} />

      <div style={{ fontSize: 32, marginBottom: 8 }}>🌙</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>{t.title}</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>{t.subtitle}</p>
      <AuthBadge />
      <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang} />
      {gate.blocked && <PaywallModal onClose={gate.dismiss} lang={lang} />}

      <Label>{t.inputLabel}</Label>
      <TA value={dream} onChange={setDream} placeholder={t.placeholder} rows={5} />
      <Btn onClick={run} disabled={!dream.trim()} color="#0D6B6B" style={{ marginTop: 12 }}>{t.btn}</Btn>

      {loading && <Loading />}

      {res && !loading && (
        <div style={{ marginTop: 16, background: "#050B18", borderRadius: 12, border: "1px solid #0A2040", overflow: "hidden" }}>
          {imgUrl && (
            <div style={{ background: "#030810", minHeight: imgLoaded ? 0 : 160,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imgLoaded && <div style={{ color: "#4A5880", fontSize: 13 }}>{t.generating}</div>}
              <img src={imgUrl} alt="dream" onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", display: imgLoaded ? "block" : "none", opacity: 0.85, borderRadius: "12px 12px 0 0" }} />
            </div>
          )}
          <div style={{ padding: 20, color: "#90C0E0", fontSize: 14, lineHeight: 2, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{res}</div>
          <div style={{ borderTop: "1px solid #0A2040", padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => share(t.shareTitle, res)} style={{
              background: "none", border: "1px solid #0A2040", borderRadius: 8,
              color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
            }}>{t.shareBtn}</button>
          </div>
        </div>
      )}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
