'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, Loading, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const GRAD = 'linear-gradient(135deg,#064E3B,#059669,#0D9488)';
const C = { bg:'#050812', card:'#0D0F1A', border:'#1A2A20', text:'#E2F0E8', muted:'#4A6A58', green:'#34D399', gold:'#FFD700' };

const T = {
  ja:{ title:'言葉モンスター', subtitle:'あなたの言葉から、唯一無二の存在が生まれる', diaryLabel:'今日の気持ちや出来事', diaryPlaceholder:'例：会議でうまく話せなかった。でも帰り道の夕焼けがきれいで、少し救われた…', imageLabel:'モンスターのイメージ（任意）', imagePlaceholder:'例：暗い紫色の翼、炎を纏った爪…', summon:'モンスターを召喚', generating:'画像生成中...', shareTitle:'言葉モンスター召喚！', tabSummon:'召喚', tabZukan:'図鑑', zukanEmpty:'まだモンスターがいません。\n召喚して図鑑を埋めていこう！', rareBadge:'✨ レア', system:`あなたは言葉から「感情モンスター」を召喚するクリエイターです。出力：\n【名前】カタカナ3〜5文字\n【タイプ】例：迷いの翼型\n【レア度】通常 または レア（10%の確率でレアにする）\n【特徴】外見を3行で描写\n【スキル】感情から生まれた特殊能力2つ\n【一言】モンスターがあなたに言う言葉\nテキスト絵文字も使う。`, userPrompt:(d,v)=>`今日の日記：\n${d}${v?`\n\nユーザーのイメージ：\n${v}`:''}` },
  en:{ title:'Word Monster', subtitle:'Your words summon a one-of-a-kind creature', diaryLabel:'Write about your feelings today', diaryPlaceholder:'e.g. I couldn\'t speak up in the meeting. But the sunset was beautiful…', imageLabel:'Monster image idea (optional)', imagePlaceholder:'e.g. Dark purple wings, claws wrapped in flames…', summon:'Summon Monster', generating:'Generating…', shareTitle:'Word Monster Summoned!', tabSummon:'Summon', tabZukan:'Collection', zukanEmpty:'No monsters yet.\nSummon one to start your collection!', rareBadge:'✨ Rare', system:`You are a creator who summons "emotion monsters" from words. Output:\n[Name] 2-4 word dramatic name\n[Type] e.g. "Wings of Doubt"\n[Rarity] Common or Rare (Rare ~10%)\n[Appearance] 3 lines\n[Skills] 2 special abilities\n[Message] One thing the monster says`, userPrompt:(d,v)=>`Today's journal:\n${d}${v?`\n\nImage idea:\n${v}`:''}` },
};

const ZUKAN_KEY='monster_zukan';
function loadZukan(){if(typeof window==='undefined')return[];return JSON.parse(localStorage.getItem(ZUKAN_KEY)||'[]');}
function saveZukan(e){const p=loadZukan();const u=[e,...p].slice(0,100);localStorage.setItem(ZUKAN_KEY,JSON.stringify(u));return u;}
function parseRarity(text,lang){return lang==='en'?/\[Rarity\]\s*Rare/i.test(text)?'rare':'common':/【レア度】レア/.test(text)?'rare':'common';}
function parseName(text,lang){return lang==='en'?text.match(/\[Name\]([^\n]+)/)?.[1]?.trim()||'???':text.match(/【名前】([^\n]+)/)?.[1]?.trim()||'???';}
function parseType(text,lang){return lang==='en'?text.match(/\[Type\]([^\n]+)/)?.[1]?.trim()||'':text.match(/【タイプ】([^\n]+)/)?.[1]?.trim()||'';}
function buildImagePrompt(text,vision,lang){const isEn=lang==='en';const nameKey=isEn?/\[Name\]([^\n]+)/:/ 【名前】([^\n]+)/;const typeKey=isEn?/\[Type\]([^\n]+)/:/ 【タイプ】([^\n]+)/;const featKey=isEn?/\[Appearance\]([\s\S]+?)(?=\[|$)/:/ 【特徴】([\s\S]+?)(?=【|$)/;const name=text.match(nameKey)?.[1]?.trim()||'monster';const type=text.match(typeKey)?.[1]?.trim()||'';const feat=text.match(featKey)?.[1]?.replace(/\n/g,' ').trim().slice(0,80)||'';const vp=vision?`, ${vision.slice(0,60)}`:'';return `fantasy creature, ${name}, ${type}, ${feat}${vp}, dark background, dramatic lighting, digital art, ultra detailed, cinematic, no text`;}

export default function Monster() {
  const auth=useAuth();
  const[lang,setLang]=useState('ja');
  const[tab,setTab]=useState('summon');
  const[diary,setDiary]=useState('');
  const[vision,setVision]=useState('');
  const[res,setRes]=useState('');
  const[imgUrl,setImgUrl]=useState('');
  const[imgLoaded,setImgLoaded]=useState(false);
  const[loading,setLoading]=useState(false);
  const[zukan,setZukan]=useState([]);
  const[newRare,setNewRare]=useState(false);
  const t=T[lang];
  const gate=useGate('monster');

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await getHistoryRemote('monster',auth.user.id);} else getHistoryLocal('monster'); } load(); setZukan(loadZukan()); },[auth?.user]);

  const stats={ total:zukan.length, rare:zukan.filter(z=>z.rarity==='rare').length };

  const run=async()=>{ if(!gate.check())return; setLoading(true);setImgUrl('');setImgLoaded(false);setNewRare(false); const r=await callAI(t.system,t.userPrompt(diary,vision)); setRes(r); const prompt=buildImagePrompt(r,vision,lang); const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`; setImgUrl(url); const rarity=parseRarity(r,lang); const name=parseName(r,lang); const type=parseType(r,lang); if(rarity==='rare')setNewRare(true); const entry={id:Date.now(),name,type,rarity,imgUrl:url,text:r,diary:diary.slice(0,40),date:new Date().toLocaleDateString('ja-JP')}; const updated=saveZukan(entry); setZukan(updated); await saveHistory('monster',diary.slice(0,40)+'…',r,auth?.user?.id); gate.increment(); setLoading(false); };

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="👾" title={t.title} sub={t.subtitle} grad={GRAD}
        badge={stats.total>0?<><span>📖 {stats.total}体収集</span>{stats.rare>0&&<span style={{ marginLeft:8, color:C.gold }}>✨ {stats.rare}レア</span>}</>:null}>
        <div style={{ marginTop:14, display:'flex', gap:6, justifyContent:'center' }}>
          {['ja','en'].map(l=><button key={l} onClick={()=>setLang(l)} style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, border:`1px solid ${lang===l?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`, background:lang===l?'rgba(255,255,255,0.2)':'transparent', color:'rgba(255,255,255,0.75)' }}>{l.toUpperCase()}</button>)}
        </div>
      </AppHero>

      <AuthBadge />
      <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang} />
      {gate.blocked&&<PaywallModal onClose={gate.dismiss} lang={lang}/>}

      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.card, borderRadius:14, padding:4, border:`1px solid ${C.border}` }}>
        {[['summon',`👾 ${t.tabSummon}`],['zukan',`📖 ${t.tabZukan}${stats.total>0?` (${stats.total})`:''}`]].map(([key,label])=><button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'11px 4px', borderRadius:11, background:tab===key?GRAD:'transparent', border:'none', fontFamily:'inherit', fontSize:13, fontWeight:tab===key?700:400, cursor:'pointer', color:tab===key?'#fff':C.muted, transition:'all 0.2s' }}>{label}</button>)}
      </div>

      {/* 召喚タブ */}
      {tab==='summon'&&(
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:8 }}>{t.diaryLabel}</div>
            <textarea value={diary} onChange={e=>setDiary(e.target.value)} placeholder={t.diaryPlaceholder} rows={5} style={{ width:'100%', padding:'12px 14px', background:'#08090E', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
            <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:8 }}>{t.imageLabel}</div>
            <textarea value={vision} onChange={e=>setVision(e.target.value)} placeholder={t.imagePlaceholder} rows={2} style={{ width:'100%', padding:'12px 14px', background:'#08090E', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <HeroBtn onClick={run} disabled={!diary.trim()} grad={GRAD}>{t.summon}</HeroBtn>
          {loading&&<Loading/>}
          {newRare&&!loading&&<div style={{ marginTop:14, padding:'12px 18px', background:'#1A1200', border:`1px solid ${C.gold}`, borderRadius:12, color:C.gold, fontSize:14, textAlign:'center', fontWeight:700 }}>✨ {lang==='ja'?'レアモンスター召喚！図鑑に追加されました':'Rare monster summoned! Added to collection!'}</div>}
          {res&&!loading&&(
            <div style={{ marginTop:18, background:C.card, borderRadius:16, border:`1px solid ${newRare?C.gold:C.border}`, overflow:'hidden' }}>
              {imgUrl&&<div style={{ background:'#030810', minHeight:imgLoaded?0:200, display:'flex', alignItems:'center', justifyContent:'center' }}>{!imgLoaded&&<div style={{ color:C.muted, fontSize:13 }}>{t.generating}</div>}<img src={imgUrl} alt="monster" onLoad={()=>setImgLoaded(true)} style={{ width:'100%', display:imgLoaded?'block':'none', borderRadius:'16px 16px 0 0' }}/></div>}
              <div style={{ padding:'20px 22px', color:C.text, fontSize:14, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{res}</div>
              <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ color:C.muted, fontSize:12 }}>📖 {lang==='ja'?'図鑑に自動追加済み':'Auto-saved'}</div>
                <button onClick={()=>share(t.shareTitle,res)} style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:12, padding:'7px 16px', cursor:'pointer', fontFamily:'inherit' }}>シェア</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 図鑑タブ */}
      {tab==='zukan'&&(
        <div>
          {zukan.length===0?<div style={{ textAlign:'center', color:C.muted, padding:'56px 0', fontSize:15, whiteSpace:'pre-line', lineHeight:2 }}>👾{'\n'}{t.zukanEmpty}</div>:(
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {zukan.map(m=>(
                <div key={m.id} onClick={()=>{setRes(m.text);setImgUrl(m.imgUrl);setImgLoaded(false);setTab('summon');}} style={{ background:m.rarity==='rare'?'#120E00':C.card, border:`1px solid ${m.rarity==='rare'?C.gold:C.border}`, borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'transform 0.15s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  {m.imgUrl&&<img src={m.imgUrl} alt={m.name} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }} onError={e=>e.target.style.display='none'}/>}
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <div style={{ color:C.text, fontSize:13, fontWeight:700 }}>{m.name}</div>
                      {m.rarity==='rare'&&<span style={{ fontSize:10, color:C.gold, background:'#2A1A00', padding:'2px 7px', borderRadius:8 }}>{t.rareBadge}</span>}
                    </div>
                    <div style={{ color:C.muted, fontSize:11 }}>{m.type}</div>
                    <div style={{ color:'#2A3870', fontSize:10, marginTop:4 }}>{m.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
