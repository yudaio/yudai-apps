'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, Loading, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const GRAD = 'linear-gradient(135deg,#7F1D1D,#DC2626,#EA580C)';
const C = { card:'#120808', border:'#2A1010', text:'#F0E0E0', muted:'#7A4A4A' };

const VIEWS = [
  { key:/【哲学的視点】([\s\S]+?)(?=【|$)/, label:'哲学的視点', icon:'🏛️', color:'#A78BFA' },
  { key:/【データ的視点】([\s\S]+?)(?=【|$)/, label:'データ的視点', icon:'📊', color:'#38BDF8' },
  { key:/【人間的視点】([\s\S]+?)(?=【|$)/, label:'人間的視点', icon:'💬', color:'#34D399' },
];

export default function Rant() {
  const auth=useAuth();
  const[topic,setTopic]=useState('');
  const[res,setRes]=useState('');
  const[question,setQuestion]=useState('');
  const[loading,setLoading]=useState(false);
  const[history,setHistory]=useState([]);

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await getHistoryRemote('rant',auth.user.id);setHistory(r||getHistoryLocal('rant'));}else setHistory(getHistoryLocal('rant')); } load(); },[auth?.user]);

  const run=async()=>{ setLoading(true);setRes('');setQuestion('');
    const r=await callAI('あなたはAIジャーナリストです。社会問題を哲学・データ・人間の3視点で公平に解剖します。出力：\n【哲学的視点】本質的な矛盾や構造を2〜3文\n【データ的視点】統計や研究が示す事実を2〜3文\n【人間的視点】当事者が感じていることを2〜3文\n【問い】読者に残す哲学的な問いかけを1文',`テーマ：${topic}`);
    setRes(r);
    const q=r.match(/【問い】([\s\S]+?)$/)?.[1]?.trim()||'';
    setQuestion(q);
    await saveHistory('rant',topic,r,auth?.user?.id);
    const h=auth?.user?await getHistoryRemote('rant',auth.user.id):getHistoryLocal('rant');
    setHistory(h||[]);
    setLoading(false);
  };

  const parsed=VIEWS.map(v=>({...v,text:res.match(v.key)?.[1]?.trim()||''})).filter(v=>v.text);

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="💢" title="鬱憤爆発" sub="理不尽を哲学・データ・人間の3視点で解剖する" grad={GRAD}/>
      <AuthBadge/>

      {!res&&(
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:'#8A4A4A', fontSize:12, fontWeight:600, marginBottom:8 }}>理不尽だと思うこと・社会への問いを入力してください</div>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="例：なぜ努力しても賃金が上がらないのか。" rows={5} style={{ width:'100%', padding:'12px 14px', background:'#0A0404', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }} onFocus={e=>{e.target.style.borderColor='#DC262655';e.target.style.boxShadow='0 0 0 3px #DC262615';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <HeroBtn onClick={run} disabled={!topic.trim()} grad={GRAD}>💢 解剖する</HeroBtn>
        </div>
      )}

      {loading&&<Loading/>}

      {res&&!loading&&(
        <div>
          <div style={{ padding:'14px 18px', marginBottom:16, background:'linear-gradient(135deg,#1A0808,#0E0404)', border:'1px solid #DC262628', borderRadius:14 }}>
            <div style={{ color:'#EF4444', fontSize:11, fontWeight:700, marginBottom:6 }}>💢 解剖テーマ</div>
            <div style={{ color:C.text, fontSize:14 }}>「{topic}」</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {parsed.map((v,i)=>(
              <div key={i} style={{ padding:'18px 20px', background:C.card, border:`1px solid ${v.color}25`, borderLeft:`3px solid ${v.color}`, borderRadius:14 }}>
                <div style={{ color:v.color, fontSize:12, fontWeight:700, marginBottom:10 }}>{v.icon} {v.label}</div>
                <div style={{ color:'#D8C8C8', fontSize:14, lineHeight:1.9 }}>{v.text}</div>
              </div>
            ))}
          </div>
          {question&&(
            <div style={{ padding:'22px 24px', marginBottom:16, background:'linear-gradient(135deg,#14082A,#0A0416)', border:'1px solid #A78BFA30', borderRadius:16, textAlign:'center' }}>
              <div style={{ color:'#A78BFA', fontSize:12, fontWeight:600, marginBottom:12 }}>🤔 あなたへの問い</div>
              <div style={{ color:'#E8D8FF', fontSize:16, lineHeight:1.8, fontStyle:'italic' }}>「{question}」</div>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setRes('');setQuestion('');}} style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>別のテーマ</button>
            <button onClick={()=>share(`「${topic}」を3視点で解剖`,res)} style={{ flex:1, padding:'13px', background:GRAD, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>シェア</button>
          </div>
          {history.length>0&&<div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}` }}><div style={{ color:C.muted, fontSize:11, letterSpacing:'0.1em', marginBottom:10, textTransform:'uppercase' }}>履歴</div>{history.map((item,i)=><div key={i} onClick={()=>{setRes(item.result);setTopic(item.input);}} style={{ padding:'10px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6, cursor:'pointer', color:C.muted, fontSize:13 }} onMouseEnter={e=>e.currentTarget.style.borderColor='#DC262640'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{item.input}</div>)}</div>}
        </div>
      )}
    </div>
  );
}
