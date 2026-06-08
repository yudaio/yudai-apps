'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const SECTIONS = [
  { key: /【削除推奨】([\s\S]+?)(?=【|$)/, label: '削除推奨', icon: '🗑️', color: '#FF5A5A', desc: '認知負荷が高く、価値が低い' },
  { key: /【最適化推奨】([\s\S]+?)(?=【|$)/, label: '最適化推奨', icon: '⚡', color: '#FFD93A', desc: '少し変えるだけで効率UP' },
  { key: /【維持推奨】([\s\S]+?)(?=【|$)/, label: '維持推奨', icon: '✅', color: '#3AFF8A', desc: '脳を回復させる重要な習慣' },
];

function parseTimeSaved(res) {
  const m = res.match(/(\d+)\s*時間|\d+h/);
  if (m) return parseInt(m[1] || m[0]);
  const lines = (res.match(/【削除推奨】([\s\S]+?)(?=【|$)/)?.[1] || '').split('\n').filter(Boolean);
  return lines.length * 0.5;
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
    const saved = parseTimeSaved(r);
    setTimeSaved(saved);
    await saveHistory('muda', routine.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('muda', auth.user.id) : getHistoryLocal('muda');
    setHistory(h || []);
    setLoading(false);
  };

  const parsed = SECTIONS.map(s => ({
    ...s, text: res.match(s.key)?.[1]?.trim() || ''
  })).filter(s => s.text);

  const savedMatch = res.match(/【節約時間】([\s\S]+?)$/);
  const savedText = savedMatch?.[1]?.trim() || '';

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>無駄削減</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>認知負荷を科学的に削ぎ落とす</p>
      <AuthBadge />

      {!res && <>
        <Label>一日のルーティンを書いてください（箇条書きOK）</Label>
        <TA value={routine} onChange={setRoutine} placeholder={`例：\n・朝SNS30分\n・通勤1時間でメール\n・会議3本`} rows={7} />
        <Btn onClick={run} disabled={!routine.trim()} style={{ marginTop: 12 }}>分析する</Btn>
      </>}

      {loading && <Loading />}

      {res && !loading && (
        <div style={{ marginTop: 8 }}>
          {savedText && (
            <div style={{
              padding: "20px", marginBottom: 16,
              background: "linear-gradient(135deg, #0A1A10, #0A1220)",
              border: "1px solid #3AFF8A44", borderRadius: 14,
              textAlign: "center"
            }}>
              <div style={{ color: "#4A5880", fontSize: 11, marginBottom: 4 }}>週あたりの推定節約時間</div>
              <div style={{ color: "#3AFF8A", fontSize: 32, fontWeight: 700 }}>{savedText}</div>
              <div style={{ color: "#4A5880", fontSize: 11, marginTop: 4 }}>= 年間で {Math.round(timeSaved * 52)}時間以上</div>
            </div>
          )}

          {parsed.map((s, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "16px",
              background: "#0A0D20", border: `1px solid ${s.color}33`,
              borderLeft: `3px solid ${s.color}`, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.icon} {s.label}</span>
                <span style={{ color: s.color + "88", fontSize: 10 }}>{s.desc}</span>
              </div>
              <div style={{ color: "#C5D0F0", fontSize: 13, lineHeight: 1.9 }}>{s.text}</div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => setRes('')} style={{
              flex: 1, padding: "11px", background: "transparent",
              border: "1px solid #182040", borderRadius: 10,
              color: "#4A5880", fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>再分析</button>
            <button onClick={() => share('無駄削減分析', `${savedText ? `週${savedText}の節約\n\n` : ''}${res}`)} style={{
              flex: 1, padding: "11px", background: "#0891B2",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}>シェア</button>
          </div>
        </div>
      )}

      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
