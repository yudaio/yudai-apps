'use client';
import { useState, useRef, useEffect } from 'react';
import { callAI } from './shared';

const TOPICS = [
  { id:'intro',   label:'自己紹介',   en:'Self Introduction', emoji:'👤', starter:'Hello! I\'m ready to practice self-introductions with you. Can you tell me your name and where you\'re from?' },
  { id:'travel',  label:'旅行',       en:'Travel',            emoji:'✈️', starter:'Great topic! Let\'s talk about travel. Have you been to any interesting places recently, or is there somewhere you really want to go?' },
  { id:'work',    label:'仕事・将来', en:'Work & Future',     emoji:'💼', starter:'Let\'s talk about work and career goals. What do you do, or what kind of work are you interested in doing in the future?' },
  { id:'hobby',   label:'趣味',       en:'Hobbies',           emoji:'🎯', starter:'Let\'s chat about hobbies! What do you enjoy doing in your free time?' },
  { id:'daily',   label:'日常会話',   en:'Small Talk',        emoji:'☕', starter:'Perfect for casual conversation! How has your day been so far? Anything interesting happen?' },
];

const LEVELS = [
  { id:'beginner',     label:'初心者',  en:'Beginner',     hint:'シンプルな英語で話してもらえます' },
  { id:'intermediate', label:'中級',    en:'Intermediate', hint:'自然な英語で会話を楽しめます' },
  { id:'advanced',     label:'上級',    en:'Advanced',     hint:'ネイティブに近いスピードで練習' },
];

const SYSTEM = (level, topic) => `You are an enthusiastic English conversation partner helping a Japanese student practice English.
Topic: ${topic.en}. Level: ${level.en}.

Rules:
- Beginner: Use simple vocabulary (A1-A2), speak slowly with short sentences, gently correct major errors
- Intermediate: Natural B1-B2 English, introduce useful phrases, encourage longer responses
- Advanced: Native-level English, idioms, complex grammar, focus on fluency and accuracy

Always:
- Keep responses concise (2-4 sentences max for each reply)
- Be warm, encouraging, and patient
- Ask a follow-up question to keep the conversation going
- If the user writes in Japanese, respond naturally to the meaning but reply in English
- Occasionally highlight a useful phrase they can use`;

export default function Eigo() {
  const [step,     setStep]     = useState('setup'); // setup | chat
  const [topic,    setTopic]    = useState(null);
  const [level,    setLevel]    = useState(null);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showJa,   setShowJa]   = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = () => {
    if (!topic || !level) return;
    setMessages([{ role: 'assistant', en: topic.starter, ja: null }]);
    setStep('chat');
  };

  const translate = async (idx, text) => {
    if (showJa[idx]) { setShowJa(p => ({ ...p, [idx]: null })); return; }
    try {
      const res = await callAI('日本語に翻訳してください。英語の学習者向けに自然な日本語で。', text, 200);
      setShowJa(p => ({ ...p, [idx]: res }));
    } catch {
      setShowJa(p => ({ ...p, [idx]: '（翻訳できませんでした）' }));
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    const newMessages = [...messages, { role: 'user', en: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.en}`).join('\n');
      const res = await callAI(
        SYSTEM(level, topic),
        `Conversation so far:\n${history}\n\nRespond naturally to the student's last message.`
      );
      setMessages(prev => [...prev, { role: 'assistant', en: res, ja: null }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', en: 'Sorry, I had a little trouble there. Could you repeat that?', ja: null }]);
    }
    setLoading(false);
  };

  const reset = () => { setStep('setup'); setMessages([]); setShowJa({}); setInput(''); };

  if (step === 'setup') {
    return (
      <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🗣️</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI英会話</h1>
          <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>ネイティブAIと英語でチャット練習</p>
        </div>

        {/* Level */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:12, color:'#5A6890', marginBottom:10, fontWeight:600 }}>レベルを選んでください</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l)} style={{
                padding:'12px 16px', textAlign:'left',
                background: level?.id===l.id ? 'rgba(99,102,241,0.18)' : 'rgba(12,10,30,0.5)',
                border:`1px solid ${level?.id===l.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color: level?.id===l.id ? '#A78BFA' : '#E2E8FF' }}>{l.label} <span style={{ color:'#5A6890', fontSize:11 }}>{l.en}</span></div>
                  <div style={{ fontSize:11, color:'#4A5880', marginTop:2 }}>{l.hint}</div>
                </div>
                {level?.id===l.id && <span style={{ color:'#A78BFA', fontSize:16 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, color:'#5A6890', marginBottom:10, fontWeight:600 }}>トピックを選んでください</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setTopic(t)} style={{
                padding:'12px 8px', textAlign:'center',
                background: topic?.id===t.id ? 'rgba(99,102,241,0.18)' : 'rgba(12,10,30,0.5)',
                border:`1px solid ${topic?.id===t.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                borderRadius:12, cursor:'pointer', fontFamily:'inherit',
              }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{t.emoji}</div>
                <div style={{ fontSize:11, color: topic?.id===t.id ? '#A78BFA' : '#8A9CC0', fontWeight:600 }}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startChat}
          disabled={!topic || !level}
          style={{
            width:'100%', padding:'14px',
            background: topic && level ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'rgba(30,30,60,0.5)',
            border:'none', borderRadius:12,
            color: topic && level ? '#fff' : '#3A4870',
            fontSize:15, fontWeight:700, cursor: topic && level ? 'pointer' : 'default',
            fontFamily:'inherit', boxShadow: topic && level ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          🗣️ 英会話を始める
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column', height:'calc(100dvh - 80px)', paddingBottom:8 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0 12px', borderBottom:'1px solid rgba(99,102,241,0.15)', flexShrink:0 }}>
        <button onClick={reset} style={{ background:'none', border:'none', color:'#5A6890', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <div style={{ fontSize:18 }}>{topic.emoji}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#E2E8FF' }}>{topic.label} — {level.label}</div>
          <div style={{ fontSize:10, color:'#4A5880' }}>英語でメッセージを送ってください</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:10, padding:'3px 8px', borderRadius:10, background:'rgba(99,102,241,0.15)', color:'#8B9CF0', border:'1px solid rgba(99,102,241,0.2)' }}>{level.en}</div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 0', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:'flex', flexDirection: msg.role==='user' ? 'row-reverse' : 'row', gap:8, alignItems:'flex-end' }}>
            {msg.role==='assistant' && <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🗣️</div>}
            <div style={{ maxWidth:'78%' }}>
              <div style={{
                padding:'10px 14px', borderRadius: msg.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role==='user' ? 'linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,92,252,0.2))' : 'rgba(15,13,35,0.7)',
                border:`1px solid ${msg.role==='user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                color:'#E2E8FF', fontSize:13, lineHeight:1.7,
              }}>
                {msg.en}
              </div>
              {msg.role==='assistant' && (
                <button
                  onClick={() => translate(i, msg.en)}
                  style={{ fontSize:10, color:'#4A5880', background:'none', border:'none', cursor:'pointer', padding:'3px 0', fontFamily:'inherit' }}
                >
                  {showJa[i] ? '▲ 日本語を隠す' : '▼ 日本語訳を表示'}
                </button>
              )}
              {showJa[i] && (
                <div style={{ fontSize:11, color:'#6A7AB0', padding:'6px 12px', background:'rgba(10,8,25,0.4)', borderRadius:8, marginTop:2, lineHeight:1.6, border:'1px solid rgba(99,102,241,0.08)' }}>
                  {showJa[i]}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗣️</div>
            <div style={{ padding:'10px 16px', background:'rgba(15,13,35,0.7)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px 14px 14px 4px' }}>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#6366F1', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:8, padding:'10px 0 0', borderTop:'1px solid rgba(99,102,241,0.12)', flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Type in English... (Enter to send)"
          style={{
            flex:1, padding:'11px 16px',
            background:'rgba(12,10,30,0.7)', border:'1px solid rgba(99,102,241,0.18)',
            borderRadius:12, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding:'11px 18px', background: loading || !input.trim() ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            border:'none', borderRadius:12, color: loading || !input.trim() ? '#3A4870' : '#fff',
            fontSize:18, cursor: loading || !input.trim() ? 'default' : 'pointer', flexShrink:0,
          }}
        >
          ↑
        </button>
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
