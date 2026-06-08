'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, callAI, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { supabase } from '../../lib/supabase';

const GRAD = 'linear-gradient(135deg,#3730A3,#7C3AED,#2563EB)';
const C = { bg:'#050812', card:'#0D0F28', border:'#252A52', text:'#E2E8FF', muted:'#5A6890', accent:'#7C6FFF', gold:'#E8C87A', green:'#4DFFA0' };

const EMOTION_COLORS = { '喜び':'#FFD93A','joy':'#FFD93A','悲しみ':'#7B9FFF','sadness':'#7B9FFF','怒り':'#FF6B6B','anger':'#FF6B6B','不安':'#C49BFF','anxiety':'#C49BFF','孤独':'#7A8090','loneliness':'#7A8090','希望':'#4DFFA0','hope':'#4DFFA0','疲れ':'#B09070','fatigue':'#B09070','感謝':'#E8C87A','gratitude':'#E8C87A','迷い':'#9A9DB0','confusion':'#9A9DB0','興奮':'#FF9A5A','excitement':'#FF9A5A' };

const T = {
  ja:{ title:'内省', subtitle:'毎日の記録が、やがて自分の地図になる', tabs:['今日','履歴','パターン'], inputLabel:'今日の気持ちや出来事', placeholder:'何があったか、どんな気分だったか…思ったこと何でも', saveBtn:'記録する', saving:'記録中…', savedMsg:'記録しました', emptyHistory:'まだ記録がありません', patternLock:'あと{n}日分でパターン分析が解放されます', patternTitle:'あなたの感情パターン', patternBtn:'パターンを分析する', analyzing:'記録を読み解いています…', langHint:'EN', todayDone:'今日の記録' },
  en:{ title:'Naïsei', subtitle:'Daily records become a map of yourself', tabs:['Today','History','Patterns'], inputLabel:'How are you feeling today?', placeholder:'What happened, how you felt…anything', saveBtn:'Record', saving:'Saving…', savedMsg:'Recorded', emptyHistory:'No records yet', patternLock:'Pattern analysis unlocks after {n} more days', patternTitle:'Your Emotional Patterns', patternBtn:'Analyze My Patterns', analyzing:'Reading your records…', langHint:'JA', todayDone:"Today's record" },
};

const MIN_ENTRIES = 7;
const LOCAL_KEY = 'kokoro_entries';
function loadLocal() { if (typeof window==='undefined') return []; return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); }
function saveLocal(e) { const p=loadLocal(); localStorage.setItem(LOCAL_KEY,JSON.stringify([e,...p].slice(0,200))); }
async function saveRemote(uid,e) { if (!supabase) return; await supabase.from('daily_entries').insert({ user_id:uid, entry_date:e.date, mood_text:e.text, emotion_tags:e.tags, lang:e.lang }); }
async function loadRemote(uid) { if (!supabase) return []; const{data}=await supabase.from('daily_entries').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100); return (data||[]).map(d=>({ id:d.id, date:d.entry_date, text:d.mood_text, tags:d.emotion_tags||[], lang:d.lang, created_at:d.created_at })); }
async function extractTags(text,lang) {
  const p=lang==='en'?`Extract 2-4 emotion tags from this journal. Output ONLY a JSON array. Example: ["hope","anxiety"]\n\nEntry: "${text}"` :`この日記から感情タグを2〜4個抽出。JSON配列のみ出力。例：["希望","不安"]\n\n日記：「${text}」`;
  try{ const r=await callAI('You extract emotion tags. Output only a JSON array.',p,100); const m=r.match(/\[.*\]/s); return m?JSON.parse(m[0]):[];}catch{return[];}
}
async function analyzePatterns(entries,lang) {
  const s=entries.slice(0,30).map((e,i)=>`${i+1}. [${e.date}] ${e.tags.join(',')} - ${e.text.slice(0,60)}`).join('\n');
  const p=lang==='en'?`Analyze these journals and find emotional patterns:\n[Pattern 1] ...\n[Pattern 2] ...\n[Insight] ...\n[Message] ...\n\n${s}`:`以下の日記から感情パターンを分析：\n【パターン1】\n【パターン2】\n【洞察】\n【メッセージ】\n\n${s}`;
  return callAI(lang==='en'?'You are a compassionate psychological pattern analyst.':'共感力の高い心理パターン分析の専門家です。',p,800);
}

const EmotionTag = ({ tag, large }) => { const color=EMOTION_COLORS[tag]||C.muted; return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:large?'7px 16px':'4px 10px', margin:3, borderRadius:20, fontSize:large?13:11, fontWeight:600, background:`${color}20`, color, border:`1px solid ${color}40` }}><span style={{ width:6,height:6,borderRadius:'50%',background:color,display:'inline-block' }}/>{tag}</span>; };

const CalendarHeatmap = ({ entries }) => {
  const weeks = 9;
  const today = new Date(); today.setHours(0,0,0,0);
  const cells = [];
  for (let w = weeks-1; w >= 0; w--) {
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today); dt.setDate(today.getDate() - (w*7+d));
      const dateStr = dt.toLocaleDateString('en-CA');
      const entry = entries.find(e=>e.date===dateStr);
      const domTag = entry?.tags?.[0];
      const color = domTag ? (EMOTION_COLORS[domTag]||'#4A5080') : null;
      cells.push({ dateStr, color, hasEntry: !!entry });
    }
  }
  const dayLabels = ['日','月','火','水','木','金','土'];
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>感情カレンダー</div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'16px 18px' }}>
        <div style={{ display:'flex', gap:4 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:3, marginRight:4 }}>
            {dayLabels.map((d,i)=><div key={i} style={{ height:13, fontSize:9, color:C.muted, lineHeight:'13px', textAlign:'right' }}>{i%2===0?d:''}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${weeks},1fr)`, gridTemplateRows:'repeat(7,1fr)', gap:3, flex:1 }}>
            {Array.from({length:weeks},(_,w)=>Array.from({length:7},(_,d)=>{
              const cell=cells[w*7+(6-d)];
              return <div key={`${w}-${d}`} title={cell?.dateStr||''} style={{ width:'100%', paddingTop:'100%', borderRadius:3, background: cell?.color ? `${cell.color}CC` : '#0D1230', border: cell?.hasEntry ? `1px solid ${cell.color}` : '1px solid #1A1E40', cursor: cell?.hasEntry ? 'pointer' : 'default', transition:'opacity 0.2s', position:'relative' }} onMouseEnter={e=>{if(cell?.hasEntry)e.currentTarget.style.opacity='0.7';}} onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}/>;
            }))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10, justifyContent:'flex-end' }}>
          <span style={{ color:C.muted, fontSize:10 }}>少ない</span>
          {['#FFD93A','#4DFFA0','#7B9FFF','#C49BFF','#FF6B6B'].map(c=><div key={c} style={{ width:10, height:10, borderRadius:2, background:c+'99' }}/>)}
          <span style={{ color:C.muted, fontSize:10 }}>多い</span>
        </div>
      </div>
    </div>
  );
};

const EntryCard = ({ entry }) => { const[open,setOpen]=useState(false); return <div onClick={()=>setOpen(o=>!o)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 18px', marginBottom:8, cursor:'pointer', transition:'border-color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#4040A0'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><span style={{ color:C.muted, fontSize:11 }}>{entry.date}</span><div style={{ display:'flex', flexWrap:'wrap', justifyContent:'flex-end' }}>{entry.tags.map(t=><EmotionTag key={t} tag={t}/>)}</div></div>{open&&<div style={{ color:C.text, fontSize:13, lineHeight:1.9, marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>{entry.text}</div>}{!open&&<div style={{ color:C.muted, fontSize:12, lineHeight:1.7, marginTop:8 }}>{entry.text.slice(0,80)}{entry.text.length>80?'…':''}</div>}</div>; };

export default function Kokoro() {
  const auth=useAuth();
  const[lang,setLang]=useState('ja');
  const[tab,setTab]=useState(0);
  const[text,setText]=useState('');
  const[entries,setEntries]=useState([]);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[newTags,setNewTags]=useState([]);
  const[pattern,setPattern]=useState('');
  const[analyzing,setAnalyzing]=useState(false);
  const[focused,setFocused]=useState(false);
  const t=T[lang];

  useEffect(()=>{ async function load(){ if(auth?.user){const r=await loadRemote(auth.user.id);setEntries(r.length>0?r:loadLocal());}else setEntries(loadLocal()); } load(); },[auth?.user]);

  const today=new Date().toLocaleDateString('en-CA');
  const todayEntry=entries.find(e=>e.date===today);
  const remaining=Math.max(0,MIN_ENTRIES-entries.length);
  const canAnalyze=entries.length>=MIN_ENTRIES;
  const streak=entries.length>0?Math.ceil((new Date()-new Date(entries[entries.length-1]?.date||new Date()))/86400000)+1:0;
  const tagCount={}; entries.forEach(e=>e.tags.forEach(tag=>{tagCount[tag]=(tagCount[tag]||0)+1;}));
  const topTags=Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const handleSave=async()=>{ if(!text.trim())return; setSaving(true); const tags=await extractTags(text,lang); const entry={id:Date.now(),date:today,text,tags,lang,created_at:new Date().toISOString()}; saveLocal(entry); if(auth?.user)await saveRemote(auth.user.id,entry); setEntries([entry,...entries.filter(e=>e.date!==today)]); setNewTags(tags); setText(''); setSaving(false); setSaved(true); setTimeout(()=>{setSaved(false);setNewTags([]);},4000); };
  const handleAnalyze=async()=>{ setAnalyzing(true); const r=await analyzePatterns(entries,lang); setPattern(r); setAnalyzing(false); };

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🪞" title={t.title} sub={t.subtitle} grad={GRAD}
        badge={entries.length>0?<>{streak>0&&<><span>🔥</span><span>{streak}日連続</span></>}<span style={{ marginLeft:streak>0?8:0 }}>📝 {entries.length}件</span></>:null}>
        <div style={{ marginTop:16, display:'flex', gap:8, justifyContent:'center' }}>
          {['ja','en'].map(l=><button key={l} onClick={()=>setLang(l)} style={{ padding:'5px 14px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, border:`1px solid ${lang===l?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.2)'}`, background:lang===l?'rgba(255,255,255,0.2)':'transparent', color:'rgba(255,255,255,0.75)' }}>{l.toUpperCase()}</button>)}
        </div>
      </AppHero>

      <AuthBadge />

      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.card, borderRadius:14, padding:4, border:`1px solid ${C.border}` }}>
        {t.tabs.map((tb,i)=><button key={i} onClick={()=>setTab(i)} style={{ flex:1, padding:'11px 4px', borderRadius:11, background:tab===i?'linear-gradient(135deg,#3730A3,#6366F1)':'transparent', border:'none', fontFamily:'inherit', fontSize:13, fontWeight:tab===i?700:400, cursor:'pointer', color:tab===i?'#fff':C.muted, transition:'all 0.2s' }}>{tb}</button>)}
      </div>

      {/* 今日タブ */}
      {tab===0&&(
        <div>
          {saved?(
            <div style={{ padding:'36px 24px', textAlign:'center', background:'linear-gradient(135deg,#0A1A18,#0A1220)', border:'1px solid #1A4A30', borderRadius:20 }}>
              <div style={{ fontSize:44, marginBottom:14 }}>✨</div>
              <div style={{ color:C.green, fontSize:18, fontWeight:700, marginBottom:18 }}>{t.savedMsg}</div>
              {newTags.length>0&&<div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center' }}>{newTags.map(tag=><EmotionTag key={tag} tag={tag} large/>)}</div>}
            </div>
          ):(
            <>
              {todayEntry&&<div style={{ marginBottom:16, padding:'16px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}><div style={{ color:C.muted, fontSize:11, marginBottom:8 }}>{t.todayDone}</div><div style={{ color:C.text, fontSize:13, lineHeight:1.8, marginBottom:10 }}>{todayEntry.text}</div><div style={{ display:'flex', flexWrap:'wrap' }}>{todayEntry.tags.map(tag=><EmotionTag key={tag} tag={tag}/>)}</div></div>}
              <div style={{ background:C.card, border:`1px solid ${focused?'#6366F155':C.border}`, borderRadius:16, overflow:'hidden', boxShadow:focused?'0 0 0 3px #6366F120':'none', transition:'all 0.3s', marginBottom:16 }}>
                <div style={{ padding:'14px 18px 6px', color:C.muted, fontSize:12, fontWeight:600 }}>{t.inputLabel}</div>
                <textarea value={text} onChange={e=>setText(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder={t.placeholder} rows={7} style={{ width:'100%', padding:'8px 18px 18px', background:'transparent', border:'none', color:C.text, fontSize:15, fontFamily:'inherit', lineHeight:1.9, resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <HeroBtn onClick={handleSave} disabled={!text.trim()||saving} grad={GRAD}>{saving?t.saving:t.saveBtn}</HeroBtn>
            </>
          )}
        </div>
      )}

      {/* 履歴タブ */}
      {tab===1&&(
        <div>
          {entries.length===0?<div style={{ textAlign:'center', padding:'60px 0', color:C.muted, fontSize:15, lineHeight:2 }}>📝<br/>{t.emptyHistory}</div>:<>{entries.length>=3&&<CalendarHeatmap entries={entries}/>}{topTags.length>0&&<div style={{ marginBottom:20, padding:'14px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:14 }}><div style={{ color:C.muted, fontSize:11, marginBottom:10 }}>よく感じること</div><div style={{ display:'flex', flexWrap:'wrap' }}>{topTags.slice(0,4).map(([tag])=><EmotionTag key={tag} tag={tag}/>)}</div></div>}<div style={{ color:C.muted, fontSize:11, marginBottom:12 }}>{entries.length}件 · タップで開く</div>{entries.map(e=><EntryCard key={e.id||e.date} entry={e}/>)}</>}
        </div>
      )}

      {/* パターンタブ */}
      {tab===2&&(
        <div>
          {!canAnalyze?(
            <div style={{ textAlign:'center', padding:'48px 24px' }}>
              <div style={{ fontSize:52, marginBottom:18 }}>🔒</div>
              <div style={{ color:C.text, fontSize:16, marginBottom:10, lineHeight:1.8 }}>{t.patternLock.replace('{n}',remaining)}</div>
              <div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>蓄積されるほど、より深いパターンが見えてきます</div>
              <div style={{ background:C.border, borderRadius:8, height:8, maxWidth:260, margin:'0 auto' }}><div style={{ width:`${(entries.length/MIN_ENTRIES)*100}%`, background:`linear-gradient(90deg,#7C3AED,#6366F1)`, height:'100%', borderRadius:8, transition:'width 0.5s' }}/></div>
              <div style={{ color:C.muted, fontSize:12, marginTop:8 }}>{entries.length} / {MIN_ENTRIES}</div>
            </div>
          ):(
            <div>
              {!pattern&&!analyzing&&<div style={{ textAlign:'center', padding:'36px 24px' }}><div style={{ width:80,height:80,borderRadius:'50%',margin:'0 auto 20px',background:'linear-gradient(135deg,#3730A3,#6366F1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>🔍</div><div style={{ color:C.text, fontSize:15, marginBottom:8, lineHeight:1.8 }}>{entries.length}件の記録を分析します</div><div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>あなたの感情のパターンを発見します</div><HeroBtn onClick={handleAnalyze} grad={GRAD}>{t.patternBtn}</HeroBtn></div>}
              {analyzing&&<div style={{ textAlign:'center', padding:'60px 0' }}><div style={{ fontSize:36, marginBottom:16, animation:'spin 2s linear infinite', display:'inline-block' }}>✨</div><div style={{ color:C.muted, fontSize:14, marginTop:8 }}>{t.analyzing}</div></div>}
              {pattern&&!analyzing&&<div><div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:14 }}>🔍 {t.patternTitle}</div><div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22, color:C.text, fontSize:13, lineHeight:2.1, whiteSpace:'pre-wrap', marginBottom:12 }}>{pattern}</div><div style={{ display:'flex', gap:10 }}><button onClick={handleAnalyze} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>再分析</button><button onClick={()=>share(t.patternTitle,pattern)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>シェア</button></div></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
