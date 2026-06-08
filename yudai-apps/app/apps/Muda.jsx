'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, Loading, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const GRAD = 'linear-gradient(135deg,#0C4A6E,#0891B2,#0E7490)';
const C = { card:'#060F18', border:'#0A2030', text:'#D0F0FF', muted:'#3A6880' };

const SECTIONS = [
  { key:/【削除すべき習慣】([\s\S]+?)(?=【|$)/, label:'削除すべき習慣', icon:'🗑️', color:'#F87171' },
  { key:/【最適化できる行動】([\s\S]+?)(?=【|$)/, label:'最適化できる行動', icon:'⚡', color:'#FBBF24' },
  { key:/【維持すべき習慣】([\s\S]+?)(?=【|$)/, label:'維持すべき習慣', icon:'✅', color:'#34D399' },
];

export default function Muda() {
  const auth=useAuth();
  const[routine,setRoutine]=useState('');
  const[res,setRes]=useState('');
  const[savedHours,setSavedHours]=useState('');
  const[loading,setLoading]=useState(false);
  const[history,setHistory]=useState([]);

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await getHistoryRemote('muda',auth.user.id);setHistory(r||getHistoryLocal('muda'));}else setHistory(getHistoryLocal('muda')); } load(); },[auth?.user]);

  const run=async()=>{ setLoading(true);setRes('');setSavedHours('');
    const r=await callAI('あなたは時間効率化の専門家です。週のルーティンを分析し、無駄な習慣を特定して改善策を提案します。出力：\n【節約時間】約○時間（数字のみ）\n【削除すべき習慣】具体的に2〜3項目\n【最適化できる行動】具体的に2〜3項目\n【維持すべき習慣】価値ある行動2〜3項目',`週のルーティン：${routine}`);
    setRes(r);
    const h=r.match(/【節約時間】約?(\d+\.?\d*)/)?.[1]||'';
    setSavedHours(h);
    await saveHistory('muda',routine.slice(0,40),r,auth?.user?.id);
    const hist=auth?.user?await getHistoryRemote('muda',auth.user.id):getHistoryLocal('muda');
    setHistory(hist||[]);
    setLoading(false);
  };

  const parsed=SECTIONS.map(s=>({...s,text:res.match(s.key)?.[1]?.trim()||''})).filter(s=>s.text);

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🧠" title="無駄削減" sub="あなたの週に、何時間が隠れていますか？" grad={GRAD}/>
      <AuthBadge/>

      {!res&&(
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:'#3A6880', fontSize:12, fontWeight:600, marginBottom:8 }}>週のルーティンを入力してください</div>
            <textarea value={routine} onChange={e=>setRoutine(e.target.value)} placeholder="例：毎朝SNSを1時間見る。週3回残業2時間。会議が週5回各1時間。通勤片道1時間…" rows={6} style={{ width:'100%', padding:'12px 14px', background:'#040810', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }} onFocus={e=>{e.target.style.borderColor='#0891B255';e.target.style.boxShadow='0 0 0 3px #0891B215';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <HeroBtn onClick={run} disabled={!routine.trim()} grad={GRAD}>🧠 無駄を分析する</HeroBtn>
        </div>
      )}

      {loading&&<Loading/>}

      {res&&!loading&&(
        <div>
          {savedHours&&(
            <div style={{ marginBottom:20, padding:'28px 24px', background:'linear-gradient(135deg,#042030,#061820)', border:'1px solid #0891B230', borderRadius:20, textAlign:'center' }}>
              <div style={{ color:'#38BDF8', fontSize:13, fontWeight:600, marginBottom:8 }}>⏱️ 週に節約できる時間</div>
              <div style={{ fontSize:72, fontWeight:900, color:'#34D399', lineHeight:1, marginBottom:6, textShadow:'0 0 40px #34D39950' }}>{savedHours}<span style={{ fontSize:28 }}>時間</span></div>
              <div style={{ color:'#3A6880', fontSize:13 }}>年間 約{Math.round(Number(savedHours)*52)}時間 ≈ {Math.round(Number(savedHours)*52/24)}日分</div>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {parsed.map((s,i)=>(
              <div key={i} style={{ padding:'18px 20px', background:C.card, border:`1px solid ${s.color}25`, borderLeft:`3px solid ${s.color}`, borderRadius:14 }}>
                <div style={{ color:s.color, fontSize:12, fontWeight:700, marginBottom:10 }}>{s.icon} {s.label}</div>
                <div style={{ color:'#B0D8E8', fontSize:14, lineHeight:1.9 }}>{s.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setRes('');setSavedHours('');}} style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>別の入力</button>
            <button onClick={()=>share('無駄削減分析',res)} style={{ flex:1, padding:'13px', background:GRAD, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>シェア</button>
          </div>
          {history.length>0&&<div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}` }}><div style={{ color:C.muted, fontSize:11, letterSpacing:'0.1em', marginBottom:10, textTransform:'uppercase' }}>履歴</div>{history.map((item,i)=><div key={i} onClick={()=>{setRes(item.result);setRoutine(item.input);}} style={{ padding:'10px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6, cursor:'pointer', color:C.muted, fontSize:13 }} onMouseEnter={e=>e.currentTarget.style.borderColor='#0891B240'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{item.input}</div>)}</div>}
        </div>
      )}
    </div>
  );
}
