'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, ResultCard, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

export default function Fate() {
  const auth = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [res, setRes] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const r = await getHistoryRemote('fate', auth.user.id);
        setHistory(r || getHistoryLocal('fate'));
      } else setHistory(getHistoryLocal('fate'));
    }
    load();
  }, [auth?.user]);

  const run = async () => {
    setLoading(true);
    const r = await callAI(
      "あなたは進化心理学・行動経済学・統計学の専門家です。答えは3セクション（①統計的傾向 ②心理学的考察 ③今後の指針）で、各3〜4文。日本語で。",
      `名前：${name}\n問い：${q}`
    );
    setRes(r);
    await saveHistory('fate', `${name}｜${q}`, r, auth?.user?.id);
    const h = auth?.user ? await getHistoryRemote('fate', auth.user.id) : getHistoryLocal('fate');
    setHistory(h || []);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔮</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>運命診断</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>統計と心理学が「運命」を解析する</p>
      <AuthBadge />
      {step === 0 && <>
        <Label>あなたのお名前</Label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="例：田中 太郎"
          style={{ width: "100%", padding: "12px", background: "#0A0D20", border: "1px solid #182040",
            borderRadius: 10, color: "#C5D0F0", fontSize: 14, fontFamily: "inherit",
            boxSizing: "border-box", marginBottom: 16, outline: "none" }} />
        <Btn onClick={() => setStep(1)} disabled={!name.trim()}>次へ</Btn>
      </>}
      {step === 1 && <>
        <Label>{name}さんが今、最も気になっていることは？</Label>
        <TA value={q} onChange={setQ} placeholder="例：転職すべきか迷っている…" rows={5} />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={() => setStep(0)} color="#1A1E38">戻る</Btn>
          <Btn onClick={run} disabled={!q.trim()}>解析する</Btn>
        </div>
      </>}
      {loading && <Loading />}
      {res && !loading && <ResultCard text={res} onShare={() => share(`${name}の運命診断`, res)} />}
      <HistoryPanel items={history} onSelect={item => { setRes(item.result); setStep(1); }} />
    </div>
  );
}
