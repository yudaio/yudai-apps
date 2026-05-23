'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, ResultCard, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

export default function Muda() {
  const auth = useAuth();
  const [routine, setRoutine] = useState('');
  const [res, setRes] = useState('');
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
    setLoading(true);
    const r = await callAI(
      "あなたは認知負荷研究の専門家です。ルーティンを分析し出力：\n【削除推奨】認知負荷が高く価値が低い習慣2〜3つ（各1〜2文の根拠付き）\n【最適化推奨】少し変えるだけで効率が上がるもの\n【維持推奨】脳を回復させる重要な習慣",
      `ルーティン：\n${routine}`
    );
    setRes(r);
    await saveHistory('muda', routine.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('muda', auth.user.id) : getHistoryLocal('muda');
    setHistory(h || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>無駄削減</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>認知負荷を科学的に削ぎ落とす</p>
      <AuthBadge />
      <Label>一日のルーティンを書いてください（箇条書きOK）</Label>
      <TA value={routine} onChange={setRoutine} placeholder={`例：\n・朝SNS30分\n・通勤1時間でメール\n・会議3本`} rows={7} />
      <Btn onClick={run} disabled={!routine.trim()} style={{ marginTop: 12 }}>分析する</Btn>
      {loading && <Loading />}
      {res && !loading && <ResultCard text={res} onShare={() => share('無駄削減分析', res)} />}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
