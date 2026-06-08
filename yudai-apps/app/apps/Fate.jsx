'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, Loading, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const GRAD = 'linear-gradient(135deg,#1E1057,#4C1D95,#7C3AED)';
const C = { card:'#0D0B20', border:'#2A2040', text:'#E2D8FF', muted:'#6A5A90' };

const SECTIONS = [
  { key:/【統計的視点】([\s\S]+?)(?=【|$)/, label:'統計的視点', icon:'📊', color:'#6366F1' },
  { key:/【心理的視点】([\s\S]+?)(?=【|$)/, label:'心理的視点', icon:'🧩', color:'#A78BFA' },
  { key:/【人生の指針】([\s\S]+?)(?=【|$)/, label:'人生の指針', icon:'🧭', color:'#34D399' },
];

export default function Fate() {
  const auth=useAuth();
  const[q,setQ]=useState('');
  const[res,setRes]=useState('');
  const[imgUrl,setImgUrl]=useState('');
  const[imgLoaded,setImgLoaded]=useState(false);
  const[loading,setLoading]=useState(false);
  const[history,setHistory]=useState([]);

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await getHistoryRemote('fate',auth.user.id);setHistory(r||getHistoryLocal('fate'));}else setHistory(getHistoryLocal('fate')); } load(); },[auth?.user]);

  const run=async()=>{ setLoading(true);setRes('');setImgUrl('');setImgLoaded(false);
    const r=await callAI('あなたは統計・心理学・哲学を融合した運命分析の専門家です。出力：\n【統計的視点】この悩みを持つ人の統計・データを2〜3文\n【心理的視点】心理学的な深層分析を2〜3文\n【人生の指針】具体的な行動指針と可能性を2〜3文',`相談：${q}`);
    setRes(r);
    const imgPrompt=`mystical fate oracle, cosmic destiny, ${q.slice(0,30)}, glowing runes, deep purple nebula, tarot card aesthetic, cinematic, no text`;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=512&height=300&nologo=true&seed=${Date.now()}`);
    await saveHistory('fate',q,r,auth?.user?.id);
    const h=auth?.user?await getHistoryRemote('fate',auth.user.id):getHistoryLocal('fate');
    setHistory(h||[]);
    setLoading(false);
  };

  const parsed=SECTIONS.map(s=>({...s,text:res.match(s.key)?.[1]?.trim()||''})).filter(s=>s.text);

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🔮" title="運命診断" sub="統計と心理学が、あなたのビジョンを解析する" grad={GRAD}/>
      <AuthBadge/>

      {!res&&(
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:'#7A6AAA', fontSize:12, fontWeight:600, marginBottom:8 }}>あなたの悩みや今後の選択を入力してください</div>
            <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="例：転職すべきか、このまま続けるべきか。自分の適性がわからない…" rows={5} style={{ width:'100%', padding:'12px 14px', background:'#070610', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }} onFocus={e=>{e.target.style.borderColor='#7C3AED55';e.target.style.boxShadow='0 0 0 3px #7C3AED15';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <HeroBtn onClick={run} disabled={!q.trim()} grad={GRAD}>🔮 運命を解析する</HeroBtn>
        </div>
      )}

      {loading&&<Loading/>}

      {res&&!loading&&(
        <div>
          {imgUrl&&(
            <div style={{ marginBottom:16, background:'#030610', borderRadius:16, overflow:'hidden', minHeight:imgLoaded?0:180, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {!imgLoaded&&<div style={{ color:C.muted, fontSize:13 }}>ビジョン生成中...</div>}
              <img src={imgUrl} alt="fate" onLoad={()=>setImgLoaded(true)} style={{ width:'100%', display:imgLoaded?'block':'none', opacity:0.9 }}/>
            </div>
          )}
          <div style={{ padding:'14px 18px', marginBottom:16, background:'linear-gradient(135deg,#120A30,#0A0618)', border:'1px solid #3A2060', borderRadius:14 }}>
            <div style={{ color:'#A78BFA', fontSize:11, fontWeight:700, marginBottom:6 }}>🔮 診断テーマ</div>
            <div style={{ color:C.text, fontSize:14 }}>「{q}」</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {parsed.map((s,i)=>(
              <div key={i} style={{ padding:'18px 20px', background:C.card, border:`1px solid ${s.color}28`, borderLeft:`3px solid ${s.color}`, borderRadius:14 }}>
                <div style={{ color:s.color, fontSize:12, fontWeight:700, marginBottom:10 }}>{s.icon} {s.label}</div>
                <div style={{ color:'#C8D0F0', fontSize:14, lineHeight:1.9 }}>{s.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setRes('');setImgUrl('');}} style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>別の相談</button>
            <button onClick={()=>share('運命診断結果',res)} style={{ flex:1, padding:'13px', background:GRAD, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>シェア</button>
          </div>
          {history.length>0&&<div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}` }}><div style={{ color:C.muted, fontSize:11, letterSpacing:'0.1em', marginBottom:10, textTransform:'uppercase' }}>履歴</div>{history.map((item,i)=><div key={i} onClick={()=>{setRes(item.result);setQ(item.input);}} style={{ padding:'10px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6, cursor:'pointer', color:C.muted, fontSize:13 }} onMouseEnter={e=>e.currentTarget.style.borderColor='#5A3AAA40'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{item.input}</div>)}</div>}
        </div>
      )}
    </div>
  );
}
