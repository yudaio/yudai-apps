'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, PageHeader, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const SECTIONS = [
  { key: /【削除推奨】([\s\S]+?)(?=【|$)/, label: '削除推奨', icon: '🗑️', color: '#F87171', desc: '認知負荷が高く価値が低い' },
  { key: /【最適化推奨】([\s\S]+?)(?=【|$)/, label: '最適化推奨', icon: '⚡', color: '#FBBF24', desc: '少し変えるだけで効率UP' },
  { key: /【維持推奨】([\s\S]+?)(?=【|$)/, label: '維持推奨', icon: '✅', color: '#34D399', desc: '脳を回復させる重要な習慣' },
];

function parseTimeSaved(res) {
  const m = res.match(/(\d+(?:\.\d+)?)\s*時間/);
  return m ? parseFloat(m[1]) : 0;
}

export default function Muda() {
  const auth = useAuth();
  const [routine, setRoutine] = useState('');
  const [res, setRes] = useState('');
  const [timeSaved, setTimeSaved] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      if (auth?.user) { const r = await getHistoryRemote('muda', auth.user.id); setHistory(r || getHistoryLocal('muda')); }
      else setHistory(getHistoryLocal('muda'));
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    setLoading(true); setRes('');
    const r = await callAI(
      "あなたは認知負荷研究の専門家です。ルーティンを分析し出力：\n【削除推奨】認知負荷が高く価値が低い習慣2〜3つ（各1〜2文の根拠付き）\n【最適化推奨】少し変えるだけで効率が上がるもの\n【維持推奨】脳を回復させる重要な習慣\n【節約時間】これらを実践した場合の1週間あたりの推定節約時間を「約○時間」の形式で",
      `ルーティン：\n${routine}`
    );
    setRes(r);
    setTimeSaved(parseTimeSaved(r));
    await saveHistory('muda', routine.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('muda', auth.user.id) : getHistoryLocal('muda');
    setHistory(h || []);
    setLoading(false);
  };

  const parsed = SECTIONS.map(s => ({ ...s, text: res.match(s.key)?.[1]?.trim() || '' })).filter(s => s.text);
  const savedText = res.match(/【節約時間】([\s\S]+?)$/)?.[1]?.trim() || '';

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <PageHeader icon="🧠" title="無駄削減" sub="認知負荷を削ぎ落として時間を取り戻す" color="#0891B2" />
      <AuthBadge />

      {!res && (
        <div>
          <Label>一日のルーティンを書いてください（箇条書きOK）</Label>
          <TA value={routine} onChange={setRoutine} placeholder={`例：\n・朝SNS30分\n・通勤1時間でメール\n・会議3本`} rows={7} />
          <button onClick={run} disabled={!routine.trim()} style={{
            marginTop: 14, width: "100%", padding: "13px",
            background: routine.trim() ? "linear-gradient(135deg, #0891B2, #06B6D4)" : "#111428",
            border: routine.trim() ? "none" : "1px solid #1E2448",
            borderRadius: 10, color: routine.trim() ? "#fff" : "#2A3460",
            fontSize: 14, fontWeight: 700, cursor: routine.trim() ? "pointer" : "default",
            fontFamily: "inherit", boxShadow: routine.trim() ? "0 4px 16px #0891B230" : "none",
          }}>
            🧠 分析する
          </button>
        </div>
      )}

      {loading && <Loading />}

      {res && !loading && (
        <div>
          {savedText && (
            <div style={{
              padding: "24px 20px", marginBottom: 20,
              background: "linear-gradient(135deg, #061A12, #061220)",
              border: "1px solid #34D39930", borderRadius: 16, textAlign: "center",
            }}>
              <div style={{ color: "#5A6890", fontSize: 11, marginBottom: 8, letterSpacing: "0.05em" }}>
                週あたりの推定節約時間
              </div>
              <div style={{
                fontSize: 40, fontWeight: 900,
                background: "linear-gradient(135deg, #34D399, #10B981)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 6,
              }}>{savedText}</div>
              {timeSaved > 0 && (
                <div style={{ color: "#3A6A50", fontSize: 12 }}>
                  = 年間で約 <strong style={{ color: "#34D399" }}>{Math.round(timeSaved * 52)}</strong> 時間の節約
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {parsed.map((s, i) => (
              <div key={i} style={{
                padding: "16px 18px", background: "#0A0C1E",
                border: `1px solid ${s.color}25`, borderLeft: `3px solid ${s.color}`, borderRadius: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.icon} {s.label}</span>
                  <span style={{ color: s.color + "80", fontSize: 10 }}>{s.desc}</span>
                </div>
                <div style={{ color: "#C8D0E8", fontSize: 13, lineHeight: 1.9 }}>{s.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setRes('')} style={{
              flex: 1, padding: "12px", background: "transparent",
              border: "1px solid #1E2448", borderRadius: 10,
              color: "#5A6890", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>再分析</button>
            <button onClick={() => share('無駄削減分析', `${savedText ? `週${savedText}の節約\n\n` : ''}${res}`)} style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg, #0891B2, #06B6D4)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
