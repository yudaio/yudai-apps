'use client'
import { useState, useEffect, useCallback } from 'react'

// ── 13軸定義 ──────────────────────────────────────────────────
const AXES = [
  { k:'appearance', s:'外見・肌',  l:'外見・肌',         idol:8, color:'#FF6340' },
  { k:'physique',   s:'体型',      l:'体型・筋力',       idol:7, color:'#FBBF24' },
  { k:'english',    s:'英語',      l:'英語力',           idol:5, color:'#34D399' },
  { k:'skills',     s:'専門',      l:'専門スキル',       idol:7, color:'#60A5FA' },
  { k:'income',     s:'経済力',    l:'経済力',           idol:9, color:'#00D97E' },
  { k:'action',     s:'行動力',    l:'行動力',           idol:8, color:'#F472B6' },
  { k:'creativity', s:'創造力',    l:'創造力',           idol:7, color:'#A78BFA' },
  { k:'presence',   s:'発信力',    l:'表現・発信力',     idol:7, color:'#FB923C' },
  { k:'attraction', s:'異性',      l:'異性への魅力',     idol:9, color:'#F87171' },
  { k:'health',     s:'健康',      l:'健康習慣',         idol:7, color:'#4ADE80' },
  { k:'intellect',  s:'知性',      l:'知性・思考力',     idol:7, color:'#818CF8' },
  { k:'social',     s:'社会性',    l:'社会性・人脈',     idol:8, color:'#38BDF8' },
  { k:'mental',     s:'精神力',    l:'精神力・自己制御', idol:8, color:'#C084FC' },
]

const DEF = { appearance:3, physique:2, english:7, skills:4, income:3, action:5, creativity:4, presence:2, attraction:3, health:3, intellect:6, social:4, mental:4 }
const SK = 'gt-v4'

function clamp(v) { return Math.round(Math.min(10, Math.max(1, v)) * 10) / 10 }
function calcAvg(s) { return (AXES.reduce((x, a) => x + (s[a.k] || 5), 0) / AXES.length).toFixed(1) }
function idolAvg() { return (AXES.reduce((x, a) => x + a.idol, 0) / AXES.length).toFixed(1) }
function calcPct(cur) { return Math.min(100, Math.round(parseFloat(calcAvg(cur)) / parseFloat(idolAvg()) * 100)) }
function fmtDate(ts) { const d = new Date(ts); return `${d.getMonth()+1}/${d.getDate()}` }

function loadState() {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) {
      const d = JSON.parse(raw)
      return { scores:{...DEF,...(d.scores||{})}, history:d.history||[], journal:d.journal||[], showIdol:d.showIdol!==false, portrait:d.portrait||null, portraitTs:d.portraitTs||null }
    }
  } catch {}
  return { scores:{...DEF}, history:[], journal:[], showIdol:true, portrait:null, portraitTs:null }
}
function saveState(st) { try { localStorage.setItem(SK, JSON.stringify(st)) } catch {} }

// ── SVG レーダーチャート ───────────────────────────────────────
function RadarChart({ scores, showIdol }) {
  const SIZE = 280, C = SIZE/2, R = SIZE * 0.34, N = AXES.length
  const angle = i => (i / N) * 2 * Math.PI - Math.PI / 2
  const pt = (i, v) => ({ x: C + (v/10)*R*Math.cos(angle(i)), y: C + (v/10)*R*Math.sin(angle(i)) })
  const poly = vals => vals.map((v, i) => { const p = pt(i, v); return `${p.x},${p.y}` }).join(' ')
  const axisEnd = i => ({ x: C + R*Math.cos(angle(i)), y: C + R*Math.sin(angle(i)) })
  const labelPos = i => ({ x: C + (R+20)*Math.cos(angle(i)), y: C + (R+20)*Math.sin(angle(i)) })
  const curVals = AXES.map(a => scores[a.k] || 5)
  const idolVals = AXES.map(a => a.idol)
  return (
    <svg width={SIZE} height={SIZE} style={{ display:'block', margin:'0 auto' }}>
      {[2,4,6,8,10].map(lv => {
        const pts = AXES.map((_, i) => pt(i, lv))
        const d = pts.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return <path key={lv} d={d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      })}
      {AXES.map((_, i) => { const e = axisEnd(i); return <line key={i} x1={C} y1={C} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/> })}
      {showIdol && <polygon points={poly(idolVals)} fill="rgba(255,99,64,0.05)" stroke="#FF6340" strokeWidth="1.5" strokeDasharray="5,3"/>}
      <polygon points={poly(curVals)} fill="rgba(0,217,126,0.1)" stroke="#00D97E" strokeWidth="2"/>
      {AXES.map((a, i) => { const p = pt(i, scores[a.k]||5); return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00D97E"/> })}
      {AXES.map((a, i) => { const l = labelPos(i); return <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#71717A">{a.s}</text> })}
    </svg>
  )
}

// ── メインコンポーネント ───────────────────────────────────────
export default function GrowthTracker() {
  const [tab, setTab]               = useState('home')
  const [st, setSt]                 = useState(null)
  const [taskInput, setTaskInput]   = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState(null)
  const [analyzing, setAnalyzing]   = useState(false)
  const [journalInput, setJournalInput] = useState('')
  const [journalTag, setJournalTag]     = useState('insight')

  useEffect(() => { setSt(loadState()) }, [])

  const update = useCallback((fn) => {
    setSt(prev => {
      const next = fn({ ...prev, scores:{...prev.scores}, history:[...prev.history], journal:[...prev.journal] })
      saveState(next)
      return next
    })
  }, [])

  const evalTasks = async () => {
    if (evaluating || !taskInput.trim() || !st) return
    setEvaluating(true); setEvalResult(null)
    try {
      const res = await fetch('/api/growth-analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tasks:taskInput, scores:st.scores })
      })
      const data = await res.json()
      const ch = data.changes || {}
      update(s => {
        const ns = { ...s.scores }
        Object.entries(ch).forEach(([k, v]) => { if (ns[k] !== undefined) ns[k] = clamp((ns[k]||5)+v) })
        const today = fmtDate(Date.now())
        return { ...s, scores:ns, history:[...s.history, { ts:Date.now(), date:today, tasks:taskInput, changes:ch, comment:data.comment||'', highlight:data.highlight||'' }] }
      })
      setEvalResult(data)
      setTaskInput('')
    } catch {
      setEvalResult({ error:'エラーが発生しました。もう一度試してください。' })
    }
    setEvaluating(false)
  }

  const getPortrait = async () => {
    if (analyzing || !st) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/growth-portrait', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ scores:st.scores })
      })
      const data = await res.json()
      update(s => ({ ...s, portrait:data, portraitTs:Date.now() }))
    } catch {}
    setAnalyzing(false)
  }

  const addJournal = () => {
    if (!journalInput.trim()) return
    update(s => ({ ...s, journal:[...s.journal, { ts:Date.now(), date:fmtDate(Date.now()), text:journalInput.trim(), tag:journalTag }] }))
    setJournalInput('')
  }

  const delJournal = ts => update(s => ({ ...s, journal:s.journal.filter(j => j.ts !== ts) }))

  if (!st) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div style={{ color:'#52525B', fontSize:13 }}>読み込み中...</div>
    </div>
  )

  const ct = calcAvg(st.scores)
  const p  = calcPct(st.scores)

  // デザイントークン
  const V = {
    bg:'#09090B', surface:'#111113', surface2:'#18181B',
    border:'#27272A', border2:'#3F3F46',
    text:'#F4F4F5', text2:'#A1A1AA', text3:'#52525B',
    primary:'#00D97E', secondary:'#FF6340', purple:'#A78BFA', amber:'#FBBF24'
  }
  const glass = { background:V.surface, border:`1px solid ${V.border}`, borderRadius:16 }

  const TABS_DEF = [
    { id:'home',     label:'ホーム', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
    { id:'analysis', label:'分析',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { id:'journal',  label:'日記',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  ]

  const pillStyle = (v) => ({
    fontSize:11, padding:'3px 8px', borderRadius:20, fontWeight:500,
    background: v>0 ? 'rgba(0,217,126,0.15)' : 'rgba(255,99,64,0.15)',
    color: v>0 ? V.primary : V.secondary,
  })

  return (
    <div style={{ background:V.bg, borderRadius:16, overflow:'hidden', minHeight:600, fontFamily:"-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif", color:V.text, position:'relative', paddingBottom:68 }}>

      {/* ─ ヘッダー ─ */}
      <div style={{ padding:'16px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:V.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:2 }}>Growth Tracker</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em', color:V.primary, textShadow:'0 0 20px rgba(0,217,126,0.4)' }}>{ct}</span>
            <span style={{ fontSize:13, color:V.text3 }}>/10</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:V.text3, marginBottom:4 }}>アイドル達成率</div>
          <div style={{ fontSize:22, fontWeight:700, color:p>=70?V.primary:p>=50?V.amber:V.secondary }}>{p}%</div>
          <div style={{ fontSize:11, color:V.text3, marginTop:2 }}>{st.history.length}日記録</div>
        </div>
      </div>

      {/* ─ タブコンテンツ ─ */}
      <div style={{ padding:'12px 16px 0' }}>

        {/* ── HOME ── */}
        {tab === 'home' && (
          <div>
            {/* レーダーチャート */}
            <div style={{ ...glass, padding:'16px 8px 8px', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 8px 8px' }}>
                <span style={{ fontSize:12, color:V.text3 }}>成長レーダー</span>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.text3, cursor:'pointer' }}>
                  <input type="checkbox" checked={st.showIdol} onChange={e => update(s => ({...s, showIdol:e.target.checked}))} style={{ accentColor:V.primary }}/>
                  アイドル比較
                </label>
              </div>
              <div style={{ height:280 }}>
                <RadarChart scores={st.scores} showIdol={st.showIdol}/>
              </div>
            </div>

            {/* 軸別スコアバー */}
            <div style={{ ...glass, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:12, color:V.text3, marginBottom:10 }}>軸別スコア</div>
              {AXES.map(a => {
                const sc = st.scores[a.k] || 5
                return (
                  <div key={a.k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:11, color:V.text2, minWidth:72 }}>{a.l}</span>
                    <div style={{ position:'relative', flex:1 }}>
                      <div style={{ height:5, background:V.border, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${sc/10*100}%`, background:a.color, borderRadius:4, transition:'width 0.5s ease' }}/>
                      </div>
                      {st.showIdol && (
                        <div style={{ position:'absolute', top:-2, left:`${a.idol/10*100}%`, height:9, width:2, background:'rgba(255,99,64,0.6)', borderRadius:1, transform:'translateX(-50%)' }}/>
                      )}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, minWidth:28, textAlign:'right', color:sc>=a.idol?V.primary:V.text2 }}>{sc.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>

            {/* 今日の記録 */}
            <div style={{ ...glass, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:12, color:V.text3, marginBottom:10 }}>今日の記録 → AIがスコアを更新</div>
              <textarea
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                placeholder="例：筋トレした、Xに投稿した、YouTube撮影した、面接を受けた..."
                style={{ width:'100%', minHeight:80, padding:'10px 12px', resize:'vertical', background:V.surface2, color:V.text, border:`1px solid ${V.border2}`, borderRadius:10, fontFamily:'inherit', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
              <button
                onClick={evalTasks}
                disabled={evaluating || !taskInput.trim()}
                style={{ width:'100%', marginTop:8, padding:'12px', borderRadius:10, background:evaluating||!taskInput.trim()?V.surface2:V.primary, color:evaluating||!taskInput.trim()?V.text3:'#000', fontWeight:600, fontSize:14, border:'none', cursor:evaluating||!taskInput.trim()?'not-allowed':'pointer', transition:'all 0.15s' }}
              >
                {evaluating ? '評価中...' : 'AIに評価してもらう →'}
              </button>

              {evalResult && (
                <div style={{ marginTop:10, padding:'12px', borderRadius:10, background:evalResult.error?'rgba(255,99,64,0.1)':'rgba(0,217,126,0.08)', border:`1px solid ${evalResult.error?'rgba(255,99,64,0.3)':'rgba(0,217,126,0.2)'}` }}>
                  {evalResult.error ? (
                    <p style={{ fontSize:13, color:V.secondary }}>{evalResult.error}</p>
                  ) : (
                    <>
                      <p style={{ fontSize:13, fontWeight:600, color:V.primary, marginBottom:4 }}>{evalResult.highlight}</p>
                      <p style={{ fontSize:12, color:V.text2, marginBottom:8 }}>{evalResult.comment}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {Object.entries(evalResult.changes||{}).filter(([,v])=>v!==0).map(([k,v]) => {
                          const ax = AXES.find(a=>a.k===k)
                          return <span key={k} style={pillStyle(v)}>{ax?.s} {v>0?'+':''}{v.toFixed(1)}</span>
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 最近の記録 */}
            {st.history.length > 0 && (
              <div style={{ ...glass, padding:'14px 16px', marginBottom:12 }}>
                <div style={{ fontSize:12, color:V.text3, marginBottom:10 }}>最近の記録</div>
                {[...st.history].reverse().slice(0, 5).map((h, i) => (
                  <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:i<4?`1px solid ${V.border}`:'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:500 }}>{h.date}</span>
                      <span style={{ fontSize:11, color:V.text3, maxWidth:180, textAlign:'right', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{h.highlight}</span>
                    </div>
                    <div style={{ fontSize:11, color:V.text3, marginBottom:5 }}>{h.comment}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                      {Object.entries(h.changes||{}).filter(([,v])=>v!==0).map(([k,v]) => {
                        const ax = AXES.find(a=>a.k===k)
                        return <span key={k} style={{ ...pillStyle(v), fontSize:10 }}>{ax?.s} {v>0?'+':''}{v.toFixed(1)}</span>
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS ── */}
        {tab === 'analysis' && (
          <div>
            <button
              onClick={getPortrait}
              disabled={analyzing}
              style={{ width:'100%', padding:'14px', borderRadius:12, marginBottom:16, background:analyzing?V.surface2:'rgba(255,99,64,0.1)', border:`1px solid ${analyzing?V.border:'rgba(255,99,64,0.4)'}`, color:analyzing?V.text3:V.secondary, fontWeight:600, fontSize:14, cursor:analyzing?'not-allowed':'pointer', transition:'all 0.15s' }}
            >
              {analyzing ? '分析中...' : 'AIが現在の自分を分析する →'}
            </button>

            {st.portraitTs && (
              <div style={{ fontSize:11, color:V.text3, textAlign:'center', marginBottom:12 }}>
                最終分析: {fmtDate(st.portraitTs)}
              </div>
            )}

            {st.portrait && !st.portrait.error && (
              <>
                <div style={{ background:'linear-gradient(135deg,#0D1117 0%,#0D0D12 100%)', border:`1px solid ${V.border}`, borderRadius:16, padding:'20px 18px', marginBottom:12, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${V.secondary},transparent)` }}/>
                  <div style={{ fontSize:10, color:V.text3, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>今の自分</div>
                  <div style={{ fontSize:22, fontWeight:700, color:V.secondary, marginBottom:12, lineHeight:1.3 }}>「{st.portrait.creature}」</div>
                  <p style={{ fontSize:13, color:V.text2, lineHeight:1.8 }}>{st.portrait.current}</p>
                </div>

                <div style={{ ...glass, padding:'16px 18px', marginBottom:12 }}>
                  <div style={{ fontSize:10, color:V.text3, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>最も近い歴史上の人物</div>
                  <div style={{ fontSize:18, fontWeight:700, color:V.purple, marginBottom:8 }}>{st.portrait.historical_figure}</div>
                  <p style={{ fontSize:13, color:V.text2, lineHeight:1.8 }}>{st.portrait.historical_reason}</p>
                </div>

                <div style={{ ...glass, padding:'16px 18px', marginBottom:12 }}>
                  <div style={{ fontSize:10, color:V.text3, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>内側にある可能性</div>
                  <p style={{ fontSize:13, color:V.text2, lineHeight:1.8 }}>{st.portrait.potential}</p>
                </div>

                <div style={{ ...glass, padding:'16px 18px', marginBottom:12, borderColor:'rgba(255,99,64,0.2)' }}>
                  <div style={{ fontSize:10, color:V.secondary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>越えるべきギャップ</div>
                  <p style={{ fontSize:13, color:V.text2, lineHeight:1.8 }}>{st.portrait.gap}</p>
                </div>

                <div style={{ ...glass, padding:'16px 18px', marginBottom:12, borderColor:'rgba(0,217,126,0.2)' }}>
                  <div style={{ fontSize:10, color:V.primary, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>今すぐ動くなら</div>
                  <p style={{ fontSize:14, fontWeight:500, color:V.text, lineHeight:1.8 }}>{st.portrait.action_metaphor}</p>
                </div>

                <div style={{ padding:'20px 18px', marginBottom:12, borderLeft:`3px solid ${V.primary}`, background:'rgba(0,217,126,0.04)' }}>
                  <p style={{ fontSize:16, fontStyle:'italic', color:V.text, lineHeight:1.9, marginBottom:10 }}>「{st.portrait.quote}」</p>
                  <p style={{ fontSize:11, color:V.text3 }}>— {st.portrait.quote_author}</p>
                </div>
              </>
            )}

            {!st.portrait && (
              <div style={{ textAlign:'center', padding:'40px 20px', color:V.text3, fontSize:13, lineHeight:1.8 }}>
                ボタンを押してAIに現在の自分を分析してもらいましょう。<br/>
                歴史上の人物や比喩で、今の立ち位置が明確になります。
              </div>
            )}
          </div>
        )}

        {/* ── JOURNAL ── */}
        {tab === 'journal' && (
          <div>
            <div style={{ ...glass, padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontSize:12, color:V.text3, marginBottom:10 }}>名言・気づきを記録する</div>
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                {[{id:'insight',label:'気づき',c:V.purple},{id:'quote',label:'名言',c:V.amber},{id:'goal',label:'目標',c:V.primary},{id:'reflection',label:'振り返り',c:V.secondary}].map(t => (
                  <button key={t.id} onClick={() => setJournalTag(t.id)} style={{ fontSize:11, padding:'3px 8px', borderRadius:20, fontWeight:500, border:`1px solid ${journalTag===t.id?'transparent':V.border2}`, background:journalTag===t.id?t.c+'26':'transparent', color:journalTag===t.id?t.c:V.text3, cursor:'pointer', transition:'all 0.15s' }}>{t.label}</button>
                ))}
              </div>
              <textarea
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="名言、気づき、目標、振り返りなど..."
                style={{ width:'100%', minHeight:80, padding:'10px 12px', resize:'vertical', background:V.surface2, color:V.text, border:`1px solid ${V.border2}`, borderRadius:10, fontFamily:'inherit', fontSize:14, outline:'none', boxSizing:'border-box' }}
              />
              <button
                onClick={addJournal}
                disabled={!journalInput.trim()}
                style={{ width:'100%', marginTop:8, padding:'11px', borderRadius:10, background:!journalInput.trim()?V.surface2:'rgba(0,217,126,0.12)', border:`1px solid ${!journalInput.trim()?V.border:'rgba(0,217,126,0.3)'}`, color:!journalInput.trim()?V.text3:V.primary, fontWeight:600, fontSize:14, cursor:!journalInput.trim()?'not-allowed':'pointer', transition:'all 0.15s' }}
              >
                記録する →
              </button>
            </div>

            {st.journal.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:V.text3, fontSize:13, lineHeight:1.8 }}>
                日々の気づきや名言を記録しましょう。<br/>積み重ねることで思考が深まります。
              </div>
            ) : (
              [...st.journal].reverse().map((j) => {
                const tMap = { insight:{c:V.purple,l:'気づき'}, quote:{c:V.amber,l:'名言'}, goal:{c:V.primary,l:'目標'}, reflection:{c:V.secondary,l:'振り返り'} }
                const t = tMap[j.tag] || tMap.insight
                return (
                  <div key={j.ts} style={{ ...glass, padding:'14px 16px', marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:t.c+'26', color:t.c, fontWeight:500 }}>{t.l}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:11, color:V.text3 }}>{j.date}</span>
                        <button onClick={() => delJournal(j.ts)} style={{ background:'transparent', color:V.text3, fontSize:14, padding:'0 2px', border:'none', cursor:'pointer' }}>✕</button>
                      </div>
                    </div>
                    <p style={{ fontSize:14, color:V.text, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{j.tag==='quote'?`「${j.text}」`:j.text}</p>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ─ ボトムタブ ─ */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(9,9,11,0.96)', backdropFilter:'blur(12px)', borderTop:`1px solid ${V.border}`, display:'flex' }}>
        {TABS_DEF.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0 10px', fontSize:10, background:'transparent', color:tab===t.id?V.primary:V.text3, flex:1, border:'none', cursor:'pointer', transition:'color 0.2s' }}>
            <div style={{ color:tab===t.id?V.primary:V.text3 }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
