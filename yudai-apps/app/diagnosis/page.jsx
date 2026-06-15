'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890' };
const CAT = { label:'AI診断・分析', icon:'🔮', color:'#818CF8', badge:'最多8種類', desc:'自分の本質・才能・運命・行動パターン・相性・未来をAIが数値化して暴く。' };

const APPS = [
  { id:'fate',  icon:'🔮', title:'運命診断',  color:'#7C3AED', tag:'運命',  badge:'定番人気', cta:'運命を診断する',   sub:'生年月日・名前を入力するだけ。統計と心理学があなたの本質・強み・人生の転機を解析する' },
  { id:'marry', icon:'💍', title:'婚活診断',  color:'#EC4899', tag:'婚活',  badge:'NEW',      cta:'婚活力を測る',     sub:'AI面接官があなたの婚活力を10項目でスコアリング。改善すべき点と強みを明確にする' },
  { id:'side',  icon:'💰', title:'副業診断',  color:'#F59E0B', tag:'副業',  badge:null,       cta:'副業を見つける',   sub:'スキル・時間・目標を入力 → AIが最適な副業ロードマップと収益シミュレーションを生成' },
  { id:'muda',  icon:'🧠', title:'無駄削減',  color:'#0891B2', tag:'効率',  badge:null,       cta:'時間を取り戻す',   sub:'週のルーティンを入力するだけ。削れる時間を数値化して年間〇〇時間の余白を作り出す' },
  { id:'rant',  icon:'💢', title:'鬱憤爆発',  color:'#DC2626', tag:'社会',  badge:null,       cta:'爆発させる',       sub:'理不尽・怒り・社会への不満を哲学的・統計的・感情的の3視点で徹底解剖する' },
  { id:'tarot',   icon:'🎴', title:'AIタロット', color:'#7C3AED', tag:'占い',   badge:'NEW', cta:'カードを引く',     sub:'3枚のカードが過去・現在・未来を映し出す。AIが深い洞察で詩的なリーディングを生成する' },
  { id:'fortune', icon:'🌟', title:'今日の運勢', color:'#F59E0B', tag:'星占い', badge:'NEW', cta:'運勢を見る',       sub:'12星座ごとにAIが毎日生成する星占い。恋愛・仕事・健康・金運をスコアで可視化する' },
  { id:'aiai',   icon:'💕', title:'AI相性診断', color:'#EC4899', tag:'相性',   badge:'NEW', cta:'相性を診断する',   sub:'2人の名前と星座を入力するだけでAIが相性スコアを算出。恋愛・友情・仕事を多角的に分析する' },
];

const DEMOS = {
  fate:  [{t:'input',text:'1998年5月12日\n東京生まれ'},{t:'proc'},{t:'res',text:'創造性 ★★★★★\n転機は28歳\n隠れた才: 芸術'}],
  marry: [{t:'input',text:'外見重視: 40%\n価値観: 80%'},{t:'proc'},{t:'res',text:'婚活力 78/100\nタイプ: 誠実派'}],
  side:  [{t:'input',text:'スキル: デザイン\n週3h / 月3万目標'},{t:'proc'},{t:'res',text:'Canva副業\n月5万可・3ヶ月で達成'}],
  muda:  [{t:'input',text:'会議:週8h\n通勤:週5h\nSNS:週7h'},{t:'proc'},{t:'res',text:'削減可能\n週9.2時間\n年480時間！'}],
  rant:  [{t:'input',text:'理不尽な\nサービス残業\nもう限界です'},{t:'proc'},{t:'res',text:'📐 哲学的視点\n📊 統計的視点\n❤️ 感情的視点'}],
  tarot:   [{t:'input',text:'好きな人に\n告白すべきか…'},{t:'proc'},{t:'res',text:'🎴 恋人・塔・星\n転換期を経て\n希望が待つ'}],
  fortune: [{t:'res',text:'♊ 双子座'},{t:'proc'},{t:'res',text:'総合運 82 🌟\n恋愛★★★★☆\n仕事★★★★★'}],
  aiai:    [{t:'input',text:'ゆだい × あい\n♊ × ♏'},{t:'proc'},{t:'res',text:'💕 相性 88点\n運命の相手💜\n恋愛・仕事ともに◎'}],
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
        {s.t==='proc'  && <div style={{ textAlign:'center' }}><div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:app.color, animation:`dp 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div><div style={{ color:'#3A4870', fontSize:8 }}>AI分析中...</div></div>}
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

export default function DiagnosisPage() {
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
          <div style={{ color:C.text, fontSize:22, fontWeight:900, marginBottom:10 }}>診断結果を保存・シェア</div>
          <div style={{ color:C.muted, fontSize:13, lineHeight:1.8, marginBottom:22 }}>すべての診断結果をPDF保存・SNSシェア・再診断し放題で自己理解を深める</div>
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
