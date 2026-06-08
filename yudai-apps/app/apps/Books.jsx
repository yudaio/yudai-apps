'use client';
import { useState, useEffect } from 'react';
import { AppHero, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';
import { supabase } from '../../lib/supabase';

const GRAD = 'linear-gradient(135deg,#1E1B4B,#4F46E5,#6366F1)';
const C = { bg:'#050812', card:'#0D0F28', border:'#1E2448', text:'#E2E8FF', muted:'#5A6890', accent:'#6366F1', gold:'#C8A84B' };

const SHELF_KEY='bookshelf_v1';
const SPINE_COLORS=['#8B1A1A','#1A3A5C','#1A5C2A','#5C4A1A','#4A1A5C'];
const EMOTION_TAGS={ ja:["感動","勇気","共感","驚き","癒し","刺激","切なさ","希望","気づき","孤独"], en:["Moving","Inspiring","Relatable","Surprising","Healing","Stimulating","Bittersweet","Hopeful","Eye-opening","Lonely"] };

const T = {
  ja:{ title:'図書館', subtitle:'感情が、あなたの一冊を呼び寄せる', inputLabel:'今のあなたの気持ちや状況を書いてください', placeholder:'例：3年付き合った人と別れた。正しかったのかまだわからない。前に進みたいが何かが引っかかっている…', findBtn:'本を探す', searching:'書架を探索中…', tabs:['探索','本棚','声'], amazonBtn:'入手する', shareBtn:'共有', noteLabel:'この本の記録', notePlaceholder:'この本から得たもの、気づき、感想…', phrasePlaceholder:'永遠に残したいフレーズ…', emotionLabel:'この本が与えた感情', saveNote:'本棚に保存', shareNote:'みんなに共有', notesSaved:'記録完了', shelfEmpty:'本棚はまだ空です', communityTitle:'読者たちの声', communityEmpty:'最初の声を残してください', noResult:'見つかりませんでした。もう少し詳しく書いてみてください。', pages:'頁', recordedCount:(n)=>`${n}冊` },
  en:{ title:'Library', subtitle:'Your emotions will call forth the book meant for you', inputLabel:'Describe your feelings or situation', placeholder:'e.g. I ended a long relationship. I don\'t know if it was right. I want to move on but something holds me back…', findBtn:'Find My Book', searching:'Searching the stacks…', tabs:['Discover','Shelf','Voices'], amazonBtn:'Acquire', shareBtn:'Share', noteLabel:'Record this book', notePlaceholder:'What you gained, insights, thoughts…', phrasePlaceholder:'A phrase you want to keep forever…', emotionLabel:'How this book made you feel', saveNote:'Save to shelf', shareNote:'Share with world', notesSaved:'Recorded', shelfEmpty:'Your shelf is empty', communityTitle:'Voices from readers', communityEmpty:'Be the first to leave a voice', noResult:'Nothing found. Try writing more about your situation.', pages:'pp.', recordedCount:(n)=>`${n} book${n!==1?'s':''}` },
};

const loadShelf=()=>typeof window!=='undefined'?JSON.parse(localStorage.getItem(SHELF_KEY)||'[]'):[];
const addToShelf=(e)=>{ const u=[e,...loadShelf().filter(b=>b.id!==e.id)].slice(0,50); localStorage.setItem(SHELF_KEY,JSON.stringify(u)); };
async function postCommunity(e){ if(!supabase)return; await supabase.from('book_notes').insert({ book_title:e.title, phrase:e.phrase, note:e.note, emotions:e.emotions, lang:e.lang }); }
async function getCommunity(lang){ if(!supabase)return[]; const{data}=await supabase.from('book_notes').select('*').eq('lang',lang).order('created_at',{ascending:false}).limit(20); return data||[]; }

function EmotionTag({ label, active, onClick }) {
  return <button onClick={onClick} style={{ padding:'5px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:12, border:`1px solid ${active?C.accent:C.border}`, background:active?C.accent+'20':'transparent', color:active?'#A78BFA':C.muted, borderRadius:20, transition:'all 0.15s' }}>{label}</button>;
}

function BookCard({ book, explanation, lang, onNoted }) {
  const t=T[lang];
  const[showNote,setShowNote]=useState(false);
  const[saved,setSaved]=useState(false);
  const[note,setNote]=useState('');
  const[phrase,setPhrase]=useState('');
  const[emotions,setEmotions]=useState([]);
  const[busy,setBusy]=useState(false);
  const tags=EMOTION_TAGS[lang];
  const clean=explanation.replace(/【選択】\d+|\[Index\]\s*\d+/g,'').trim();
  const amazonUrl=`https://www.amazon${lang==='ja'?'.co.jp':'.com'}/s?k=${encodeURIComponent(book.title+' '+book.authors)}${lang==='ja'?'&tag=yudaiapps-22':''}`;

  const handleSave=async(pub)=>{ const e={id:Date.now(),title:book.title,authors:book.authors,thumbnail:book.thumbnail,note,phrase,emotions,lang,date:new Date().toLocaleDateString('ja-JP')}; addToShelf(e); if(pub){setBusy(true);await postCommunity(e);setBusy(false);} setSaved(true);onNoted?.(); };

  return (
    <div style={{ marginTop:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden' }}>
        {/* 本の情報 */}
        <div style={{ display:'flex', gap:16, padding:'20px 20px 16px' }}>
          {book.thumbnail?(
            <img src={book.thumbnail} alt={book.title} style={{ width:80, height:114, objectFit:'cover', borderRadius:8, flexShrink:0, boxShadow:'4px 4px 16px rgba(0,0,0,0.5)' }}/>
          ):(
            <div style={{ width:80, height:114, background:GRAD, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>📖</div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ background:C.accent+'15', color:'#A78BFA', fontSize:10, fontWeight:700, letterSpacing:'0.1em', padding:'3px 10px', borderRadius:12, display:'inline-block', marginBottom:10, border:`1px solid ${C.accent}30` }}>RECOMMENDED</div>
            <h3 style={{ color:C.text, fontSize:17, fontWeight:800, margin:'0 0 6px', lineHeight:1.3 }}>{book.title}</h3>
            <div style={{ color:C.muted, fontSize:13, marginBottom:8 }}>{book.authors}</div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {book.rating&&<span style={{ color:C.gold, fontSize:13, fontWeight:600 }}>★ {book.rating.toFixed(1)}</span>}
              {book.pageCount&&<span style={{ color:C.muted, fontSize:12 }}>{book.pageCount} {t.pages}</span>}
            </div>
          </div>
        </div>
        {/* AIコメント */}
        <div style={{ padding:'16px 20px', borderTop:`1px solid ${C.border}`, background:'#080A1A' }}>
          <div style={{ color:C.accent, fontSize:11, fontWeight:700, letterSpacing:'0.1em', marginBottom:8 }}>LIBRARIAN'S NOTE</div>
          <div style={{ color:'#A0B0D8', fontSize:14, lineHeight:1.9, fontStyle:'italic' }}>{clean}</div>
        </div>
        {/* アクション */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, flexWrap:'wrap' }}>
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'9px 18px', background:GRAD, borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>{t.amazonBtn}</a>
          <button onClick={()=>share(t.shareBtn,`「${book.title}」${book.authors}\n\n${clean}`)} style={{ padding:'9px 16px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{t.shareBtn}</button>
          {!saved&&<button onClick={()=>setShowNote(s=>!s)} style={{ padding:'9px 16px', background:showNote?C.accent+'20':'transparent', border:`1px solid ${showNote?C.accent:C.border}`, borderRadius:10, color:showNote?'#A78BFA':C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>✎ {lang==='ja'?'記録する':'Record'}</button>}
        </div>
      </div>

      {showNote&&!saved&&(
        <div style={{ marginTop:10, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
          <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:6 }}>{t.noteLabel}</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder={t.notePlaceholder} rows={3} style={{ width:'100%', padding:'11px 13px', background:'#080A1A', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:10 }}/>
          <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:6 }}>{lang==='ja'?'心に残ったフレーズ':'Memorable phrase'}</div>
          <textarea value={phrase} onChange={e=>setPhrase(e.target.value)} placeholder={t.phrasePlaceholder} rows={2} style={{ width:'100%', padding:'11px 13px', background:'#080A1A', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
          <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:10 }}>{t.emotionLabel}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
            {tags.map(tag=><EmotionTag key={tag} label={tag} active={emotions.includes(tag)} onClick={()=>setEmotions(e=>e.includes(tag)?e.filter(x=>x!==tag):[...e,tag])}/>)}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>handleSave(false)} disabled={!note&&!phrase&&emotions.length===0} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>{t.saveNote}</button>
            <button onClick={()=>handleSave(true)} disabled={(!note&&!phrase&&emotions.length===0)||busy} style={{ flex:1, padding:'12px', background:GRAD, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{busy?'…':t.shareNote}</button>
          </div>
        </div>
      )}
      {saved&&<div style={{ marginTop:10, padding:'12px 18px', background:'#0A1428', border:`1px solid ${C.accent}`, borderRadius:12, textAlign:'center', color:'#A78BFA', fontSize:13, fontWeight:700 }}>✦ {t.notesSaved} ✦</div>}
    </div>
  );
}

function ShelfItem({ item, index }) {
  const color=SPINE_COLORS[index%SPINE_COLORS.length];
  return (
    <div style={{ display:'flex', gap:14, padding:'14px 16px', background:C.card, border:`1px solid ${C.border}`, borderLeft:`5px solid ${color}`, borderRadius:12, marginBottom:8, transition:'all 0.15s', cursor:'default' }} onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
      {item.thumbnail&&<img src={item.thumbnail} alt="" style={{ width:36,height:52,objectFit:'cover',borderRadius:4,flexShrink:0 }}/>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
        <div style={{ color:C.muted, fontSize:12, marginBottom:6 }}>{item.authors}</div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{item.emotions?.slice(0,3).map(e=><span key={e} style={{ fontSize:10, padding:'2px 8px', background:color+'18', color, border:`1px solid ${color}30`, borderRadius:10 }}>{e}</span>)}</div>
      </div>
      <div style={{ color:C.muted, fontSize:10, alignSelf:'flex-end' }}>{item.date}</div>
    </div>
  );
}

export default function Books() {
  const auth=useAuth();
  const[lang,setLang]=useState('ja');
  const[tab,setTab]=useState(0);
  const[input,setInput]=useState('');
  const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[shelf,setShelf]=useState([]);
  const[community,setCommunity]=useState([]);
  const t=T[lang];
  const gate=useGate('books');

  useEffect(()=>{setInput('');setResult(null);setError('');},[lang]);
  useEffect(()=>{ if(tab===1)setShelf(loadShelf()); if(tab===2)getCommunity(lang).then(setCommunity); },[tab,lang]);

  const run=async()=>{ if(!gate.check()||!input.trim())return; setLoading(true);setResult(null);setError('');
    try{ const res=await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,lang})}); const data=await res.json(); if(data.error||!data.book)setError(t.noResult); else{setResult(data);gate.increment();} }catch{setError(t.noResult);} setLoading(false);
  };

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="📖" title={t.title} sub={t.subtitle} grad={GRAD}
        badge={shelf.length>0?<><span>📚</span><span>{t.recordedCount(shelf.length)}</span></>:null}>
        <div style={{ marginTop:14, display:'flex', gap:6, justifyContent:'center' }}>
          {['ja','en'].map(l=><button key={l} onClick={()=>setLang(l)} style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, border:`1px solid ${lang===l?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`, background:lang===l?'rgba(255,255,255,0.2)':'transparent', color:'rgba(255,255,255,0.75)' }}>{l.toUpperCase()}</button>)}
        </div>
      </AppHero>

      <AuthBadge/>
      <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang}/>
      {gate.blocked&&<PaywallModal onClose={gate.dismiss} lang={lang}/>}

      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.card, borderRadius:14, padding:4, border:`1px solid ${C.border}` }}>
        {t.tabs.map((tb,i)=><button key={i} onClick={()=>setTab(i)} style={{ flex:1, padding:'11px 4px', borderRadius:11, background:tab===i?GRAD:'transparent', border:'none', fontFamily:'inherit', fontSize:13, fontWeight:tab===i?700:400, cursor:'pointer', color:tab===i?'#fff':C.muted, transition:'all 0.2s' }}>{tb}</button>)}
      </div>

      {/* 探索タブ */}
      {tab===0&&(
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:8 }}>{t.inputLabel}</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={t.placeholder} rows={5} style={{ width:'100%', padding:'12px 14px', background:'#080A1A', border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }} onFocus={e=>{e.target.style.borderColor='#6366F155';e.target.style.boxShadow='0 0 0 3px #6366F115';}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <button onClick={run} disabled={!input.trim()||loading} style={{ width:'100%', padding:'17px', background:(!input.trim()||loading)?'#111428':GRAD, border:(!input.trim()||loading)?`1px solid ${C.border}`:'none', borderRadius:14, color:(!input.trim()||loading)?C.muted:'#fff', fontSize:17, fontWeight:800, cursor:(!input.trim()||loading)?'default':'pointer', fontFamily:'inherit', boxShadow:(!input.trim()||loading)?'none':'0 8px 32px rgba(99,102,241,0.3)', transition:'all 0.2s', letterSpacing:'-0.01em' }}>{loading?t.searching:t.findBtn}</button>
          {loading&&<div style={{ textAlign:'center', padding:'28px 0' }}><div style={{ display:'inline-flex', gap:6 }}>{[0,1,2].map(n=><div key={n} style={{ width:8,height:8,borderRadius:'50%',background:C.accent,animation:`bounce 1.2s ease-in-out ${n*0.2}s infinite` }}/>)}</div><style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style></div>}
          {error&&<div style={{ marginTop:14, color:'#F87171', fontSize:13, textAlign:'center' }}>{error}</div>}
          {result&&!loading&&<BookCard book={result.book} explanation={result.explanation} lang={lang} onNoted={()=>setShelf(loadShelf())}/>}
        </>
      )}

      {/* 本棚タブ */}
      {tab===1&&(
        <>{shelf.length===0?<div style={{ textAlign:'center', padding:'56px 0' }}><div style={{ fontSize:48, opacity:0.3, marginBottom:14 }}>📚</div><div style={{ color:C.muted, fontSize:14 }}>{t.shelfEmpty}</div></div>:<>{<div style={{ color:C.muted, fontSize:12, marginBottom:14 }}>{t.recordedCount(shelf.length)}</div>}{shelf.map((item,i)=><ShelfItem key={item.id} item={item} index={i}/>)}</>}</>
      )}

      {/* 声タブ */}
      {tab===2&&(
        <>{community.length===0?<div style={{ textAlign:'center', padding:'56px 0', color:C.muted, fontSize:14 }}>{t.communityEmpty}</div>:community.map((item,i)=>(
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
            <div style={{ color:C.accent, fontSize:12, fontWeight:600, marginBottom:8 }}>◎ {item.book_title}</div>
            {item.phrase&&<div style={{ color:C.text, fontSize:14, lineHeight:1.9, fontStyle:'italic', borderLeft:`3px solid ${C.gold}`, paddingLeft:14, marginBottom:10 }}>"{item.phrase}"</div>}
            {item.note&&<div style={{ color:C.muted, fontSize:13, lineHeight:1.7 }}>{item.note}</div>}
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:10 }}>{item.emotions?.map(e=><span key={e} style={{ fontSize:10,padding:'2px 8px',border:`1px solid ${C.border}`,color:C.muted,borderRadius:10 }}>{e}</span>)}</div>
          </div>
        ))}</>
      )}
    </div>
  );
}
