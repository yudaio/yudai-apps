'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const QUESTIONS = [
  { id:'sleep',   label:'最近、よく眠れていますか？',           opts:['よく眠れる','まあまあ','あまり眠れない','全然眠れない'] },
  { id:'focus',   label:'集中力が続かないことがありますか？',   opts:['ほとんどない','たまにある','よくある','常にある'] },
  { id:'irritate',label:'些細なことでイライラしますか？',       opts:['ほとんどない','たまにある','よくある','常にある'] },
  { id:'appetite',label:'食欲はどうですか？',                   opts:['普通にある','少し減った','かなり減った','ほぼない/食べ過ぎ'] },
  { id:'enjoy',   label:'楽しいと感じることがありますか？',     opts:['よくある','たまにある','あまりない','ほとんどない'] },
  { id:'body',    label:'頭痛・肩こり・胃痛などがありますか？', opts:['ほとんどない','たまにある','よくある','常にある'] },
  { id:'future',  label:'将来について不安を感じますか？',       opts:['あまり感じない','少し感じる','よく感じる','常に感じる'] },
  { id:'support', label:'困ったとき話せる人がいますか？',       opts:['いる','どちらかといえばいる','あまりいない','いない'] },
];

const STRESS_LEVELS = [
  { min:0,  max:20, label:'ストレス少なめ', color:'#34D399', emoji:'😊', desc:'今は心身ともに安定しています。この状態を維持しましょう。' },
  { min:21, max:40, label:'軽度のストレス', color:'#FBBF24', emoji:'🙂', desc:'日常的なストレスを感じていますが、コントロール可能な範囲です。' },
  { min:41, max:60, label:'中程度のストレス', color:'#FB923C', emoji:'😐', desc:'ストレスが蓄積しています。意識的に休息を取ることが大切です。' },
  { min:61, max:80, label:'高いストレス',   color:'#F87171', emoji:'😟', desc:'ストレスレベルが高い状態です。早めのケアが必要です。' },
  { min:81, max:100,label:'非常に高いストレス', color:'#EF4444', emoji:'😩', desc:'心身への影響が出やすい状態です。専門家への相談も検討してください。' },
];

function RadarChart({ scores }) {
  const labels = ['睡眠', '集中力', 'イライラ', '食欲', '意欲', '身体症状', '不安', '社会性'];
  const n = scores.length;
  const cx = 110, cy = 110, r = 80;
  const pts = scores.map((s, i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    const dist = r * (s / 3);
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const gridLevels = [1, 2, 3];
  const axisColor = '#1A2040';
  const gridColor = '#1A2040';

  return (
    <svg width={220} height={220} viewBox="0 0 220 220" style={{ display:'block', margin:'0 auto' }}>
      {gridLevels.map(level => {
        const gp = labels.map((_, i) => {
          const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
          const dist = r * (level / 3);
          return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={level} points={gp} fill="none" stroke={gridColor} strokeWidth={0.8}/>;
      })}
      {labels.map((_, i) => {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke={axisColor} strokeWidth={0.8}/>;
      })}
      <polygon points={polyPts} fill="rgba(99,102,241,0.2)" stroke="#818CF8" strokeWidth={1.5}/>
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#A78BFA"/>)}
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const dist = r + 16;
        const x = cx + dist * Math.cos(angle);
        const y = cy + dist * Math.sin(angle);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#5A6890" fontSize={8.5}>{label}</text>;
      })}
    </svg>
  );
}

export default function Stress() {
  const [answers, setAnswers]   = useState({});
  const [phase,   setPhase]     = useState('quiz'); // quiz | result
  const [advice,  setAdvice]    = useState('');
  const [loading, setLoading]   = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('stress');
  const [history, setHistory]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('stress-v1') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState('quiz');

  const current = QUESTIONS.findIndex(q => !(q.id in answers));
  const progress = Object.keys(answers).length;
  const done = progress === QUESTIONS.length;

  const answer = (qId, idx) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const calcScore = () => {
    const weights = [3,3,2,2,3,2,3,2]; // 重み付け
    let total = 0, maxTotal = 0;
    QUESTIONS.forEach((q, i) => {
      const val = answers[q.id] ?? 0;
      total += val * weights[i];
      maxTotal += 3 * weights[i];
    });
    return Math.round((total / maxTotal) * 100);
  };

  const getLevel = (score) => STRESS_LEVELS.find(l => score >= l.min && score <= l.max) || STRESS_LEVELS[2];

  const analyze = async () => {
    if (loading || !done || !check()) return;
    setLoading(true);
    const score = calcScore();
    const level = getLevel(score);
    try {
      const answerText = QUESTIONS.map(q => `${q.label}: ${q.opts[answers[q.id] ?? 0]}`).join('\n');
      const prompt =
        `ストレス診断結果:\nスコア: ${score}/100 (${level.label})\n\n回答内容:\n${answerText}\n\n` +
        `上記の結果をもとに以下の形式でアドバイスをください：\n` +
        `【あなたのストレスパターン】2〜3文で現状の分析\n` +
        `【今すぐできること】3つの具体的なケア方法（番号付き）\n` +
        `【今週試してほしいこと】1つの具体的なアクション\n` +
        `【あなたへのメッセージ】励ましの一言`;
      const res = await callAI(
        'あなたはストレスマネジメントの専門家AIです。診断結果をもとに、科学的根拠に基づいた共感的なアドバイスを提供します。',
        prompt
      );
      setAdvice(res);
      setPhase('result');
      increment();
      const entry = {
        date: new Date().toLocaleDateString('ja-JP'),
        score,
        level: level.label,
        color: level.color,
      };
      setHistory(prev => {
        const h = [entry, ...prev].slice(0, 20);
        localStorage.setItem('stress-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setAdvice(`【あなたのストレスパターン】\nスコア${score}点は${level.label}の状態です。\n\n【今すぐできること】\n1. 深呼吸を3回してみましょう\n2. 5分間、目を閉じて休みましょう\n3. 好きな飲み物を飲みましょう\n\n【今週試してほしいこと】\n毎日10分の散歩を取り入れてみてください\n\n【あなたへのメッセージ】\nあなたはよく頑張っています。自分を大切に。`);
      setPhase('result');
    }
    setLoading(false);
  };

  const reset = () => {
    setAnswers({});
    setPhase('quiz');
    setAdvice('');
  };

  const score = done ? calcScore() : 0;
  const level = getLevel(score);
  const radarScores = QUESTIONS.map(q => answers[q.id] ?? 0);

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🧘</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AIストレス診断</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>8つの質問でストレスレベルとパターンを可視化</p>
      </div>
      <UsageBadge remaining={remaining} premium={premium} />

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['quiz','🧘 診断する'],['history','📊 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'quiz' && phase === 'quiz' && (
        <>
          {/* Progress */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#5A6890', marginBottom:6 }}>
              <span>{progress}/{QUESTIONS.length} 回答済み</span>
              <span>{Math.round((progress/QUESTIONS.length)*100)}%</span>
            </div>
            <div style={{ height:4, background:'#1A2040', borderRadius:4 }}>
              <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg,#6366F1,#A78BFA)', width:`${(progress/QUESTIONS.length)*100}%`, transition:'width 0.3s' }}/>
            </div>
          </div>

          {QUESTIONS.map((q, qi) => {
            const answered = q.id in answers;
            const isCurrent = qi === current;
            return (
              <div key={q.id} style={{
                marginBottom:14, padding:'16px', borderRadius:14,
                background: answered ? 'rgba(99,102,241,0.08)' : isCurrent ? 'rgba(12,10,30,0.7)' : 'rgba(12,10,30,0.3)',
                border:`1px solid ${answered ? 'rgba(99,102,241,0.25)' : isCurrent ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.07)'}`,
                opacity: !answered && !isCurrent ? 0.5 : 1,
                transition:'all 0.2s',
              }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#E2E8FF', marginBottom:10 }}>
                  <span style={{ color:'#5A6890', fontSize:11, marginRight:6 }}>Q{qi+1}.</span>{q.label}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {q.opts.map((opt, oi) => {
                    const sel = answers[q.id] === oi;
                    return (
                      <button key={oi} onClick={() => answer(q.id, oi)} style={{
                        padding:'9px 14px', textAlign:'left',
                        background: sel ? 'rgba(99,102,241,0.2)' : 'rgba(12,10,30,0.4)',
                        border:`1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.1)'}`,
                        borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                        fontSize:12, color: sel ? '#A78BFA' : '#C0C8E0', fontWeight: sel ? 600 : 400,
                        display:'flex', alignItems:'center', gap:8,
                      }}>
                        <span style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${sel ? '#7C5CFC' : '#2A3460'}`, background: sel ? '#7C5CFC' : 'transparent', flexShrink:0 }}/>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button onClick={analyze} disabled={!done || loading} style={{
            width:'100%', padding:'14px', marginTop:8,
            background: !done ? 'rgba(30,30,60,0.4)' : loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            border:'none', borderRadius:12,
            color: !done || loading ? '#3A4870' : '#fff',
            fontSize:15, fontWeight:700, cursor: !done || loading ? 'default' : 'pointer',
            fontFamily:'inherit', boxShadow: done && !loading ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
          }}>
            {loading ? '🧘 分析中...' : done ? '🧘 ストレスを診断する' : `あと${QUESTIONS.length - progress}問回答してください`}
          </button>
        </>
      )}

      {tab === 'quiz' && phase === 'result' && (
        <div>
          {/* Score */}
          <div style={{ textAlign:'center', padding:'24px', background:'rgba(12,10,30,0.6)', borderRadius:16, border:`1px solid ${level.color}30`, marginBottom:16 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>{level.emoji}</div>
            <div style={{ fontSize:36, fontWeight:900, color:level.color, marginBottom:4 }}>{score}<span style={{ fontSize:14, fontWeight:400, color:'#5A6890' }}>/100</span></div>
            <div style={{ fontSize:15, fontWeight:700, color:level.color, marginBottom:8 }}>{level.label}</div>
            <div style={{ fontSize:12, color:'#5A6890', lineHeight:1.7, maxWidth:300, margin:'0 auto' }}>{level.desc}</div>
          </div>

          {/* Radar */}
          <div style={{ background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.12)', padding:'16px', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#5A6890', textAlign:'center', marginBottom:8 }}>ストレスレーダーチャート</div>
            <RadarChart scores={radarScores}/>
          </div>

          {/* AI Advice */}
          <div style={{ background:'rgba(12,10,30,0.6)', borderRadius:14, border:'1px solid rgba(99,102,241,0.15)', padding:'20px', marginBottom:16 }}>
            {advice.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} style={{
                margin:'0 0 8px',
                fontSize: line.startsWith('【') ? 11 : 13,
                fontWeight: line.startsWith('【') ? 700 : 400,
                color: line.startsWith('【') ? '#A78BFA' : '#C0C8E0',
                lineHeight: 1.8,
              }}>{line}</p>
            ))}
          </div>

          <button onClick={reset} style={{
            width:'100%', padding:'13px', background:'transparent',
            border:'1px solid rgba(99,102,241,0.25)', borderRadius:12,
            color:'#A78BFA', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>🔄 もう一度診断する</button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🧘</div>
              <div style={{ fontSize:14 }}>まだ診断履歴がありません</div>
              <div style={{ fontSize:12, marginTop:8 }}>定期的に診断してストレスの変化を追跡しましょう</div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:4, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
                {history.slice(0,10).map((h, i) => (
                  <div key={i} style={{ flexShrink:0, textAlign:'center', width:44 }}>
                    <div style={{ height:60, background:'rgba(12,10,30,0.5)', borderRadius:8, border:`1px solid ${h.color}30`, display:'flex', alignItems:'flex-end', justifyContent:'center', marginBottom:4, overflow:'hidden' }}>
                      <div style={{ width:'100%', background:h.color+'60', height:`${h.score}%`, borderRadius:'4px 4px 0 0', transition:'height 0.5s' }}/>
                    </div>
                    <div style={{ fontSize:9, color:'#3A4870' }}>{h.date.replace(/\d{4}\//, '')}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:h.color }}>{h.score}</div>
                  </div>
                ))}
              </div>
              {history.map((h, i) => (
                <div key={i} style={{ padding:'12px 16px', background:'rgba(12,10,30,0.5)', borderRadius:10, border:'1px solid rgba(99,102,241,0.1)', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:11, color:'#E2E8FF', fontWeight:600 }}>{h.level}</span>
                    <div style={{ fontSize:10, color:'#3A4870', marginTop:2 }}>{h.date}</div>
                  </div>
                  <span style={{ fontSize:20, fontWeight:900, color:h.color }}>{h.score}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
