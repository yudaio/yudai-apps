'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const VIEWS = [
  { key: /【哲学的視点】([\s\S]+?)(?=【|$)/, label: '哲学的視点', icon: '🏛️', color: '#A855F7' },
  { key: /【データ的視点】([\s\S]+?)(?=【|$)/, label: 'データ的視点', icon: '📊', color: '#5B7BFF' },
  { key: /【人間的視点】([\s\S]+?)(?=【|$)/, label: '人間的視点', icon: '💬', color: '#3AFF8A' },
];

export default function Rant() {
  const auth = useAuth();
  const [topic, setTopic] = useState('');
  const [res, setRes] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      if (auth?.user) { const r = await getHistoryRemote('rant', auth.user.id); setHistory(r || getHistoryLocal('rant')); }
      else setHistory(getHistoryLocal('rant'));
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    setLoading(true); setRes(''); setQuestion('');
    const r = await callAI(
      "あなたはAIジャーナリストです。社会問題を哲学・データ・人間の3視点で公平に解剖します。出力：\n【哲学的視点】本質的な矛盾や構造を2〜3文\n【データ的視点】統計や研究が示す事実を2〜3文\n【人間的視点】当事者が感じていることを2〜3文\n【問い】読者に残す哲学的な問いかけを1文",
      `テーマ：${topic}`
    );
    setRes(r);
    const q = r.match(/【問い】([\s\S]+?)$/)?.[1]?.trim() || '';
    setQuestion(q);
    await saveHistory('rant', topic, r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('rant', auth.user.id) : getHistoryLocal('rant');
    setHistory(h || []);
    setLoading(false);
  };

  const parsed = VIEWS.map(v => ({
    ...v, text: res.match(v.key)?.[1]?.trim() || ''
  })).filter(v => v.text);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>💢</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>鬱憤爆発</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>理不尽を3つの視点で解剖する</p>
      <AuthBadge />

      {!res && <>
        <Label>理不尽だと思うこと・社会への問いを入力してください</Label>
        <TA value={topic} onChange={setTopic} placeholder="例：なぜ努力しても賃金が上がらないのか。" rows={4} />
        <Btn onClick={run} disabled={!topic.trim()} color="#CC3333" style={{ marginTop: 12 }}>解剖する</Btn>
      </>}

      {loading && <Loading />}

      {res && !loading && (
        <div style={{ marginTop: 8 }}>
          <div style={{ padding: "10px 16px", background: "#1A0808",
            border: "1px solid #CC333333", borderRadius: 10, marginBottom: 16 }}>
            <span style={{ color: "#CC3333", fontSize: 11, fontWeight: 700 }}>💢 解剖テーマ</span>
            <div style={{ color: "#C5D0F0", fontSize: 14, marginTop: 4 }}>「{topic}」</div>
          </div>

          {parsed.map((v, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "16px",
              background: "#0A0D20", border: `1px solid ${v.color}33`,
              borderLeft: `3px solid ${v.color}`, borderRadius: 10 }}>
              <div style={{ color: v.color, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                {v.icon} {v.label}
              </div>
              <div style={{ color: "#C5D0F0", fontSize: 13, lineHeight: 1.9 }}>{v.text}</div>
            </div>
          ))}

          {question && (
            <div style={{ margin: "16px 0", padding: "18px 20px",
              background: "linear-gradient(135deg, #1A0A2A, #0A0D20)",
              border: "1px solid #A855F744", borderRadius: 12,
              textAlign: "center" }}>
              <div style={{ color: "#A855F7", fontSize: 11, marginBottom: 8 }}>🤔 あなたへの問い</div>
              <div style={{ color: "#E8D8FF", fontSize: 15, lineHeight: 1.8, fontStyle: "italic" }}>
                「{question}」
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setRes(''); setQuestion(''); }} style={{
              flex: 1, padding: "11px", background: "transparent",
              border: "1px solid #182040", borderRadius: 10,
              color: "#4A5880", fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>別のテーマ</button>
            <button onClick={() => share(`「${topic}」を3視点で解剖`, `${res}`)} style={{
              flex: 1, padding: "11px", background: "#CC3333",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => { setRes(item.result); const t = history.find(h => h.result === item.result); if (t) setTopic(t.input); }} />
    </div>
  );
}
