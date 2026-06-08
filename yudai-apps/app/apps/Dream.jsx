'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, Loading, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const GRAD = 'linear-gradient(135deg,#042F2E,#0D9488,#0891B2)';
const C = { card:'#040F0E', border:'#0A2828', text:'#C0F0F0', muted:'#2A6060', accent:'#0D9488' };

const T = {
  ja:{ title:'夢映像化', subtitle:'消えゆく夢を、詩的散文として永遠に', inputLabel:'覚えている夢の断片を書いてください', placeholder:'例：知らない街にいた。空の色がおかしくてオレンジと青が混ざっていた…', btn:'夢を映像化する', generating:'夢の映像を生成中...', shareTitle:'夢の記録', titleKey:/【タイトル】([^\n]+)/, proseKey:/【映像詩】([\s\S]+?)(?=【|$)/, emotionKey:/【この夢が映す感情】([\s\S]+?)$/, system:`あなたは夢を詩的散文に変換するアーティストです。出力：\n【タイトル】夢の本質を捉えた詩的なタイトル\n【映像詩】200〜250字、情景・色・温度・音を織り込んだ散文詩\n【この夢が映す感情】1〜2文の心理的考察`, userPrompt:(d)=>`見た夢：\n${d}` },
  en:{ title:'Dream Visuals', subtitle:'Turn your fading dreams into poetry that lasts forever', inputLabel:'Write down whatever fragments of your dream you remember', placeholder:'e.g. I was in a city I didn\'t recognize. The sky was a strange mix of orange and blue…', btn:'Visualize My Dream', generating:'Painting your dream…', shareTitle:'My Dream Record', titleKey:/\[Title\]([^\n]+)/, proseKey:/\[Visual Poem\]([\s\S]+?)(?=\[|$)/, emotionKey:/\[Emotion\]([\s\S]+?)$/, system:`You are an artist who transforms dreams into poetic prose. Output:\n[Title] A poetic title capturing the essence\n[Visual Poem] 150-200 words with scenery, color, temperature, sound\n[Emotion] 1-2 sentences of psychological insight`, userPrompt:(d)=>`Dream I had:\n${d}` },
};

export default function Dream() {
  const auth=useAuth();
  const[lang,setLang]=useState('ja');
  const[dream,setDream]=useState('');
  const[res,setRes]=useState('');
  const[imgUrl,setImgUrl]=useState('');
  const[imgLoaded,setImgLoaded]=useState(false);
  const[loading,setLoading]=useState(false);
  const[history,setHistory]=useState([]);
  const t=T[lang];
  const gate=useGate('dream');

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await getHistoryRemote('dream',auth.user.id);setHistory(r||getHistoryLocal('dream'));}else setHistory(getHistoryLocal('dream')); } load(); },[auth?.user]);

  const run=async()=>{ if(!gate.check())return; setLoading(true);setImgUrl('');setImgLoaded(false);
    const r=await callAI(t.system,t.userPrompt(dream));
    setRes(r);
    const title=r.match(t.titleKey)?.[1]?.trim()||'surreal dreamscape';
    const prose=r.match(t.proseKey)?.[1]?.replace(/\n/g,' ').slice(0,100)||'';
    const imgPrompt=`${title}, ${prose}, ethereal, surreal, soft glow, dreamlike, watercolor, cinematic`;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=512&height=320&nologo=true&seed=${Date.now()}`);
    await saveHistory('dream',dream.slice(0,40)+'…',r,auth?.user?.id);
    const h=auth?.user?await getHistoryRemote('dream',auth.user.id):getHistoryLocal('dream');
    setHistory(h||[]);
    gate.increment();
    setLoading(false);
  };

  const titleText=res.match(t.titleKey)?.[1]?.trim()||'';
  const proseText=res.match(t.proseKey)?.[1]?.trim()||'';
  const emotionText=res.match(t.emotionKey)?.[1]?.trim()||'';

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🌙" title={t.title} sub={t.subtitle} grad={GRAD}>
        <div style={{ marginTop:14, display:'flex', gap:6, justifyContent:'center' }}>
          {['ja','en'].map(l=><button key={l} onClick={()=>setLang(l)} style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, border:`1px solid ${lang===l?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`, background:lang===l?'rgba(255,255,255,0.2)':'transparent', color:'rgba(255,255,255,0.75)' }}>{l.toUpperCase()}</button>)}
        </div>
      </AppHero>

      <AuthBadge/>
      <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang}/>
      {gate.blocked&&<PaywallModal onClose={gate.dismiss} lang={lang}/>}

      {!res&&(
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:8 }}>{t.inputLabel}</div>
            <textarea value={dream} onChange={e=>setDream(e.target.value)} placeholder={t.placeholder} rows={6} style={{ width:'100%', padding:'12px 14px', background:'#020808', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }} onFocus={e=>{e.target.style.borderColor='#0D948855';e.target.style.boxShadow='0 0 0 3px #0D948815';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <HeroBtn onClick={run} disabled={!dream.trim()} grad={GRAD}>{t.btn}</HeroBtn>
        </div>
      )}

      {loading&&<Loading/>}

      {res&&!loading&&(
        <div>
          {imgUrl&&(
            <div style={{ marginBottom:16, background:'#020808', borderRadius:16, overflow:'hidden', minHeight:imgLoaded?0:180, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {!imgLoaded&&<div style={{ color:C.muted, fontSize:13 }}>{t.generating}</div>}
              <img src={imgUrl} alt="dream" onLoad={()=>setImgLoaded(true)} style={{ width:'100%', display:imgLoaded?'block':'none', opacity:0.85, borderRadius:16 }}/>
            </div>
          )}
          {titleText&&<div style={{ textAlign:'center', marginBottom:16 }}><h2 style={{ color:'#7DDDD8', fontSize:22, fontWeight:800, margin:0, letterSpacing:'-0.02em' }}>「{titleText}」</h2></div>}
          {proseText&&(
            <div style={{ padding:'22px 24px', marginBottom:12, background:'linear-gradient(135deg,#041A18,#030F0E)', border:`1px solid ${C.border}`, borderRadius:16 }}>
              <div style={{ color:'#86C8C8', fontSize:15, lineHeight:2.1, fontStyle:'italic', whiteSpace:'pre-wrap' }}>{proseText}</div>
            </div>
          )}
          {emotionText&&(
            <div style={{ padding:'14px 18px', marginBottom:16, background:C.card, border:`1px solid ${C.accent}25`, borderLeft:`3px solid ${C.accent}`, borderRadius:12 }}>
              <div style={{ color:C.accent, fontSize:12, fontWeight:600, marginBottom:6 }}>💭 この夢が映す感情</div>
              <div style={{ color:'#A0D8D8', fontSize:13, lineHeight:1.8 }}>{emotionText}</div>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{setRes('');setImgUrl('');}} style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>別の夢</button>
            <button onClick={()=>share(t.shareTitle,res)} style={{ flex:1, padding:'13px', background:GRAD, border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>シェア</button>
          </div>
          {history.length>0&&<div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}` }}><div style={{ color:C.muted, fontSize:11, letterSpacing:'0.1em', marginBottom:10, textTransform:'uppercase' }}>履歴</div>{history.map((item,i)=><div key={i} onClick={()=>setRes(item.result)} style={{ padding:'10px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:6, cursor:'pointer', color:C.muted, fontSize:13 }} onMouseEnter={e=>e.currentTarget.style.borderColor='#0D948840'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{item.input}</div>)}</div>}
        </div>
      )}
    </div>
  );
}
