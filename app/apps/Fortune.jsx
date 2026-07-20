'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const ZODIAC = [
  { sign:'牡羊座', dates:'3/21〜4/19', emoji:'♈' },
  { sign:'牡牛座', dates:'4/20〜5/20', emoji:'♉' },
  { sign:'双子座', dates:'5/21〜6/20', emoji:'♊' },
  { sign:'蟹座',   dates:'6/21〜7/22', emoji:'♋' },
  { sign:'獅子座', dates:'7/23〜8/22', emoji:'♌' },
  { sign:'乙女座', dates:'8/23〜9/22', emoji:'♍' },
  { sign:'天秤座', dates:'9/23〜10/22', emoji:'♎' },
  { sign:'蠍座',   dates:'10/23〜11/21', emoji:'♏' },
  { sign:'射手座', dates:'11/22〜12/21', emoji:'♐' },
  { sign:'山羊座', dates:'12/22〜1/19', emoji:'♑' },
  { sign:'水瓶座', dates:'1/20〜2/18', emoji:'♒' },
  { sign:'魚座',   dates:'2/19〜3/20', emoji:'♓' },
];

const LUCKY_COLORS = ['深紅','橙','レモン','エメラルド','コバルト','ラベンダー','ゴールド','シルバー','ローズ','ミント'];
const LUCKY_ITEMS  = ['手帳','コイン','お守り','花','音楽','コーヒー','ミラー','本','クリスタル','星'];

function Stars({ n }) {
  const v = Math.min(5, Math.max(1, n));
  return (
    <span style={{ fontSize:15 }}>
      {'★'.repeat(v)}{'☆'.repeat(5 - v)}
    </span>
  );
}

export default function Fortune() {
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const today = new Date().toLocaleDateString('ja-JP', { month:'long', day:'numeric', weekday:'long' });
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('fortune');

  const seed = () => Math.floor(Math.random() * 1000);

  const getFortune = async (z) => {
    if (!check()) return;
    setSelected(z);
    setResult(null);
    setLoading(true);

    const color = LUCKY_COLORS[Math.floor(Math.random() * LUCKY_COLORS.length)];
    const num   = Math.floor(Math.random() * 9) + 1;
    const item  = LUCKY_ITEMS[Math.floor(Math.random() * LUCKY_ITEMS.length)];
    const score = 45 + Math.floor(Math.random() * 46) + seed() % 10 - 5;
    const love  = 1 + Math.floor(Math.random() * 5);
    const work  = 1 + Math.floor(Math.random() * 5);
    const health= 1 + Math.floor(Math.random() * 5);
    const money = 1 + Math.floor(Math.random() * 5);

    try {
      const dateStr = new Date().toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
      const res = await callAI(
        'あなたは人気の星座占い師です。ポジティブかつ具体的な言葉で運勢を伝えてください。',
        `${dateStr}の${z.sign}（${z.dates}）の運勢を150〜200文字で書いてください。恋愛・仕事・健康の要素を含め、今日どう行動すべかの具体的なアドバイスで締めること。ラッキーカラー${color}・ラッキーナンバー${num}・ラッキーアイテム${item}の要素も自然に織り交ぜてください。`
      );
      setResult({ text: res, score: Math.min(99, Math.max(30, score)), love, work, health, money, color, num, item, emoji: z.emoji, sign: z.sign });
      increment();
    } catch {
      setResult({ text: '今日も自分らしく輝ける一日です。小さなことに感謝しながら過ごしましょう。', score: 70, love: 3, work: 3, health: 4, money: 3, color, num, item, emoji: z.emoji, sign: z.sign });
    }
    setLoading(false);
  };

  const scoreColor = (s) => s >= 80 ? '#F59E0B' : s >= 60 ? '#A78BFA' : s >= 40 ? '#38BDF8' : '#FB7185';

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <UsageBadge remaining={remaining} premium={premium} />
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🌟</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 6px', letterSpacing:'-0.02em' }}>今日の運勢</h1>
        <p style={{ fontSize:12, color:'#5A6890', margin:0 }}>{today}</p>
      </div>

      {/* Zodiac grid */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, color:'#5A6890', marginBottom:10 }}>あなたの星座を選んでください</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {ZODIAC.map(z => (
            <button
              key={z.sign}
              onClick={() => getFortune(z)}
              disabled={loading}
              style={{
                padding:'10px 4px',
                background: selected?.sign===z.sign ? 'rgba(124,92,252,0.22)' : 'rgba(12,10,30,0.6)',
                border:`1px solid ${selected?.sign===z.sign ? 'rgba(124,92,252,0.45)' : 'rgba(99,102,241,0.1)'}`,
                borderRadius:10, cursor: loading ? 'default' : 'pointer',
                fontFamily:'inherit', transition:'all 0.15s',
                textAlign:'center',
              }}
            >
              <div style={{ fontSize:18, marginBottom:2 }}>{z.emoji}</div>
              <div style={{ fontSize:9, color: selected?.sign===z.sign ? '#A78BFA' : '#5A6890', fontWeight:600 }}>{z.sign}</div>
              <div style={{ fontSize:8, color:'#2A3460', marginTop:1 }}>{z.dates}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.14)' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>✨</div>
          <div style={{ color:'#A78BFA', fontSize:13 }}>星の配置を読み解いています…</div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div>
          {/* Hero score */}
          <div style={{ padding:'24px 20px', marginBottom:12, background:'linear-gradient(145deg,rgba(124,92,252,0.1),rgba(99,102,241,0.05))', borderRadius:16, border:'1px solid rgba(124,92,252,0.18)', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:6 }}>{result.emoji}</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#E2E8FF', marginBottom:14 }}>{result.sign}</div>
            <div style={{ fontSize:11, color:'#5A6890', marginBottom:8 }}>総合運</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ flex:1, height:9, background:'rgba(255,255,255,0.05)', borderRadius:5, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${result.score}%`, background:`linear-gradient(90deg,#7C3AED,${scoreColor(result.score)})`, borderRadius:5 }}/>
              </div>
              <div style={{ fontSize:22, fontWeight:900, color: scoreColor(result.score), minWidth:36, textAlign:'right' }}>{result.score}</div>
            </div>
          </div>

          {/* Category stars */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[
              { label:'恋愛運 💕', v: result.love },
              { label:'仕事運 💼', v: result.work },
              { label:'健康運 🌿', v: result.health },
              { label:'金運 💰',   v: result.money },
            ].map(({ label, v }) => (
              <div key={label} style={{ padding:'12px 14px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:11, color:'#5A6890', marginBottom:5 }}>{label}</div>
                <div style={{ color:'#FBBF24' }}><Stars n={v} /></div>
              </div>
            ))}
          </div>

          {/* Text */}
          <div style={{ padding:'16px 18px', background:'rgba(12,10,30,0.4)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#5A6890', marginBottom:8 }}>📝 今日の運勢</div>
            <p style={{ fontSize:13, color:'#B8C0D8', lineHeight:1.9, margin:0 }}>{result.text}</p>
          </div>

          {/* Lucky */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'カラー', val:result.color, icon:'🎨' },
              { label:'ナンバー', val:result.num, icon:'🔢' },
              { label:'アイテム', val:result.item, icon:'✨' },
            ].map(({ label, val, icon }) => (
              <div key={label} style={{ padding:'12px 8px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:9, color:'#D97706', fontWeight:700, marginBottom:2 }}>ラッキー{label}</div>
                <div style={{ fontSize:12, color:'#FDE68A', fontWeight:700 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Re-check */}
          <button onClick={() => getFortune(selected)} style={{ width:'100%', marginTop:16, padding:'12px', background:'transparent', border:'1px solid rgba(124,92,252,0.25)', borderRadius:12, color:'#7C5CFC', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 もう一度占う
          </button>
        </div>
      )}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
