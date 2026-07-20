'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, saveHistory, getHistory, share } from './shared';
import { AuthBadge } from './AuthGate';

const WORLD = [
  { city:"東京", mood:72, flag:"🇯🇵" }, { city:"NY", mood:58, flag:"🇺🇸" },
  { city:"ロンドン", mood:65, flag:"🇬🇧" }, { city:"パリ", mood:61, flag:"🇫🇷" },
  { city:"ソウル", mood:69, flag:"🇰🇷" }, { city:"バンコク", mood:80, flag:"🇹🇭" },
  { city:"シドニー", mood:75, flag:"🇦🇺" }, { city:"ムンバイ", mood:67, flag:"🇮🇳" },
];
const labels=["","最悪","辛い","重い","しんどい","普通","まあまあ","良い","良い","とても良い","最高"];
const EMOJIS=["","😭","😢","😕","😐","🙂","😊","😄","🤩","✨","🚀"];

export default function Genki() {
  const[mood,setMood]=useState(7);
  const[submitted,setSubmitted]=useState(false);
  const[streak,setStreak]=useState(0);

  useEffect(()=>{ const h=getHistory('genki'); setStreak(h.length); },[]);

  const color=mood>=8?'#34D399':mood>=5?'#FBBF24':'#F87171';
  const GRAD=mood>=8?'linear-gradient(135deg,#064E3B,#059669)':mood>=5?'linear-gradient(135deg,#78350F,#D97706)':'linear-gradient(135deg,#7F1D1D,#DC2626)';

  const handleSubmit=()=>{ setSubmitted(true); saveHistory('genki',`気分:${mood}`,`${labels[mood]}（${mood}/10）`); setStreak(s=>s+1); };

  const world=submitted?WORLD.map((w,i)=>i===0?{...w,mood:mood*10}:w):WORLD;
  const avg=Math.round(world.reduce((a,b)=>a+b.mood,0)/world.length);

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:'#E2E8FF' }}>
      <AppHero icon="🌐" title="元気玉" sub="あなたの気分が世界と繋がる" grad={GRAD}
        badge={streak>0?<><span>🔥</span><span>{streak}日連続チェックイン</span></>:null}/>
      <AuthBadge/>

      {/* 気分メーター */}
      <div style={{ background:'#0D0F28', border:'1px solid #252A52', borderRadius:20, padding:'32px 24px', marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:88, fontWeight:900, color, lineHeight:1, marginBottom:4, textShadow:`0 0 60px ${color}55`, transition:'all 0.3s' }}>{EMOJIS[mood]}</div>
        <div style={{ fontSize:40, fontWeight:900, color, lineHeight:1, marginBottom:6, transition:'color 0.3s' }}>{mood}</div>
        <div style={{ color, fontSize:18, marginBottom:20, fontWeight:700, transition:'color 0.3s' }}>{labels[mood]}</div>
        {/* 絵文字グリッドセレクター */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:20 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>(
            <button key={n} onClick={()=>{setMood(n);setSubmitted(false);}} style={{ padding:'10px 4px', borderRadius:12, border:`2px solid ${mood===n?color:'#1A2040'}`, background:mood===n?`${color}22`:'#080A18', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontSize:22 }}>{EMOJIS[n]}</span>
              <span style={{ fontSize:10, color:mood===n?color:'#3A4870', fontWeight:mood===n?700:400 }}>{n}</span>
            </button>
          ))}
        </div>
        {submitted&&(
          <div style={{ marginTop:20, padding:'14px 18px', background:'#080A18', borderRadius:12, border:'1px solid #1E2448' }}>
            <span style={{ color:'#5A6890', fontSize:14 }}>世界平均 </span>
            <span style={{ color:'#E2E8FF', fontWeight:700, fontSize:16 }}>{avg}/100</span>
            <span style={{ color:'#5A6890', fontSize:14 }}> に対してあなたは </span>
            <span style={{ color, fontWeight:700, fontSize:16 }}>{mood*10}/100</span>
          </div>
        )}
      </div>

      <HeroBtn onClick={handleSubmit} grad={GRAD} style={{ marginBottom:20 }}>🌐 世界に送る</HeroBtn>

      {submitted&&(
        <button onClick={()=>share('今日の気分',`今日の気分は${mood}/10（${labels[mood]}）。世界平均は${avg}/100。`)} style={{ width:'100%', padding:'13px', background:'transparent', border:'1px solid #252A52', borderRadius:14, color:'#5A6890', fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:24 }}>シェア</button>
      )}

      {/* 世界の気分 */}
      <div style={{ marginBottom:8, color:'#3A4870', fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>世界の気分</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {world.map(w=>{
          const c=w.mood>=70?'#34D399':w.mood>=55?'#FBBF24':'#F87171';
          return (
            <div key={w.city} style={{ padding:'14px 16px', background:'#0D0F28', border:'1px solid #252A52', borderRadius:14, transition:'border-color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#404880'} onMouseLeave={e=>e.currentTarget.style.borderColor='#252A52'}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:14, color:'#E2E8FF', fontWeight:600 }}>{w.flag} {w.city}</span>
                <span style={{ color:c, fontSize:14, fontWeight:700 }}>{w.mood}</span>
              </div>
              <div style={{ height:5, background:'#1A2040', borderRadius:3 }}>
                <div style={{ height:'100%', width:`${w.mood}%`, background:c, borderRadius:3, transition:'width 0.6s ease' }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
