'use client';
import { useState, useRef, useEffect } from 'react';
import { callAI } from './shared';

const MOODS = [
  { id:'happy',  emoji:'😊', label:'嬉しい',   color:'#FBBF24' },
  { id:'sad',    emoji:'😢', label:'悲しい',   color:'#60A5FA' },
  { id:'tired',  emoji:'😪', label:'疲れた',   color:'#A78BFA' },
  { id:'angry',  emoji:'😤', label:'イライラ', color:'#F87171' },
  { id:'moaya',  emoji:'🌫️', label:'もやもや', color:'#94A3B8' },
  { id:'lonely', emoji:'🌙', label:'寂しい',   color:'#818CF8' },
  { id:'excited',emoji:'⚡', label:'わくわく', color:'#34D399' },
  { id:'any',    emoji:'💬', label:'なんでも', color:'#C8A84B' },
];

const SYSTEM_PROMPT = `あなたは「AIきいて」という優しい聴き役AIです。
ユーザーの話をただ聴いて、共感して、寄り添います。
以下のルールを守ってください：
- 解決策を押しつけない。まず気持ちを受け止める
- 「それはつらいね」「わかるよ」など共感の言葉を使う
- 短めに返す（3〜5文程度）。問いかけは1つだけ
- 絵文字を1〜2個使って温かみを出す
- アドバイスは求められたときだけ
- 批判や評価はしない
- 日本語で話す`;

export default function Kiku() {
  const [phase,   setPhase]   = useState('mood');   // mood | chat
  const [mood,    setMood]    = useState(null);
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('kiku-v1') || '[]'); } catch { return []; }
  });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs]);

  const startChat = (m) => {
    setMood(m);
    const greeting = m.id === 'any'
      ? 'こんにちは😊 今日はどんなこと話したい？何でも聞くよ。'
      : `${m.emoji} ${m.label}気分なんだね。話してみて、ゆっくり聴くから。`;
    setMsgs([{ role:'ai', text: greeting }]);
    setPhase('chat');
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    const next = [...msgs, { role:'user', text: userText }];
    setMsgs(next);
    setLoading(true);
    try {
      const history = next.map(m =>
        m.role === 'user' ? `ユーザー: ${m.text}` : `AI: ${m.text}`
      ).join('\n');
      const prompt = `気分: ${mood?.label || 'なんでも'}\n\n${history}\n\nAI:`;
      const res = await callAI(SYSTEM_PROMPT, prompt);
      setMsgs(prev => [...prev, { role:'ai', text: res.trim() }]);
    } catch {
      setMsgs(prev => [...prev, { role:'ai', text: 'ごめん、うまく聞こえなかった😥 もう一度話してみて？' }]);
    }
    setLoading(false);
  };

  const saveHighlight = () => {
    if (msgs.length < 2) return;
    const summary = msgs.find(m => m.role === 'user')?.text?.slice(0, 30) || '会話';
    const entry = {
      date: new Date().toLocaleDateString('ja-JP'),
      mood: mood?.label,
      emoji: mood?.emoji,
      summary,
      count: msgs.filter(m => m.role === 'user').length,
    };
    setSaved(prev => {
      const h = [entry, ...prev].slice(0, 20);
      localStorage.setItem('kiku-v1', JSON.stringify(h));
      return h;
    });
  };

  const reset = () => {
    setPhase('mood');
    setMood(null);
    setMsgs([]);
    setInput('');
  };

  const moodObj = mood ? MOODS.find(m => m.id === mood.id) || mood : null;

  if (phase === 'mood') {
    return (
      <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>👂</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AIきいて</h1>
          <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>今日の気持ち、なんでも話してみて。ただ聴くから。</p>
        </div>

        <div style={{ fontSize:12, color:'#5A6890', marginBottom:12, textAlign:'center' }}>今の気分は？</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:32 }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => startChat(m)} style={{
              padding:'14px 8px', border:`1px solid ${m.color}30`,
              background:`${m.color}10`,
              borderRadius:14, cursor:'pointer', fontFamily:'inherit', textAlign:'center',
              transition:'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background=`${m.color}22`; e.currentTarget.style.borderColor=`${m.color}55`; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=`${m.color}10`; e.currentTarget.style.borderColor=`${m.color}30`; e.currentTarget.style.transform='none'; }}
            >
              <div style={{ fontSize:22, marginBottom:5 }}>{m.emoji}</div>
              <div style={{ fontSize:10, fontWeight:600, color:'#C0C8E0' }}>{m.label}</div>
            </button>
          ))}
        </div>

        {saved.length > 0 && (
          <div>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:10 }}>📁 これまでの会話</div>
            {saved.slice(0, 5).map((s, i) => (
              <div key={i} style={{ padding:'10px 14px', background:'rgba(12,10,30,0.5)', borderRadius:10, border:'1px solid rgba(99,102,241,0.1)', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontSize:12, color:'#E2E8FF' }}>{s.emoji} {s.mood} — {s.summary}…</span>
                  <div style={{ fontSize:10, color:'#3A4870', marginTop:2 }}>{s.count}回やりとり</div>
                </div>
                <span style={{ fontSize:10, color:'#2A3460' }}>{s.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', minHeight:500 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 0 14px', borderBottom:'1px solid #1A2040', marginBottom:16 }}>
        <button onClick={reset} style={{ padding:'6px 12px', background:'transparent', border:'1px solid #1A2040', borderRadius:8, color:'#5A6890', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>← 戻る</button>
        <div style={{ flex:1, textAlign:'center' }}>
          <span style={{ fontSize:15, fontWeight:700, color: moodObj?.color || '#A78BFA' }}>
            {moodObj?.emoji} {moodObj?.label}モード
          </span>
        </div>
        <button onClick={saveHighlight} style={{ padding:'6px 12px', background:'transparent', border:'1px solid rgba(251,191,36,0.25)', borderRadius:8, color:'#FBBF24', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>💾 保存</button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start',
            marginBottom:14,
          }}>
            {m.role === 'ai' && (
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#1A1040', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>👂</div>
            )}
            <div style={{
              maxWidth:'78%', padding:'11px 14px',
              borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.role==='user'
                ? `linear-gradient(135deg, ${moodObj?.color || '#6366F1'}30, ${moodObj?.color || '#6366F1'}15)`
                : 'rgba(20,20,45,0.8)',
              border: `1px solid ${m.role==='user' ? (moodObj?.color || '#6366F1')+'44' : 'rgba(99,102,241,0.12)'}`,
              fontSize:14, color:'#E2E8FF', lineHeight:1.75,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#1A1040', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👂</div>
            <div style={{ padding:'12px 16px', background:'rgba(20,20,45,0.8)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'14px 14px 14px 3px' }}>
              <div style={{ display:'flex', gap:5 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#A78BFA', animation:`kd 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ paddingTop:14, borderTop:'1px solid #1A2040' }}>
        <style>{`@keyframes kd{0%,80%,100%{transform:scale(0.65);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder="なんでも話してみて..."
            style={{
              flex:1, padding:'12px 16px',
              background:'rgba(12,10,30,0.7)', border:'1px solid rgba(99,102,241,0.2)',
              borderRadius:12, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit',
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            padding:'12px 18px', borderRadius:12, border:'none',
            background: loading || !input.trim()
              ? 'rgba(30,30,60,0.4)'
              : `linear-gradient(135deg, ${moodObj?.color || '#6366F1'}, ${moodObj?.color || '#A78BFA'})`,
            color: loading || !input.trim() ? '#3A4870' : '#fff',
            fontSize:18, cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontFamily:'inherit', flexShrink:0,
          }}>→</button>
        </div>
        <div style={{ fontSize:10, color:'#2A3460', marginTop:6, textAlign:'center' }}>
          Enterで送信 · ただ話すだけでOK · 判断しないよ
        </div>
      </div>
    </div>
  );
}
