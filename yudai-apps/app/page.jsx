'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const C = {
  bg:'#050812', surface:'#0C0E1F', card:'#0F1126',
  border:'#1A2040', borderHi:'#2A3460',
  text:'#E2E8FF', muted:'#5A6890', mutedHi:'#8A9CC0',
  accent:'#6366F1', violet:'#A78BFA', cyan:'#38BDF8', green:'#34D399',
};

const FEATURED = [
  { id:'koe',     icon:'🕯️', title:'声の遺産',      sub:'大切な人の言葉を登録して、いつでも話しかけられる追悼AIチャット。', color:'#C8A84B', tag:'追悼', size:'large' },
  { id:'monster', icon:'👾', title:'言葉モンスター', sub:'日記からAIが感情モンスターを召喚。図鑑コレクション。', color:'#34D399', tag:'図鑑', size:'small' },
  { id:'kokoro',  icon:'🪞', title:'内省',           sub:'毎日の記録が、やがて自分の感情地図になる。', color:'#7C6FFF', tag:'日記', size:'small' },
];

const APPS = [
  { id:'books',   icon:'📖', title:'図書館',       sub:'感情が呼び寄せる、運命の一冊',   color:'#4F46E5', tag:'読書' },
  { id:'dream',   icon:'🌙', title:'夢映像化',     sub:'消えゆく夢を詩と画像に残す',     color:'#0D9488', tag:'AI画像' },
  { id:'fate',    icon:'🔮', title:'運命診断',     sub:'統計と心理学がビジョンを解析',   color:'#7C3AED', tag:'診断' },
  { id:'rant',    icon:'💢', title:'鬱憤爆発',     sub:'理不尽を3視点で解剖する',        color:'#DC2626', tag:'社会' },
  { id:'muda',    icon:'🧠', title:'無駄削減',     sub:'週の節約時間を数値で可視化',     color:'#0891B2', tag:'効率' },
  { id:'genki',   icon:'🌐', title:'元気玉',       sub:'あなたの気分が世界と繋がる',     color:'#D97706', tag:'気分' },
  { id:'vending', icon:'🎰', title:'自販機マップ', sub:'近くの自販機を瞬時に発見',       color:'#2563EB', tag:'MAP' },
];

/* ── Bento カード ── */
function BentoCard({ app }) {
  const [hov, setHov] = useState(false);
  const large = app.size === 'large';
  return (
    <Link href={`/${app.id}`} style={{ textDecoration:'none', gridColumn: large ? 'span 2' : 'span 1', gridRow: large ? 'span 2' : 'span 1', display:'block' }}>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          height:'100%', minHeight: large ? 280 : 130,
          padding: large ? '28px 28px' : '20px 20px',
          background: hov ? '#0F1330' : '#0C0E22',
          border:`1px solid ${hov ? app.color+'55' : '#1E2448'}`,
          borderRadius:20, position:'relative', overflow:'hidden',
          boxShadow: hov ? `0 20px 60px ${app.color}25, 0 0 0 1px ${app.color}18` : 'none',
          transition:'all 0.25s ease',
          transform: hov ? 'translateY(-4px)' : 'none',
        }}>
        {/* 背景グロー */}
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:`radial-gradient(circle, ${app.color}22 0%, transparent 70%)`, opacity: hov ? 1 : 0.5, transition:'opacity 0.3s', pointerEvents:'none' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: large ? 16 : 10, position:'relative' }}>
          <span style={{ fontSize:10, padding:'4px 10px', borderRadius:20, background:app.color+'18', color:app.color, border:`1px solid ${app.color}33`, fontWeight:700, letterSpacing:'0.06em' }}>{app.tag}</span>
          <span style={{ fontSize: large ? 32 : 24 }}>{app.icon}</span>
        </div>

        <h3 style={{ color:C.text, fontSize: large ? 22 : 16, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.02em', position:'relative' }}>{app.title}</h3>
        <p style={{ color:C.muted, fontSize: large ? 14 : 12, lineHeight:1.7, margin:0, position:'relative' }}>{app.sub}</p>

        {large && (
          <div style={{ marginTop:20, display:'flex', gap:8, position:'relative' }}>
            {['話しかける →', 'いつでも会える', '記憶を永遠に'].map((t,i)=>(
              <div key={i} style={{ padding:'6px 12px', background: i===0?app.color+'20':'#080A18', border:`1px solid ${i===0?app.color+'40':'#1A2040'}`, borderRadius:8, color:i===0?app.color:C.muted, fontSize:11 }}>{t}</div>
            ))}
          </div>
        )}

        <div style={{ position:'relative', marginTop:12, color:app.color, fontSize:12, fontWeight:600, opacity:hov?1:0, transform:hov?'translateX(0)':'translateX(-8px)', transition:'all 0.2s' }}>試してみる →</div>
      </div>
    </Link>
  );
}

/* ── 小カード ── */
function AppCard({ app }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/${app.id}`} style={{ textDecoration:'none' }}>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          padding:'18px 16px', background: hov?'#0F1228':C.card,
          border:`1px solid ${hov?app.color+'44':C.border}`,
          borderRadius:16, position:'relative', overflow:'hidden',
          boxShadow: hov?`0 8px 28px ${app.color}18`:'none',
          transition:'all 0.2s ease',
          transform: hov?'translateY(-3px)':'none',
        }}>
        <div style={{ position:'absolute', bottom:-16, right:-16, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${app.color}14 0%, transparent 70%)`, opacity:hov?1:0, transition:'opacity 0.3s', pointerEvents:'none' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <span style={{ fontSize:26 }}>{app.icon}</span>
          <span style={{ fontSize:10, padding:'3px 8px', borderRadius:12, background:app.color+'15', color:app.color, border:`1px solid ${app.color}28`, fontWeight:600 }}>{app.tag}</span>
        </div>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:5 }}>{app.title}</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>{app.sub}</div>
      </div>
    </Link>
  );
}

/* ── 社会的証明アバター ── */
function SocialProof() {
  const colors=['#7C3AED','#059669','#DC2626','#D97706','#0891B2'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginTop:18 }}>
      <div style={{ display:'flex' }}>
        {colors.map((c,i)=>(
          <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${c},${c}88)`, border:'2px solid #050812', marginLeft: i>0?-8:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
            {['👤','🧑','👩','👦','🧓'][i]}
          </div>
        ))}
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>
        <span style={{ fontWeight:700, color:'#fff' }}>毎日</span> 感情を記録する人たちと一緒に
      </div>
    </div>
  );
}

export default function Hub() {
  const [tick, setTick] = useState(0);

  /* アニメーション用 tick */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>

      {/* ── Hero（アニメーショングラデーション） ── */}
      <section style={{ position:'relative', overflow:'hidden', padding:'100px 24px 80px', textAlign:'center' }}>

        {/* アニメーションオーブ */}
        <div style={{ position:'absolute', top:-120, left:'5%',  width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, #6366F122 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 8s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', top: -80, right:'3%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #A78BFA18 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 10s ease-in-out infinite reverse' }}/>
        <div style={{ position:'absolute', bottom:-100, left:'35%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, #38BDF814 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'floatSlow 12s ease-in-out infinite' }}/>

        <style>{`
          @keyframes floatSlow { 0%,100%{transform:translateY(0)scale(1)} 50%{transform:translateY(-20px)scale(1.05)} }
          @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        `}</style>

        <div style={{ position:'relative', maxWidth:720, margin:'0 auto' }}>
          {/* バッジ */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:20, background:'#6366F112', border:'1px solid #6366F130', color:'#A78BFA', fontSize:12, fontWeight:600, marginBottom:28, backdropFilter:'blur(8px)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#6EE7B7', display:'inline-block', boxShadow:'0 0 6px #6EE7B7' }}/>
            感情を起点に設計した、10本のプロダクト
          </div>

          {/* ヘッドライン */}
          <h1 style={{ fontSize:'clamp(40px, 7vw, 72px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.035em', margin:'0 0 22px' }}>
            <span style={{ color:C.text }}>AIと感情が</span><br/>
            <span style={{
              background:'linear-gradient(135deg, #C084FC 0%, #818CF8 35%, #38BDF8 70%, #34D399 100%)',
              backgroundSize:'200% 200%',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradShift 5s ease infinite',
            }}>交差する場所</span>
          </h1>

          <p style={{ color:C.muted, fontSize:'clamp(15px, 2vw, 18px)', lineHeight:1.9, margin:'0 0 36px', maxWidth:500, marginLeft:'auto', marginRight:'auto' }}>
            チャット、診断、日記、図書館。<br/>
            感情を起点に設計された、10本のプロダクト。
          </p>

          {/* CTA */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="#featured" style={{ textDecoration:'none' }}>
              <button style={{ padding:'15px 32px', background:'linear-gradient(135deg,#6366F1,#A78BFA)', border:'none', borderRadius:14, color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 32px #6366F150', transition:'all 0.2s', letterSpacing:'-0.01em' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 40px #6366F168';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 32px #6366F150';}}>
                おすすめを試す →
              </button>
            </a>
            <a href="#apps" style={{ textDecoration:'none' }}>
              <button style={{ padding:'15px 32px', background:'transparent', border:'1px solid #252A50', borderRadius:14, color:C.mutedHi, fontSize:16, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#404880';e.currentTarget.style.color=C.text;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#252A50';e.currentTarget.style.color=C.mutedHi;}}>
                全アプリを見る
              </button>
            </a>
          </div>

          {/* 社会的証明 */}
          <SocialProof/>
        </div>
      </section>

      {/* ── 統計バー ── */}
      <section style={{ padding:'0 24px 56px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', background:'#0C0E22', border:'1px solid #1E2448', borderRadius:18, overflow:'hidden' }}>
          {[
            { val:'10', label:'アプリ',     icon:'📦', sub:'すべて無料' },
            { val:'6',  label:'AI搭載',     icon:'🤖', sub:'生成AI活用' },
            { val:'∞',  label:'使い放題',   icon:'✨', sub:'登録不要' },
          ].map((s,i)=>(
            <div key={i} style={{ padding:'24px 16px', textAlign:'center', borderRight:i<2?'1px solid #1E2448':'none' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:32, fontWeight:900, background:'linear-gradient(135deg,#A78BFA,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.val}</div>
              <div style={{ color:C.muted, fontSize:12, marginTop:2, fontWeight:600 }}>{s.label}</div>
              <div style={{ color:'#2A3460', fontSize:10, marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bento スポットライト ── */}
      <section id="featured" style={{ padding:'0 24px 72px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, color:C.violet, letterSpacing:'0.15em', fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>✦ おすすめ</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,34px)', fontWeight:900, color:C.text, letterSpacing:'-0.025em', margin:'0 0 10px' }}>まずはここから</h2>
            <p style={{ color:C.muted, fontSize:14, margin:0 }}>特に体験してほしい3本を大きく紹介</p>
          </div>

          {/* Bento Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'auto auto', gap:14 }}>
            {FEATURED.map(app => <BentoCard key={app.id} app={app}/>)}
          </div>
        </div>
      </section>

      {/* ── 全アプリ ── */}
      <section id="apps" style={{ padding:'0 24px 80px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
            <h2 style={{ color:C.text, fontSize:18, fontWeight:800, margin:0, flex:1, letterSpacing:'-0.01em' }}>すべてのアプリ</h2>
            <span style={{ color:C.muted, fontSize:12 }}>{APPS.length} apps</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {APPS.map(app => <AppCard key={app.id} app={app}/>)}
          </div>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'36px 24px', textAlign:'center' }}>
        <div style={{ marginBottom:12 }}>
          <span style={{ background:'linear-gradient(135deg,#A78BFA,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, fontSize:18 }}>Yudai Apps</span>
        </div>
        <p style={{ color:C.muted, fontSize:12, margin:'0 0 16px', lineHeight:2 }}>
          AIと感情が交差するプロダクト集<br/>
          <span style={{ fontSize:11 }}>Powered by Claude AI · 画像生成 Pollinations.ai</span>
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {APPS.concat(FEATURED.map(f=>({id:f.id,title:f.title}))).map(a=>(
            <Link key={a.id} href={`/${a.id}`} style={{ color:C.muted, fontSize:11, textDecoration:'none', transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>{a.title}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
