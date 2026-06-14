'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890' };
const CAT = { label:'ツール・体験', icon:'🛠️', color:'#38BDF8', badge:'無料ツール', desc:'本を選んでもらう。世界と繋がる。地図から自販機を探す。ユニークな日常体験アプリ。' };

const APPS = [
  { id:'books',   icon:'📖', title:'感情図書館',  color:'#4F46E5', tag:'読書',    badge:null, cta:'本を選んでもらう',  sub:'今の感情・気分を入力するだけ。AIが今のあなたの心に最もフィットする運命の一冊を選書してくれる' },
  { id:'genki',   icon:'🌐', title:'元気玉',      color:'#D97706', tag:'コミュニティ', badge:null, cta:'気分を送信する',    sub:'あなたの今日の気分を送信 → 世界中のユーザーの感情とリアルタイムで繋がる参加型体験' },
  { id:'yamato',  icon:'⛩️', title:'大和魂教育',  color:'#B45309', tag:'教育',    badge:null, cta:'学び始める',       sub:'日本の文化・歴史・武士道・精神をゲーム形式のクイズで楽しく学ぶ教育コンテンツ' },
  { id:'vending', icon:'🎰', title:'自販機マップ', color:'#2563EB', tag:'MAP',    badge:null, cta:'自販機を探す',      sub:'現在地周辺の自動販売機を地図上で即座に表示。GPSを使ってリアルタイムで最寄りを案内する' },
];

const DEMOS = {
  books:   [{t:'input',text:'今日は虚しくて\n何もしたくない'},{t:'proc'},{t:'res',text:'📖 人間失格\n太宰 治\n→ 今の心に刺さる'}],
  genki:   [{t:'input',text:'気分: 70点\n前向きな朝'},{t:'proc'},{t:'res',text:'🌐 世界と繋がった\n平均65点・上位20%'}],
  yamato:  [{t:'res',text:'Q: 武士道の\n精神とは？'},{t:'in',text:'① 誠実・礼儀\n   ・勇気'},{t:'res',text:'✅ 正解！+10pt\n連続正解: 3🔥'}],
  vending: [{t:'input',text:'📍 現在地\n取得完了'},{t:'proc'},{t:'res',text:'周辺に7台発見\n最近: 80m先'}],
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
        {s.t==='in'    && <div style={{ alignSelf:'flex-end',   maxWidth:'88%', background:app.color+'30', border:`1px solid ${app.color}44`, borderRadius:'8px 8px 2px 8px', padding:'5px 7px', color:'#E2E8FF', fontSize:8.5, lineHeight:1.5, whiteSpace:'pre-line' }}>{s.text}</div>}
        {s.t==='proc'  && <div style={{ textAlign:'center' }}><div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:app.color, animation:`dp 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div><div style={{ color:'#3A4870', fontSize:8 }}>処理中...</div></div>}
        {s.t==='input' && <div style={{ background:'#0A0D1A', border:'1px solid #1A2040', borderRadius:8, padding:'5px 7px', color:'#8A9CC0', fontSize:8, lineHeight:1.5, whiteSpace:'pre-line' }}>{s.text}</div>}
        {s.t==='res'   && <div style={{ background:app.color+'12', border:`1px solid ${app.color}30`, borderRadius:8, padding:'6px 8px', color:app.color, fontSize:8.5, fontWeight:600, lineHeight:1.6, whiteSpace:'pre-line' }}>{s.text}</div>}
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

export default function ToolsPage() {
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
      </div>
      <div style={{ padding:'0 24px 72px' }}>
        <div style={{ maxWidth:680, margin:'0 auto', background:'linear-gradient(135deg,#1A0A40,#0D1235)', border:'1px solid #4C1D9540', borderRadius:20, padding:'36px 28px', textAlign:'center' }}>
          <div style={{ color:'#C084FC', fontSize:11, fontWeight:700, letterSpacing:'0.15em', marginBottom:12 }}>✨ PREMIUM</div>
          <div style={{ color:C.text, fontSize:22, fontWeight:900, marginBottom:10 }}>使い放題＋優先AI処理</div>
          <div style={{ color:C.muted, fontSize:13, lineHeight:1.8, marginBottom:22 }}>回数制限なし・高速AI処理・すべての履歴を永久保存できるプレミアム体験</div>
          <button style={{ padding:'14px 32px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 28px #7C3AED40' }}>✨ 7日間無料で試す</button>
          <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>その後 ¥480/月 · いつでもキャンセル可</div>
        </div>
      </div>
      <footer style={{ borderTop:'1px solid #1A2040', padding:'24px', textAlign:'center' }}>
        <Link href="/" style={{ color:C.muted, fontSize:12, textDecoration:'none' }}>← すべてのカテゴリを見る</Link>
      </footer>
    </div>
  );
}
