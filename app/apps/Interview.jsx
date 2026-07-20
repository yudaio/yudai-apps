'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const ROLES = ['エンジニア', 'デザイナー', '営業', 'マーケター', '人事・採用', 'コンサルタント', '医療・福祉', '教育・研修'];
const INDUSTRIES = ['IT・Web', '金融・保険', '製造業', '小売・EC', '医療・福祉', '教育', 'メディア・広告', 'コンサル'];
const TYPES = [
  { id:'new', label:'新卒面接', emoji:'🎓', desc:'第一印象・自己PR・学生時代' },
  { id:'change', label:'転職面接', emoji:'💼', desc:'経験・実績・キャリアチェンジ' },
  { id:'senior', label:'管理職面接', emoji:'👔', desc:'マネジメント・リーダーシップ' },
  { id:'en', label:'英語面接', emoji:'🌍', desc:'English job interview practice' },
];

const PHASES = { setup:0, answering:1, feedback:2 };

export default function Interview() {
  const [role,      setRole]     = useState('');
  const [industry,  setIndustry] = useState('');
  const [type,      setType]     = useState('change');
  const [phase,     setPhase]    = useState(PHASES.setup);
  const [questions, setQuestions]= useState([]);
  const [current,   setCurrent]  = useState(0);
  const [answer,    setAnswer]   = useState('');
  const [answers,   setAnswers]  = useState([]);
  const [feedback,  setFeedback] = useState([]);
  const [loading,   setLoading]  = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('interview');

  const startInterview = async () => {
    if (!role.trim() || loading) return;
    setLoading(true);
    try {
      const t = TYPES.find(t => t.id === type);
      const lang = type === 'en' ? 'English' : '日本語';
      const prompt =
        `【志望職種】${role}${industry ? `（${industry}）` : ''}\n` +
        `【面接タイプ】${t.label}\n\n` +
        `${lang}で面接質問を3つ作成してください。各質問は実際の面接で使われるリアルな内容で。\n` +
        `フォーマット:\nQ1: (質問1)\nQ2: (質問2)\nQ3: (質問3)`;
      const res = await callAI(
        `あなたは${lang}の面接官です。志望者のスキルと適性を深く理解するための質問をします。`,
        prompt
      );
      const qs = res.match(/Q\d+[：:]\s*(.+)/g)?.map(q => q.replace(/Q\d+[：:]\s*/, '').trim()) || [
        '自己紹介をお願いします。',
        'この職種を志望した理由は？',
        '5年後のキャリアビジョンを教えてください。',
      ];
      setQuestions(qs);
      setAnswers([]);
      setFeedback([]);
      setCurrent(0);
      setAnswer('');
      setPhase(PHASES.answering);
    } catch {
      setQuestions(['自己紹介をお願いします。', 'この仕事を志望した理由は？', 'あなたの強みを教えてください。']);
      setPhase(PHASES.answering);
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || loading) return;
    if (!check()) return;
    setLoading(true);
    const newAnswers = [...answers, answer.trim()];
    setAnswers(newAnswers);
    try {
      const t = TYPES.find(t => t.id === type);
      const lang = type === 'en' ? 'English' : '日本語';
      const prompt =
        `面接質問: 「${questions[current]}」\n` +
        `回答: 「${answer.trim()}」\n\n` +
        `この回答に対して${lang}で評価してください:\n` +
        `①スコア（100点満点）\n②良い点（1〜2つ）\n③改善点（1〜2つ）\n④模範回答（2〜3文）\n` +
        `簡潔に、各項目を改行して。`;
      const res = await callAI(
        `あなたは${t.label}の経験豊富な面接官です。建設的なフィードバックを${lang}で提供します。`,
        prompt
      );
      const newFeedback = [...feedback, res.trim()];
      setFeedback(newFeedback);
      increment();
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setAnswer('');
      } else {
        setPhase(PHASES.feedback);
      }
    } catch {
      const newFeedback = [...feedback, '①スコア: 75点\n②良い点: 具体的な経験を述べていました\n③改善点: 数字や実績を加えるとより説得力が増します\n④模範回答: 実績を数値で示し、その職種への具体的な貢献を述べてください。'];
      setFeedback(newFeedback);
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setAnswer('');
      } else {
        setPhase(PHASES.feedback);
      }
    }
    setLoading(false);
  };

  const restart = () => {
    setPhase(PHASES.setup);
    setQuestions([]);
    setAnswers([]);
    setFeedback([]);
    setCurrent(0);
    setAnswer('');
  };

  const scoreFromFeedback = (fb) => fb.match(/①[^:：]*[：:]\s*(\d+)/)?.[1] || '—';

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🎤</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI面接練習</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>AIが面接官となりリアルな質問&フィードバックを提供</p>
      </div>

      {/* Setup */}
      {phase === PHASES.setup && (
        <>
          {/* Interview type */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>面接タイプ</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding:'12px 14px', textAlign:'left',
                  background: type===t.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${type===t.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:16 }}>{t.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:700, color: type===t.id ? '#A78BFA' : '#E2E8FF' }}>{t.label}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#3A4870' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>志望職種</div>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="例：Webエンジニア、マーケティングマネージャー..."
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, color:'#E2E8FF', fontSize:13, outline:'none', fontFamily:'inherit' }}
            />
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding:'4px 10px', fontSize:10,
                  background: role===r ? 'rgba(99,102,241,0.2)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${role===r ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:20, color: role===r ? '#A78BFA' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>業界（任意）</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {INDUSTRIES.map(ind => (
                <button key={ind} onClick={() => setIndustry(industry===ind ? '' : ind)} style={{
                  padding:'5px 11px', fontSize:11,
                  background: industry===ind ? 'rgba(99,102,241,0.18)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${industry===ind ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:20, color: industry===ind ? '#A78BFA' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{ind}</button>
              ))}
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={!role.trim() || loading}
            style={{
              width:'100%', padding:'14px',
              background: !role.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              border:'none', borderRadius:12,
              color: !role.trim() || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !role.trim() || loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: !role.trim() || loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            {loading ? '🎤 質問を準備中...' : '🎤 面接を開始する'}
          </button>
        </>
      )}

      {/* Answering phase */}
      {phase === PHASES.answering && (
        <>
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {questions.map((_,i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i < current ? '#7C5CFC' : i === current ? '#A78BFA' : '#1A2040', transition:'all 0.3s' }}/>
            ))}
          </div>
          <div style={{ padding:'20px', background:'rgba(99,102,241,0.08)', borderRadius:14, border:'1px solid rgba(99,102,241,0.2)', marginBottom:16 }}>
            <div style={{ fontSize:10, color:'#7C5CFC', fontWeight:700, marginBottom:10 }}>Q{current+1} / {questions.length}</div>
            <div style={{ fontSize:15, color:'#E2E8FF', lineHeight:1.7, fontWeight:600 }}>{questions[current]}</div>
          </div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="ここに回答を入力してください..."
            rows={5}
            style={{ width:'100%', boxSizing:'border-box', padding:'14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit', resize:'none', marginBottom:14 }}
          />
          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || loading}
            style={{
              width:'100%', padding:'14px',
              background: !answer.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              border:'none', borderRadius:12,
              color: !answer.trim() || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !answer.trim() || loading ? 'default' : 'pointer',
              fontFamily:'inherit',
            }}
          >
            {loading ? 'AIが採点中...' : current + 1 < questions.length ? '回答して次へ →' : '回答して結果を見る →'}
          </button>
        </>
      )}

      {/* Feedback phase */}
      {phase === PHASES.feedback && (
        <>
          <div style={{ textAlign:'center', marginBottom:20, padding:'18px', background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(124,92,252,0.06))', borderRadius:14, border:'1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8FF', marginBottom:4 }}>面接完了！</div>
            <div style={{ fontSize:12, color:'#5A6890' }}>{role} · {TYPES.find(t=>t.id===type)?.label}</div>
          </div>

          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom:14, background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'rgba(99,102,241,0.08)', borderBottom:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:10, color:'#7C5CFC', fontWeight:700, marginBottom:4 }}>Q{i+1} · スコア: {scoreFromFeedback(feedback[i] || '')}点</div>
                <div style={{ fontSize:12, color:'#C0C8E0' }}>{q}</div>
              </div>
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>あなたの回答：</div>
                <div style={{ fontSize:12, color:'#8A9CC0', marginBottom:10, lineHeight:1.65 }}>{answers[i]}</div>
                <div style={{ fontSize:12, color:'#C8D0E8', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{feedback[i]}</div>
              </div>
            </div>
          ))}

          <button onClick={restart} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(99,102,241,0.3)' }}>
            🔄 もう一度練習する
          </button>
        </>
      )}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
