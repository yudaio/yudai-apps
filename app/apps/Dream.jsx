'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

export default function Dream() {
  const auth = useAuth();
  const [dream, setDream] = useState('');
  const [res, setRes] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

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
    setLoading(true); setImgUrl(''); setImgLoaded(false);
    const r = await callAI(
      "あなたは夢を詩的散文に変換するアーティストです。出力：\n【タイトル】夢の本質を捉えた詩的なタイトル\n【映像詩】200〜250字、情景・色・温度・音を織り込んだ散文詩\n【この夢が映す感情】1〜2文の心理的考察\nあいまいな描写も積極的に拡張してください。",
      `見た夢：\n${dream}`
    );
    setRes(r);
    const title = r.match(/【タイトル】([^\n]+)/)?.[1]?.trim() || 'surreal dreamscape';
    const prose = r.match(/【映像詩】([\s\S]+?)(?=【|$)/)?.[1]?.replace(/\n/g,' ').slice(0,100) || '';
    const imgPrompt = `${title}, ${prose}, ethereal, surreal, soft glow, dreamlike, watercolor, cinematic`;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=512&height=320&nologo=true`);
    await saveHistory('dream', dream.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? (await getHistoryRemote('dream', auth.user.id)) : getHistoryLocal('dream');
    setHistory(h || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🌙</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>夢映像化</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>消えゆく夢を詩的散文として永遠に</p>
      <AuthBadge />
      <Label>覚えている夢の断片を、思い出したまま書いてください</Label>
      <TA value={dream} onChange={setDream}
        placeholder="例：知らない街にいた。空の色がおかしくてオレンジと青が混ざっていた…" rows={5} />
      <Btn onClick={run} disabled={!dream.trim()} color="#0D6B6B" style={{ marginTop: 12 }}>夢を映像化する</Btn>
      {loading && <Loading />}
      {res && !loading && (
        <div style={{ marginTop: 16, background: "#050B18", borderRadius: 12, border: "1px solid #0A2040", overflow: "hidden" }}>
          {imgUrl && (
            <div style={{ background: "#030810", minHeight: imgLoaded ? 0 : 160,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imgLoaded && <div style={{ color: "#4A5880", fontSize: 13 }}>夢の映像を生成中...</div>}
              <img src={imgUrl} alt="dream" onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", display: imgLoaded ? "block" : "none", opacity: 0.85, borderRadius: "12px 12px 0 0" }} />
            </div>
          )}
          <div style={{ padding: 20, color: "#90C0E0", fontSize: 14, lineHeight: 2, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{res}</div>
          <div style={{ borderTop: "1px solid #0A2040", padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => share('夢の記録', res)} style={{
              background: "none", border: "1px solid #0A2040", borderRadius: 8,
              color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
            }}>シェア / コピー</button>
          </div>
        </div>
      )}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
