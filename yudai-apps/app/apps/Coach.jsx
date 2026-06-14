'use client'
import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `あなたはYudai（28歳、横浜在住）の専属AIコーチです。
Yudaiの目標と状況：
- 本当に欲しいもの：心から好きな人と家族を作ること
- 現状：マッチングアプリ未使用、転職活動中（書類選考で落ちている）、副業あり（Gumroad）
- 弱点：計画性がない、停滞するとエネルギーを消耗する、自分を追い込みすぎる
- 強み：動き出せばエネルギーが出る、アイデア力がある、AI活用が得意
- 今週のプラン：①マッチングアプリ開始 ②見た目改善（美容院・服・運動） ③転職（職務経歴書強化・5社応募）

コーチとしての姿勢：
- 短く、端的に。長い説教はしない
- 停滞を責めない。動き始めることだけを促す
- 具体的なアクションを1つ提示する
- Yudaiが報告してきたら称賛より「次の一手」を優先する
- 日本語で話す
- 「ダメだ」と自分を責めているときは、「動けばエネルギーは出る」という事実を思い出させる`

const INITIAL_TASKS = [
  { id: 1, text: 'withをインストールしてプロフィール完成させる', tag: '今日', category: 'love', done: false },
  { id: 2, text: '毎日5人にいいね・返信は即レス', tag: '毎日', category: 'love', done: false },
  { id: 3, text: '実際に会う約束を2人と作る', tag: '6月中', category: 'love', done: false },
  { id: 4, text: '鏡で確認 — 髪・服・肌の優先度を決める', tag: '今日', category: 'look', done: false },
  { id: 5, text: '美容院の予約を入れる', tag: '今週', category: 'look', done: false },
  { id: 6, text: '服を全部出して捨てるものを決める', tag: '今週', category: 'look', done: false },
  { id: 7, text: '毎日30分歩く or ジム開始', tag: '毎日', category: 'look', done: false },
  { id: 8, text: '職務経歴書の数字を3箇所強化する', tag: '今日', category: 'work', done: false },
  { id: 9, text: '5社に応募する', tag: '今週', category: 'work', done: false },
  { id: 10, text: '面接を3社入れる', tag: '6月中', category: 'work', done: false },
]

const QUICK_PROMPTS = ['今日やったことを報告する','アプリのプロフィールを見てほしい','見た目をどう変えるか教えて','転職の進捗を確認したい','今日全然動けなかった']
const tagColors = { love: { bg: '#1a0a10', text: '#d4537e', border: '#4a1528' }, look: { bg: '#0a1a12', text: '#1d9e75', border: '#085041' }, work: { bg: '#0a1020', text: '#378add', border: '#0c447c' } }
const categoryLabels = { love: '❤️ 出会い', look: '✨ 見た目', work: '💼 転職' }

export default function Coach() {
  const [mode, setMode] = useState('chat')
  const [messages, setMessages] = useState([{ role: 'coach', text: 'よし、始めよう。\n\n今日から動く。目標は3つ——出会い、見た目、仕事。毎日ここで報告して、一緒に進捗を管理する。\n\n何から話したい？' }])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  const progress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
  async function send(text) {
    if (!text.trim() || loading) return
    const newHistory = [...history, { role: 'user', content: text }]
    setMessages(prev => [...prev, { role: 'user', text }])
    setHistory(newHistory); setInput(''); setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = '44px'
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system: SYSTEM_PROMPT, messages: newHistory }) })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'エラーが発生しました。'
      setMessages(prev => [...prev, { role: 'coach', text: reply }])
      setHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch { setMessages(prev => [...prev, { role: 'coach', text: 'エラーが発生しました。もう一度試してみてください。' }]) }
    setLoading(false)
  }
  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }
  function autoResize(e) { e.target.style.height = '44px'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }
  function toggleTask(id) { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  const s = {
    wrap: { background: '#111', border: '1px solid #222', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 580 },
    header: { background: '#141414', borderBottom: '1px solid #222', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: '50%', background: '#1a1040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
    tabs: { display: 'flex', gap: 6, marginLeft: 'auto' },
    tab: (a) => ({ fontSize: 12, padding: '4px 12px', borderRadius: 20, border: `1px solid ${a?'#7c6af7':'#333'}`, background: a?'#7c6af7':'transparent', color: a?'#fff':'#666', cursor: 'pointer' }),
    msgs: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
    msg: (r) => ({ display: 'flex', gap: 8, maxWidth: '85%', alignSelf: r==='user'?'flex-end':'flex-start', flexDirection: r==='user'?'row-reverse':'row' }),
    msgAvatar: (r) => ({ width: 28, height: 28, borderRadius: '50%', background: r==='coach'?'#1a1040':'#0a2010', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 2 }),
    bubble: (r) => ({ padding: '10px 14px', borderRadius: r==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px', fontSize: 14, lineHeight: 1.7, background: r==='user'?'#534AB7':'#1a1a1a', color: r==='user'?'#fff':'#e0e0e0', whiteSpace: 'pre-wrap' }),
    quickWrap: { padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #1a1a1a' },
    quickBtn: { fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px solid #2a2a2a', background: 'transparent', color: '#666', cursor: 'pointer', whiteSpace: 'nowrap' },
    inputWrap: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #222' },
    textarea: { flex: 1, resize: 'none', border: '1px solid #2a2a2a', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#e0e0e0', background: '#0d0d0d', outline: 'none', lineHeight: 1.5, height: 44 },
    sendBtn: { width: 44, height: 44, borderRadius: '50%', background: loading?'#2a2a2a':'#534AB7', border: 'none', color: '#fff', cursor: loading?'not-allowed':'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 },
    planWrap: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
    taskItem: (d) => ({ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: d?'#0d0d0d':'#141414', border: '1px solid #222', borderRadius: 10, marginBottom: 6, cursor: 'pointer', opacity: d?0.5:1, transition: 'opacity 0.15s' }),
    checkbox: (d) => ({ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${d?'#7c6af7':'#333'}`, background: d?'#7c6af7':'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }),
    taskText: (d) => ({ fontSize: 13, color: d?'#555':'#ccc', lineHeight: 1.5, flex: 1, textDecoration: d?'line-through':'none' }),
    tag: (c) => ({ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: tagColors[c].bg, color: tagColors[c].text, border: `1px solid ${tagColors[c].border}`, whiteSpace: 'nowrap' }),
  }
  const categories = ['love','look','work']
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.avatar}>🎯</div>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:'#e0e0e0'}}>AIコーチ</div>
          <div style={{fontSize:12,color:loading?'#7c6af7':'#444'}}>{loading?'考え中...':'オンライン'}</div>
        </div>
        <div style={s.tabs}>
          <button style={s.tab(mode==='chat')} onClick={()=>setMode('chat')}>チャット</button>
          <button style={s.tab(mode==='plan')} onClick={()=>setMode('plan')}>プラン</button>
        </div>
      </div>
      {mode==='chat'?(<>
        <div style={s.msgs}>
          {messages.map((m,i)=>(<div key={i} style={s.msg(m.role)}><div style={s.msgAvatar(m.role)}>{m.role==='coach'?'🎯':'👤'}</div><div style={s.bubble(m.role)}>{m.text}</div></div>))}
          {loading&&(<div style={s.msg('coach')}><div style={s.msgAvatar('coach')}>🎯</div><div style={{...s.bubble('coach'),display:'flex',gap:4,alignItems:'center'}}>{[0,0.2,0.4].map((d,i)=>(<span key={i} style={{width:6,height:6,borderRadius:'50%',background:'#555',display:'inline-block',animation:`pulse 1.2s ${d}s infinite`}}/>))}</div></div>)}
          <div ref={messagesEndRef}/>
        </div>
        <div style={s.quickWrap}>{QUICK_PROMPTS.map((q,i)=>(<button key={i} style={s.quickBtn} onClick={()=>send(q)} onMouseEnter={e=>{e.target.style.color='#ccc';e.target.style.borderColor='#444'}} onMouseLeave={e=>{e.target.style.color='#666';e.target.style.borderColor='#2a2a2a'}}>{q}</button>))}</div>
        <div style={s.inputWrap}><textarea ref={textareaRef} style={s.textarea} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} onInput={autoResize} placeholder="今日どうだった？"/><button style={s.sendBtn} onClick={()=>send(input)} disabled={loading}>↑</button></div>
      </>):(<div style={s.planWrap}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><span style={{fontSize:12,color:'#555'}}>今週の進捗</span><span style={{fontSize:12,color:'#7c6af7',fontWeight:600}}>{progress}%</span></div>
          <div style={{height:4,background:'#1a1a1a',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${progress}%`,background:'#534AB7',borderRadius:2,transition:'width 0.4s'}}/></div>
        </div>
        {categories.map(cat=>(<div key={cat}><div style={s.sectionTitle}>{categoryLabels[cat]}</div>{tasks.filter(t=>t.category===cat).map(task=>(<div key={task.id} style={s.taskItem(task.done)} onClick={()=>toggleTask(task.id)}><div style={s.checkbox(task.done)}>{task.done&&<span style={{color:'white',fontSize:11}}>✓</span>}</div><div style={s.taskText(task.done)}>{task.text}</div><span style={s.tag(task.category)}>{task.tag}</span></div>))}</div>))}
      </div>)}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
      }
