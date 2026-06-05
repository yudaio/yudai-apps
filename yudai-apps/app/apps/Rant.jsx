'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, ResultCard, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

export default function Rant() {
  const auth = useAuth();
  const [topic, setTopic] = useState('');
  const [res, setRes] = useState('');
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
    setLoading(true);
    const r = await callAI(
      "あなたはAIジャーナリストです。社会問題を哲学・データ・人間の3視点で公平に解剖します。出力：\n【哲学的視点】本質的な矛盾や構造を2〜3文\n【データ的視点】統計や研究が示す事実を2〜3文\n【人間的視点】当事者が感じていることを2〜3文\n【問い】読者に残す哲学的な問いかけを1文",
      `テーマ：${topic}`
    );
    setRes(r);
    await saveHistory('rant', topic, r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('rant', auth.user.id) : getHistoryLocal('rant');
    setHistory(h || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>💢</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>鬱憤爆発</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>AIが社会問題を哲学・データ・人間の3視点で解剖</p>
      <AuthBadge />
      <Label>理不尽だと思うこと・社会への問いを入力してください</Label>
      <TA value={topic} onChange={setTopic} placeholder="例：なぜ努力しても賃金が上がらないのか。" rows={4} />
      <Btn onClick={run} disabled={!topic.trim()} color="#CC3333" style={{ marginTop: 12 }}>解剖する</Btn>
      {loading && <Loading />}
      {res && !loading && <ResultCard text={res} onShare={() => share(`「${topic}」を解剖する`, res)} />}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
