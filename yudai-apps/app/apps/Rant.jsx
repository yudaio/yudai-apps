'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, PageHeader, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const VIEWS = [
  { key: /【哲学的視点】([\s\S]+?)(?=【|$)/, label: '哲学的視点', icon: '🏛️', color: '#A78BFA' },
  { key: /【データ的視点】([\s\S]+?)(?=【|$)/, label: 'データ的視点', icon: '📊', color: '#38BDF8' },
  { key: /【人間的視点】([\s\S]+?)(?=【|$)/, label: '人間的視点', icon: '💬', color: '#34D399' },
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

  const parsed = VIEWS.map(v => ({ ...v, text: res.match(v.key)?.[1]?.trim() || '' })).filter(v => v.text);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <PageHeader icon="💢" title="鬱憤爆発" sub="理不尽を哲学・データ・人間の3視点で解剖" color="#DC2626" />
      <AuthBadge />

      {!res && (
        <div>
          <Label>理不尽だと思うこと・社会への問いを入力してください</Label>
          <TA value={topic} onChange={setTopic} placeholder="例：なぜ努力しても賃金が上がらないのか。" rows={4} />
          <button onClick={run} disabled={!topic.trim()} style={{
            marginTop: 14, width: "100%", padding: "13px",
            background: topic.trim() ? "linear-gradient(135deg, #DC2626, #EF4444)" : "#111428",
            border: topic.trim() ? "none" : "1px solid #1E2448",
            borderRadius: 10, color: topic.trim() ? "#fff" : "#2A3460",
            fontSize: 14, fontWeight: 700, cursor: topic.trim() ? "pointer" : "default",
            fontFamily: "inherit", boxShadow: topic.trim() ? "0 4px 16px #DC262630" : "none",
          }}>
            💢 解剖する
          </button>
        </div>
      )}

      {loading && <Loading />}

      {res && !loading && (
        <div>
          <div style={{
            padding: "14px 18px", marginBottom: 16,
            background: "linear-gradient(135deg, #1A0808, #0E0808)",
            border: "1px solid #DC262628", borderRadius: 12,
          }}>
            <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>💢 解剖テーマ</div>
            <div style={{ color: "#E2E8FF", fontSize: 14 }}>「{topic}」</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {parsed.map((v, i) => (
              <div key={i} style={{
                padding: "16px 18px", background: "#0A0C1E",
                border: `1px solid ${v.color}25`, borderLeft: `3px solid ${v.color}`, borderRadius: 12,
              }}>
                <div style={{ color: v.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{v.icon} {v.label}</div>
                <div style={{ color: "#C8D0E8", fontSize: 13, lineHeight: 1.9 }}>{v.text}</div>
              </div>
            ))}
          </div>

          {question && (
            <div style={{
              padding: "20px 22px", marginBottom: 16,
              background: "linear-gradient(135deg, #14082A, #0A0C1E)",
              border: "1px solid #A78BFA30", borderRadius: 14,
              textAlign: "center",
            }}>
              <div style={{ color: "#A78BFA", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>🤔 あなたへの問い</div>
              <div style={{ color: "#E8D8FF", fontSize: 15, lineHeight: 1.8, fontStyle: "italic" }}>
                「{question}」
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setRes(''); setQuestion(''); }} style={{
              flex: 1, padding: "12px", background: "transparent",
              border: "1px solid #1E2448", borderRadius: 10,
              color: "#5A6890", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>別のテーマ</button>
            <button onClick={() => share(`「${topic}」を3視点で解剖`, res)} style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg, #DC2626, #EF4444)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => { setRes(item.result); const t = history.find(h => h.result === item.result); if (t) setTopic(t.input); }} />
    </div>
  );
}
