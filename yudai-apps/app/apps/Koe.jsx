'use client';
import { useState, useEffect } from 'react';
import { AppHero, HeroBtn, callAI } from './shared';
import { AuthBadge } from './AuthGate';

const GRAD = 'linear-gradient(135deg,#78350F,#B45309,#92400E)';
const C = { bg:'#050812', card:'#0D0F28', border:'#2A2010', accent:'#C8A84B', text:'#E8DDD0', muted:'#8B7A5A', green:'#3AFF8A' };

const T = {
  ja:{ title:'声の遺産', subtitle:'あの人の言葉を、永遠に', tabs:['👤 登録','💬 話す','📜 記録'], addPerson:'+ 新しい人を登録', addEcho:'追加する', echoLabel:'口癖・思い出を追加', echoPlaceholder:'例：「失敗してもええ、また立ち上がれ」が口癖だった。', saved:'保存しました ✓', youLabel:'あなた', talkPlaceholder:'例：最近仕事で失敗して…どう思う？', langBtn:'EN' },
  en:{ title:'Voice Legacy', subtitle:'Keep their words alive, forever', tabs:['👤 Register','💬 Talk','📜 History'], addPerson:'+ Register someone', addEcho:'Add', echoLabel:"Add their words & memories", echoPlaceholder:"e.g. He always said 'Try again' when I failed.", saved:'Saved ✓', youLabel:'You', talkPlaceholder:"e.g. I failed at work today, what would you say?", langBtn:'JA' },
};

const PROFILES_KEY='koe_profiles';
const CONVOS_KEY='koe_convos';
function loadProfiles(){if(typeof window==='undefined')return[];return JSON.parse(localStorage.getItem(PROFILES_KEY)||'[]');}
function saveProfiles(p){localStorage.setItem(PROFILES_KEY,JSON.stringify(p));}
function loadConvos(id){if(typeof window==='undefined')return[];const all=JSON.parse(localStorage.getItem(CONVOS_KEY)||'{}');return all[id]||[];}
function saveConvo(id,c){const all=JSON.parse(localStorage.getItem(CONVOS_KEY)||'{}');all[id]=[c,...(all[id]||[])].slice(0,50);localStorage.setItem(CONVOS_KEY,JSON.stringify(all));}
async function talkAs(person,echoes,question,lang){
  const echoText=echoes.map((e,i)=>`${i+1}. ${e.text}`).join('\n');
  const system=lang==='en'?`You ARE ${person.name} (${person.rel}). Speak in first person as them.\nRespond based on their personality shown in these memories:\n${echoText}\n\nRules:\n- Speak as ${person.name}, not about them\n- Use their speech patterns from the memories\n- Be warm and authentic\n- Keep response under 150 words`:`あなたは${person.name}（${person.rel}）本人です。一人称で話してください。\n以下の思い出・言葉からその人の人柄を読み取って応答してください：\n${echoText}\n\nルール：\n- ${person.name}として話す\n- 口癖・話し方を使う\n- 温かく、自然に\n- 150字以内`;
  return callAI(system,question,300);
}

export default function Koe() {
  const[lang,setLang]=useState('ja');
  const[tab,setTab]=useState(0);
  const[profiles,setProfiles]=useState([]);
  const[selected,setSelected]=useState(null);
  const[convos,setConvos]=useState([]);
  const[name,setName]=useState('');
  const[rel,setRel]=useState('');
  const[echoText,setEchoText]=useState('');
  const[saved,setSaved]=useState(false);
  const[question,setQuestion]=useState('');
  const[talking,setTalking]=useState(false);
  const t=T[lang];

  useEffect(()=>{ const p=loadProfiles(); setProfiles(p); if(p.length>0&&!selected)setSelected(p[0]); },[]);
  useEffect(()=>{ if(selected)setConvos(loadConvos(selected.id)); },[selected]);

  const handleAddProfile=()=>{ if(!name.trim())return; const p={id:Date.now(),name:name.trim(),rel:rel.trim(),echoes:[],createdAt:new Date().toISOString()}; const u=[...profiles,p]; saveProfiles(u); setProfiles(u); setSelected(p); setName('');setRel(''); setSaved(true); setTimeout(()=>setSaved(false),2000); setTab(1); };
  const handleAddEcho=()=>{ if(!echoText.trim()||!selected)return; const echo={id:Date.now(),text:echoText.trim()}; const u=profiles.map(p=>p.id===selected.id?{...p,echoes:[...p.echoes,echo]}:p); saveProfiles(u); setProfiles(u); setSelected(u.find(p=>p.id===selected.id)); setEchoText(''); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const handleTalk=async()=>{ if(!question.trim()||!selected||talking||(selected.echoes||[]).length===0)return; setTalking(true); const response=await talkAs(selected,selected.echoes,question,lang); const c={id:Date.now(),question,response,date:new Date().toLocaleDateString('ja-JP')}; saveConvo(selected.id,c); setConvos(prev=>[c,...prev]); setQuestion(''); setTalking(false); };

  const echoes=selected?.echoes||[];

  return (
    <div style={{ maxWidth:640, margin:'0 auto', color:C.text }}>
      <AppHero icon="🕯️" title={t.title} sub={t.subtitle} grad={GRAD}
        badge={profiles.length>0?<><span>👤</span><span>{profiles.length}人登録中</span></>:null}>
        <div style={{ marginTop:14, display:'flex', gap:6, justifyContent:'center' }}>
          <button onClick={()=>setLang(l=>l==='ja'?'en':'ja')} style={{ padding:'5px 16px', borderRadius:20, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>{t.langBtn}</button>
        </div>
      </AppHero>

      <AuthBadge />

      {/* プロフィール選択 */}
      {profiles.length>0&&(
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {profiles.map(p=>(
            <button key={p.id} onClick={()=>{setSelected(p);setConvos(loadConvos(p.id));}} style={{ padding:'8px 16px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:13, border:`1px solid ${selected?.id===p.id?C.accent:'#2A2010'}`, background:selected?.id===p.id?'#2A1A00':'transparent', color:selected?.id===p.id?C.accent:C.muted, fontWeight:selected?.id===p.id?600:400, transition:'all 0.15s' }}>{p.name}（{p.rel||'—'}）</button>
          ))}
          <button onClick={()=>setTab(0)} style={{ padding:'8px 16px', borderRadius:20, cursor:'pointer', fontFamily:'inherit', fontSize:12, border:'1px solid #2A2010', background:'transparent', color:C.muted }}>{t.addPerson}</button>
        </div>
      )}

      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.card, borderRadius:14, padding:4, border:`1px solid #1A1808` }}>
        {t.tabs.map((tb,i)=><button key={i} onClick={()=>setTab(i)} style={{ flex:1, padding:'11px 4px', borderRadius:11, background:tab===i?GRAD:'transparent', border:'none', fontFamily:'inherit', fontSize:13, fontWeight:tab===i?700:400, cursor:'pointer', color:tab===i?'#fff':C.muted, transition:'all 0.2s' }}>{tb}</button>)}
      </div>

      {/* 登録タブ */}
      {tab===0&&(
        <div>
          <div style={{ background:C.card, border:'1px solid #1A1808', borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:8 }}>この人は誰ですか？</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={lang==='ja'?'例：父、祖母':'e.g. Dad, Grandma'} style={{ width:'100%', padding:'12px 14px', background:'#08090E', border:'1px solid #2A2010', borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none', marginBottom:10 }}/>
            <input value={rel} onChange={e=>setRel(e.target.value)} placeholder={lang==='ja'?'例：父親、恩師':'e.g. Father, Mentor'} style={{ width:'100%', padding:'12px 14px', background:'#08090E', border:'1px solid #2A2010', borderRadius:10, color:C.text, fontSize:14, fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}/>
          </div>
          <HeroBtn onClick={handleAddProfile} disabled={!name.trim()} grad={GRAD}>{lang==='ja'?'登録して言葉を追加する →':'Register & add memories →'}</HeroBtn>

          {selected&&(
            <div style={{ marginTop:28, background:C.card, border:'1px solid #1A1808', borderRadius:16, padding:20 }}>
              <div style={{ color:C.accent, fontSize:14, fontWeight:700, marginBottom:14 }}>{selected.name}{lang==='ja'?'の言葉を追加':'\'s memories'}</div>
              <div style={{ color:C.muted, fontSize:12, marginBottom:6 }}>{t.echoLabel}</div>
              <textarea value={echoText} onChange={e=>setEchoText(e.target.value)} placeholder={t.echoPlaceholder} rows={5} style={{ width:'100%', padding:'12px 14px', background:'#08090E', border:'1px solid #2A2010', borderRadius:10, color:C.text, fontSize:13, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
              <HeroBtn onClick={handleAddEcho} disabled={!echoText.trim()} grad={GRAD}>{t.addEcho}</HeroBtn>
              {saved&&<div style={{ marginTop:10, color:C.green, fontSize:13, textAlign:'center' }}>{t.saved}</div>}
              {echoes.length>0&&<div style={{ marginTop:18 }}><div style={{ color:C.muted, fontSize:11, marginBottom:10 }}>{lang==='ja'?`${echoes.length}件の言葉が記録されています`:`${echoes.length} memories recorded`}</div>{echoes.map(e=><div key={e.id} style={{ padding:'10px 14px', background:'#08090E', border:'1px solid #2A2010', borderLeft:`3px solid ${C.accent}`, borderRadius:8, marginBottom:6, color:C.text, fontSize:13, lineHeight:1.7 }}>"{e.text}"</div>)}</div>}
            </div>
          )}
        </div>
      )}

      {/* 話すタブ */}
      {tab===1&&(
        <div>
          {!selected?<div style={{ textAlign:'center', padding:'48px 0', color:C.muted, fontSize:14, lineHeight:2 }}>👤<br/>{lang==='ja'?'まだ誰も登録されていません':'No one registered yet'}</div>:echoes.length===0?(
            <div style={{ textAlign:'center', padding:'36px 24px', background:C.card, border:'1px solid #1A1808', borderRadius:20 }}>
              <div style={{ fontSize:40, marginBottom:14 }}>🕯️</div>
              <div style={{ color:C.text, fontSize:15, marginBottom:18 }}>{selected.name}{lang==='ja'?'の言葉がまだ登録されていません':'\'s memories aren\'t added yet'}</div>
              <button onClick={()=>setTab(0)} style={{ padding:'11px 24px', background:'#2A1A00', border:`1px solid ${C.accent}`, borderRadius:10, color:C.accent, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>{lang==='ja'?'言葉を追加する →':'Add memories →'}</button>
            </div>
          ):(
            <>
              {convos.slice(0,3).map(c=>(
                <div key={c.id} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
                    <div style={{ maxWidth:'80%', padding:'12px 16px', background:'#1A2060', border:'1px solid #2A3080', borderRadius:'14px 14px 2px 14px', color:'#C5D0F0', fontSize:13, lineHeight:1.7 }}>
                      <div style={{ color:'#4A5880', fontSize:10, marginBottom:4 }}>{t.youLabel}</div>{c.question}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ width:40,height:40,borderRadius:'50%',flexShrink:0,background:'#2A1A00',border:`1px solid ${C.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🕯️</div>
                    <div style={{ flex:1, padding:'12px 16px', background:C.card, border:'1px solid #1A1808', borderRadius:'2px 14px 14px 14px', color:C.text, fontSize:13, lineHeight:1.8 }}>
                      <div style={{ color:C.accent, fontSize:10, marginBottom:4 }}>{selected.name}</div>{c.response}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:8 }}>
                <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={t.talkPlaceholder} rows={4} style={{ width:'100%', padding:'14px 16px', background:C.card, border:'1px solid #1A1808', borderRadius:12, color:C.text, fontSize:14, fontFamily:'inherit', lineHeight:1.8, resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
                <HeroBtn onClick={handleTalk} disabled={!question.trim()||talking} grad={GRAD}>{talking?'…':`${selected.name}${lang==='ja'?'に話しかける':' – send'}`}</HeroBtn>
              </div>
            </>
          )}
        </div>
      )}

      {/* 記録タブ */}
      {tab===2&&(
        <div>
          {convos.length===0?<div style={{ textAlign:'center', padding:'48px 0', color:C.muted, fontSize:14, lineHeight:2 }}>💬<br/>{lang==='ja'?'まだ会話がありません':'No conversation yet'}</div>:(
            <>{<div style={{ color:C.muted, fontSize:12, marginBottom:12 }}>{convos.length}{lang==='ja'?'件の会話':'conversations'}</div>}{convos.map(c=><div key={c.id} style={{ background:C.card, border:'1px solid #1A1808', borderRadius:12, padding:16, marginBottom:10 }}><div style={{ color:C.muted, fontSize:11, marginBottom:8 }}>{c.date}</div><div style={{ color:'#4A5880', fontSize:12, marginBottom:6 }}>{lang==='ja'?'あなた：':'You:'} {c.question.slice(0,60)}…</div><div style={{ color:C.accent, fontSize:12, marginBottom:4 }}>{selected?.name}：</div><div style={{ color:C.text, fontSize:13, lineHeight:1.7, borderLeft:`2px solid ${C.accent}`, paddingLeft:12 }}>{c.response}</div></div>)}</>
          )}
        </div>
      )}
    </div>
  );
}
