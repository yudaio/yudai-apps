'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890' };
const CAT = { label:'学習・スキル', icon:'📚', color:'#38BDF8', badge:'英語強化', desc:'ネイティブAIと本物の英会話を練習。レベルとトピックを選んで自分のペースでスキルアップ。' };

const APPS = [
  { id:'eigo',  icon:'🗣️', title:'AI英会話',    color:'#38BDF8', tag:'英語', badge:'NEW', cta:'英会話を始める', sub:'ネイティブAIと英語でチャット練習。初心者〜上級まで対応。5つのトピックから選べる会話シミュレーター' },
  { id:'vocab', icon:'📖', title:'英単語クイズ', color:'#A78BFA', tag:'語彙', badge:'NEW', cta:'クイズを始める', sub:'初・中・上級3レベルの10問クイズ。正解後にAIが例文と解説を生成。スコアで実力をチェックする' },
];

const DEMOS = {
  eigo: [
    { t:'in',  text:'Hello! My name is\nYudai from Yokohama!' },
    { t:'proc' },
    { t:'out', text:'Great, Yudai!\nYokohama sounds nice.\nWhat do you like there?' },
  ],
  vocab: [
    { t:'res',  text:'resilient の意味は？\n① 回復力がある\n② もろい\n③ 頑固な' },
    { t:'in',   text:'① 回復力がある' },
    { t:'res',  text:'✅ 正解！\n例文: She is resilient\nand never gives up.' },
  ],
};

function DemoCard({ app }) {
  const steps = DEMOS[app.id] || [];
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!steps.length) return;
    const t = setInterval(() => setP(x => (x + 1) % steps.length), 2200);
    return () => clearInterval(t);
  }, [steps.length]);
  const s = steps[p] || {};
  return (
    <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#0A0D1A,#050810)', border:`1px solid ${app.color}44`, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'7px 8px', background:app.color+'18', borderBottom:`1px solid ${app.color}22`, display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        <span style={{ fontSize:11 }}>{app.icon}</span>
        <span style={{ color:app.color, fontSize:8, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.title}</span>
      </div>
      <div style={{ flex:1, padding:'8px', display:'flex', flexDirection:'column', justifyContent:'center', gap:5, overflow:'hidden' }}>
        {s.t==='in'    && <div style={{ alignSelf:'flex-end', maxWidth:'90%', background:app.color+'30', border:`1px solid ${app.color}44`, borderRadius:'8px 8px 2px 8px', padding:'5px 7px', color:'#E2E8FF', fontSize:8.5, lineHeight:1.5, whiteSpace:'pre-line' }}>{s.text}</div>}
        {s.t==='out'   && <div style={{ alignSelf:'flex-start', maxWidth:'90%', background:'#161930', border:'1px solid #252848', borderRadius:'8px 8px 8px 2px', padding:'5px 7px', color:'#C5D0F0', fontSize:8.5, lineHeight:1.5, whiteSpace:'pre-line' }}>{s.text}</div>}
        {s.t==='proc'  && <div style={{ textAlign:'center' }}><div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:app.color, animation:`dp 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div><div style={{ color:'#3A4870', fontSize:8 }}>AI応答中...</div></div>}
      </div>
      <div style={{ padding:'5px 8px 7px', display:'flex', gap:3, flexShrink:0 }}>
        {steps.map((_,i) => <div key={i} style={{ flex:i===p?2:1, height:2, borderRadius:2, background:i===p?app.color:app.color+'28', transition:'all 0.4s ease' }}/>)}
      </div>
    </div>
  );
}

function AppCard({ app }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:hov?'#0F1228':'#0C0E22', border:`1px solid ${hov?app.color+'50':'#1E2448'}`, borderRadius:20, overflow:'hidden', transition:'all 0.22s', transform:hov?'translateY(-3px)':'none', boxShadow:hov?`0 16px 48px ${app.color}20`:'none' }}>
      <div style={{ height:220, borderBottom:`1px solid ${app.color}22` }}><DemoCard app={app}/></div>
      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
          <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:app.color+'18', color:app.color, border:`1px solid ${app.color}30`, fontWeight:700 }}>{app.tag}</span>
          {app.badge && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#F59E0B18', color:'#F59E0B', border:'1px solid #F59E0B30', fontWeight:700 }}>{app.badge}</span>}
        </div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:7 }}>{app.title}</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.75, marginBottom:16 }}>{app.sub}</div>
        <Link href={`/${app.id}`} style={{ textDecoration:'none' }}>
          <button style={{ width:'100%', padding:'12px', background:hov?app.color:'transparent', border:`1px solid ${app.color}55`, borderRadius:12, color:hov?'#fff':app.color, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            {app.cta} →
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <style>{`@keyframes dp{0%,80%,100%{transform:scale(0.65);opacity:0.4}40%{transform:scale(1);opacity:1}}*{box-sizing:border-box}`}</style>
      <div style={{ padding:'14px 24px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #1A2040' }}>
        <Link href="/" style={{ textDecoration:'none', color:C.muted, fontSize:13 }}>← ホーム</Link>
        <span style={{ color:'#1E2448' }}>›</span>
        <span style={{ color:CAT.color, fontSize:13, fontWeight:600 }}>{CAT.icon} {CAT.label}</span>
      </div>
      <div style={{ padding:'52px 24px 36px', background:`linear-gradient(135deg, ${CAT.color}10, transparent)`, borderBottom:'1px solid #1A2040', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:20, background:CAT.color+'18', border:`1px solid ${CAT.color}35`, color:CAT.color, fontSize:11, fontWeight:700, marginBottom:18 }}>{CAT.icon} {CAT.badge}</div>
        <h1 style={{ color:C.text, fontSize:'clamp(28px,5vw,44px)', fontWeight:900, letterSpacing:'-0.03em', margin:'0 0 14px' }}>{CAT.label}</h1>
        <p style={{ color:C.muted, fontSize:15, lineHeight:1.85, margin:'0 auto', maxWidth:480 }}>{CAT.desc}</p>
        <div style={{ marginTop:14, color:'#3A4870', fontSize:12 }}>{APPS.length}本のアプリ · 全部無料 · 登録不要</div>
      </div>
      <div style={{ padding:'40px 24px 72px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20 }}>
          {APPS.map(app => <AppCard key={app.id} app={app}/>)}
        </div>
        <div style={{ marginTop:40, padding:'24px', background:'rgba(56,189,248,0.05)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:16, textAlign:'center' }}>
          <div style={{ color:'#38BDF8', fontSize:12, fontWeight:700, marginBottom:8 }}>📚 近日公開予定</div>
          <div style={{ color:C.muted, fontSize:13 }}>英単語フラッシュカード・AI発音練習・TOEIC対策など追加予定</div>
        </div>
      </div>
      <footer style={{ borderTop:'1px solid #1A2040', padding:'24px', textAlign:'center' }}>
        <Link href="/" style={{ color:C.muted, fontSize:12, textDecoration:'none' }}>← すべてのカテゴリを見る</Link>
      </footer>
    </div>
  );
}
