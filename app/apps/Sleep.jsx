'use client';
import { useState } from 'react';
import { callAI } from './shared';

const QUALITY_OPTIONS = [
  { id:'great',   label:'よく眠れた',     emoji:'😴', score:5 },
  { id:'ok',      label:'まあまあ',        emoji:'😐', score:3 },
  { id:'poor',    label:'あまり眠れなかった', emoji:'😫', score:2 },
  { id:'bad',     label:'ほぼ眠れなかった', emoji:'😩', score:1 },
];

const PROBLEMS = [
  { id:'fallasleep', label:'寝つき悪い',   emoji:'🌑' },
  { id:'wakeup',     label:'途中で目が覚める', emoji:'⏰' },
  { id:'early',      label:'早く目が覚める', emoji:'🌅' },
  { id:'dream',      label:'夢を見すぎる',  emoji:'💭' },
  { id:'snore',      label:'いびき・無呼吸', emoji:'😤' },
  { id:'none',       label:'問題なし',      emoji:'✨' },
];

const FEELINGS = [
  { id:'refresh',  label:'スッキリ', emoji:'⚡' },
  { id:'tired',    label:'疲れが残る', emoji:'😪' },
  { id:'groggy',   label:'ぼんやり',  emoji:'🌫️' },
  { id:'headache', label:'頭が重い',  emoji:'🤕' },
  { id:'anxious',  label:'不安・憂鬱', emoji:'😟' },
];

function ScoreGauge({ score }) {
  const max = 100;
  const pct = score / max;
  const r = 56;
  const cx = 70, cy = 70;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const sweep = endAngle - startAngle;
  const arcLen = r * sweep;
  const filled = arcLen * pct;
  const toXY = (a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const s = toXY(startAngle);
  const e = toXY(endAngle);
  const ps = toXY(startAngle);
  const pe = toXY(startAngle + sweep * pct);
  const largeArc = sweep * pct > Math.PI ? 1 : 0;
  const bgLargeArc = sweep > Math.PI ? 1 : 0;
  const color = score >= 75 ? '#6EE7B7' : score >= 50 ? '#A78BFA' : score >= 30 ? '#FBBF24' : '#F87171';
  const label = score >= 75 ? '良眠' : score >= 50 ? '普通' : score >= 30 ? '注意' : '要改善';
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={140} height={110} viewBox="0 0 140 110">
        <path d={`M${s.x},${s.y} A${r},${r} 0 ${bgLargeArc},1 ${e.x},${e.y}`} fill="none" stroke="#1A2040" strokeWidth={10} strokeLinecap="round"/>
        {pct > 0 && <path d={`M${ps.x},${ps.y} A${r},${r} 0 ${largeArc},1 ${pe.x},${pe.y}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"/>}
        <text x={cx} y={cy+6} textAnchor="middle" fill={color} fontSize={22} fontWeight={900}>{score}</text>
        <text x={cx} y={cy+24} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>{label}</text>
      </svg>
    </div>
  );
}

export default function Sleep() {
  const [bedtime,   setBedtime]   = useState('23:00');
  const [waketime,  setWaketime]  = useState('07:00');
  const [quality,   setQuality]   = useState('ok');
  const [problems,  setProblems]  = useState([]);
  const [feeling,   setFeeling]   = useState('tired');
  const [stress,    setStress]    = useState(5);
  const [note,      setNote]      = useState('');
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState('record');
  const [history,   setHistory]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('sleep-v1') || '[]'); } catch { return []; }
  });

  const toggleProblem = (id) => {
    setProblems(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const calcHours = () => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = waketime.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
    return (mins / 60).toFixed(1);
  };

  const analyze = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const hours = calcHours();
      const q = QUALITY_OPTIONS.find(q => q.id === quality);
      const f = FEELINGS.find(f => f.id === feeling);
      const probs = problems.map(id => PROBLEMS.find(p => p.id === id)?.label).filter(Boolean);
      const prompt =
        `睡眠データ:\n` +
        `就寝時刻: ${bedtime}\n起床時刻: ${waketime}\n睡眠時間: ${hours}時間\n` +
        `睡眠の質: ${q?.label}\n目覚め感: ${f?.label}\n` +
        (probs.length ? `睡眠の悩み: ${probs.join('、')}\n` : '') +
        `ストレスレベル: ${stress}/10\n` +
        (note ? `メモ: ${note}\n` : '') +
        `\n上記のデータを分析し、以下の形式でアドバイスをください：\n` +
        `【睡眠スコア】0〜100の数値のみ（数値だけ）\n` +
        `【今夜の睡眠の評価】2〜3文で\n` +
        `【改善アドバイス】3つの具体的なアドバイスを番号付きで\n` +
        `【明日のための一言】励ましのメッセージ`;
      const res = await callAI(
        'あなたは睡眠専門家のAIアドバイザーです。睡眠データを分析して、科学的根拠に基づいた実践的なアドバイスを提供します。',
        prompt
      );
      const scoreMatch = res.match(/【睡眠スコア】\s*(\d+)/);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : Math.round(q.score * 18 + parseFloat(hours) * 4);
      setResult({ text: res, score, hours });
    } catch {
      const hours = calcHours();
      const q = QUALITY_OPTIONS.find(q => q.id === quality);
      const score = Math.min(100, Math.round(q.score * 18 + parseFloat(hours) * 4));
      setResult({ text: '【睡眠スコア】' + score + '\n【今夜の睡眠の評価】\n睡眠データを記録できました。毎日続けることで、より精度の高い分析が可能になります。\n【改善アドバイス】\n1. 就寝・起床時間を毎日一定にする\n2. 寝る1時間前はスマホを控える\n3. 寝室の温度を18〜22℃に保つ\n【明日のための一言】\n良い睡眠は明日の活力。今夜もお疲れ様でした。', score, hours });
    }
    setLoading(false);
  };

  const saveRecord = () => {
    if (!result) return;
    const q = QUALITY_OPTIONS.find(q => q.id === quality);
    const f = FEELINGS.find(f => f.id === feeling);
    const entry = {
      date: new Date().toLocaleDateString('ja-JP'),
      bedtime, waketime,
      hours: result.hours,
      score: result.score,
      quality: q?.label,
      feeling: f?.label,
    };
    setHistory(prev => {
      const h = [entry, ...prev].slice(0, 30);
      localStorage.setItem('sleep-v1', JSON.stringify(h));
      return h;
    });
  };

  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
    : null;

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🌙</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI睡眠分析</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>毎日の睡眠を記録・分析してより良い眠りへ</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['record','🌙 記録する'],['history','📊 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'record' && (
        <>
          {/* Time inputs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              ['就寝時刻', bedtime, setBedtime],
              ['起床時刻', waketime, setWaketime],
            ].map(([label, val, setter]) => (
              <div key={label}>
                <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>{label}</div>
                <input
                  type="time" value={val}
                  onChange={e => setter(e.target.value)}
                  style={{
                    width:'100%', padding:'10px 12px', boxSizing:'border-box',
                    background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.15)',
                    borderRadius:10, color:'#E2E8FF', fontSize:15, outline:'none', fontFamily:'inherit',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center', marginBottom:14, padding:'10px', background:'rgba(99,102,241,0.08)', borderRadius:10, border:'1px solid rgba(99,102,241,0.12)' }}>
            <span style={{ fontSize:12, color:'#5A6890' }}>睡眠時間: </span>
            <span style={{ fontSize:18, fontWeight:800, color:'#A78BFA' }}>{calcHours()}時間</span>
          </div>

          {/* Quality */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>睡眠の質</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              {QUALITY_OPTIONS.map(q => (
                <button key={q.id} onClick={() => setQuality(q.id)} style={{
                  padding:'10px', border:`1px solid ${quality===q.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  background: quality===q.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                  borderRadius:12, cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{q.emoji}</div>
                  <div style={{ fontSize:11, fontWeight:600, color: quality===q.id ? '#A78BFA' : '#E2E8FF' }}>{q.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Morning feeling */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>目覚め感</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FEELINGS.map(f => (
                <button key={f.id} onClick={() => setFeeling(f.id)} style={{
                  padding:'7px 12px', border:`1px solid ${feeling===f.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  background: feeling===f.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                  fontSize:11, fontWeight:600, color: feeling===f.id ? '#A78BFA' : '#E2E8FF',
                }}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Problems */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>睡眠の悩み（複数可）</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {PROBLEMS.map(p => {
                const sel = problems.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggleProblem(p.id)} style={{
                    padding:'6px 11px', border:`1px solid ${sel ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                    background: sel ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                    borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                    fontSize:11, fontWeight:600, color: sel ? '#A78BFA' : '#E2E8FF',
                  }}>
                    {p.emoji} {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stress */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>ストレスレベル: <span style={{ color:'#A78BFA', fontWeight:700 }}>{stress}/10</span></div>
            <input type="range" min={1} max={10} value={stress} onChange={e => setStress(parseInt(e.target.value))}
              style={{ width:'100%', accentColor:'#7C5CFC', cursor:'pointer' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#3A4870', marginTop:2 }}>
              <span>低い</span><span>高い</span>
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>メモ（任意）</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="昨夜の出来事や気になることなど..."
              rows={2}
              style={{
                width:'100%', boxSizing:'border-box', padding:'10px 14px',
                background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.15)',
                borderRadius:10, color:'#E2E8FF', fontSize:12, outline:'none', fontFamily:'inherit', resize:'vertical',
              }}
            />
          </div>

          <button onClick={analyze} disabled={loading} style={{
            width:'100%', padding:'14px', marginBottom:20,
            background: loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            border:'none', borderRadius:12,
            color: loading ? '#3A4870' : '#fff',
            fontSize:15, fontWeight:700, cursor: loading ? 'default' : 'pointer',
            fontFamily:'inherit', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
          }}>
            {loading ? '🌙 分析中...' : '🌙 睡眠を分析する'}
          </button>

          {/* Result */}
          {result && !loading && (
            <div style={{ background:'rgba(12,10,30,0.6)', borderRadius:16, border:'1px solid rgba(99,102,241,0.2)', overflow:'hidden' }}>
              <div style={{ padding:'20px', borderBottom:'1px solid rgba(99,102,241,0.1)' }}>
                <ScoreGauge score={result.score}/>
                <div style={{ textAlign:'center', fontSize:12, color:'#5A6890', marginTop:4 }}>
                  睡眠時間 {result.hours}時間
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                {result.text.split('\n').filter(l => l.trim() && !l.includes('【睡眠スコア】')).map((line, i) => (
                  <p key={i} style={{
                    margin:'0 0 8px',
                    fontSize: line.startsWith('【') ? 11 : 13,
                    fontWeight: line.startsWith('【') ? 700 : 400,
                    color: line.startsWith('【') ? '#A78BFA' : '#C0C8E0',
                    lineHeight: 1.75,
                  }}>{line}</p>
                ))}
              </div>
              <div style={{ padding:'0 20px 16px' }}>
                <button onClick={saveRecord} style={{
                  width:'100%', padding:'11px', background:'transparent',
                  border:'1px solid rgba(251,191,36,0.3)', borderRadius:10,
                  color:'#FBBF24', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                }}>💾 記録を保存する</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🌙</div>
              <div style={{ fontSize:14 }}>まだ記録がありません</div>
              <div style={{ fontSize:12, marginTop:8 }}>毎日記録すると睡眠パターンがわかります</div>
            </div>
          ) : (
            <>
              {avgScore !== null && (
                <div style={{ padding:'16px 20px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.15)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'#5A6890' }}>平均睡眠スコア ({history.length}日分)</div>
                    <div style={{ fontSize:28, fontWeight:900, color:'#A78BFA' }}>{avgScore}<span style={{ fontSize:12, fontWeight:400, color:'#5A6890' }}>/100</span></div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'#5A6890' }}>平均睡眠時間</div>
                    <div style={{ fontSize:20, fontWeight:800, color:'#34D399' }}>
                      {(history.reduce((s,h)=>s+parseFloat(h.hours),0)/history.length).toFixed(1)}h
                    </div>
                  </div>
                </div>
              )}
              {history.map((h, i) => {
                const scoreColor = h.score >= 75 ? '#6EE7B7' : h.score >= 50 ? '#A78BFA' : h.score >= 30 ? '#FBBF24' : '#F87171';
                return (
                  <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'#E2E8FF', fontWeight:700 }}>{h.date}</span>
                      <span style={{ fontSize:18, fontWeight:900, color:scoreColor }}>{h.score}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:11, color:'#5A6890' }}>
                      <span>🕐 {h.bedtime}〜{h.waketime}</span>
                      <span>⏱️ {h.hours}h</span>
                      <span>{h.quality}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
