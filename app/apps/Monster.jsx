'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

function buildImagePrompt(monsterText) {
  const name = monsterText.match(/【名前】([^\n]+)/)?.[1]?.trim() || 'monster';
  const type = monsterText.match(/【タイプ】([^\n]+)/)?.[1]?.trim() || '';
  const feat = monsterText.match(/【特徴】([\s\S]+?)(?=【|$)/)?.[1]?.replace(/\n/g,' ').trim().slice(0,80) || '';
  return `fantasy creature, ${name}, ${type}, ${feat}, dark background, dramatic lighting, digital art, high detail`;
}

export default function Monster() {
  const auth = useAuth();
  const [diary, setDiary] = useState('');
  const [res, setRes] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const remote = await getHistoryRemote('monster', auth.user.id);
        setHistory(remote || getHistoryLocal('monster'));
      } else {
        setHistory(getHistoryLocal('monster'));
      }
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    setLoading(true); setImgUrl(''); setImgLoaded(false);
    const r = await callAI(
      "あなたは言葉から「感情モンスター」を召喚するクリエイターです。出力：\n【名前】カタカナ3〜5文字\n【タイプ】例：迷いの翼型\n【特徴】外見を3行で描写\n【スキル】感情から生まれた特殊能力2つ\n【一言】モンスターがあなたに言う言葉\nテキスト絵文字も使う。",
      `今日の日記：\n${diary}`
    );
    setRes(r);
    const prompt = buildImagePrompt(r);
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`);
    await saveHistory('monster', diary.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? (await getHistoryRemote('monster', auth.user.id)) : getHistoryLocal('monster');
    setHistory(h || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>👾</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>言葉モンスター</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>あなたの言葉から、唯一無二の存在が生まれる</p>
      <AuthBadge />
      <Label>今日の気持ちや出来事を書いてください</Label>
      <TA value={diary} onChange={setDiary}
        placeholder="例：会議でうまく話せなかった。でも帰り道の夕焼けがきれいで、少し救われた…" rows={5} />
      <Btn onClick={run} disabled={!diary.trim()} color="#059669" style={{ marginTop: 12 }}>モンスターを召喚</Btn>
      {loading && <Loading />}
      {res && !loading && (
        <div style={{ marginTop: 16, background: "#0A0F26", borderRadius: 12, border: "1px solid #2A3070", overflow: "hidden" }}>
          {imgUrl && (
            <div style={{ position: "relative", background: "#050A18", minHeight: imgLoaded ? 0 : 200,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!imgLoaded && <div style={{ color: "#4A5880", fontSize: 13 }}>モンスター生成中...</div>}
              <img src={imgUrl} alt="monster" onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", display: imgLoaded ? "block" : "none", borderRadius: "12px 12px 0 0" }} />
            </div>
          )}
          <div style={{ padding: 20, color: "#C5D0F0", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{res}</div>
          <div style={{ borderTop: "1px solid #2A3070", padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => share('言葉モンスター召喚！', res)} style={{
              background: "none", border: "1px solid #2A3070", borderRadius: 8,
              color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
            }}>シェア / コピー</button>
          </div>
        </div>
      )}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
