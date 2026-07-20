'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const QUESTIONS = [
  { id: 'q01', text: '騒がしい場所や強い光・においが苦手ですか？' },
  { id: 'q02', text: '他人の気分や感情を場の空気から敏感に察知しますか？' },
  { id: 'q03', text: '映画・本・音楽で深く感情移入し涙が出ることがありますか？' },
  { id: 'q04', text: '細部や小さな変化に、人より先に気づくことが多いですか？' },
  { id: 'q05', text: '大勢の人と長時間いると、疲れて一人になりたくなりますか？' },
  { id: 'q06', text: '急な予定変更や想定外の出来事に強いストレスを感じますか？' },
  { id: 'q07', text: '痛み・音・温度などの刺激を人より強く感じますか？' },
  { id: 'q08', text: '自分の内面や気持ちをよく観察・内省する方ですか？' },
  { id: 'q09', text: '芸術・自然・美しいものから深い感動を受けますか？' },
  { id: 'q10', text: '多くの依頼が重なると圧倒されて動けなくなりますか？' },
  { id: 'q11', text: '誰かに傷つけられたと感じると、長く引きずりますか？' },
  { id: 'q12', text: '一人の時間が「心の充電」として強く必要だと感じますか？' },
  { id: 'q13', text: '失敗や批判を必要以上に気にしてしまいますか？' },
  { id: 'q14', text: '暴力的な映像やニュースを見ると、しばらく気分が落ちますか？' },
  { id: 'q15', text: '「繊細すぎる」「感受性が強い」と言われたことがありますか？' },
];

const HSP_TYPES = [
  {
    min: 0, max: 4,
    label: 'non-HSP',
    title: '非HSP — 鈍感力タイプ',
    emoji: '🪨',
    color: '#64748B',
    grad: 'linear-gradient(135deg,#334155,#64748B)',
    desc: 'あなたの感受性は平均的か、それ以下。ストレスに強く、多少の雑音や変化は気にならないタフさが武器です。',
    strengths: ['環境の変化に動じない強靭さ', '忙しい状況でも冷静に行動できる', '感情に左右されにくい判断力'],
    tips: ['感受性の高い友人や同僚の気持ちに少し意識を向けてみて', '直感力を鍛えることで対人関係がさらに豊かになります'],
  },
  {
    min: 5, max: 8,
    label: 'mild-HSP',
    title: 'HSP傾向あり — バランスタイプ',
    emoji: '🌿',
    color: '#34D399',
    grad: 'linear-gradient(135deg,#059669,#34D399)',
    desc: 'HSPの特性を一部持つバランス型。場の空気を読む力があり、繊細さと強さを状況に応じて切り替えられます。',
    strengths: ['状況に応じて感受性を調整できる', '他者への共感力と行動力を両立', '刺激の多い環境でも適度に機能できる'],
    tips: ['疲れたら意識して一人の時間を作りましょう', '自分の「敏感スイッチ」がどこか把握しておくと楽になります'],
  },
  {
    min: 9, max: 12,
    label: 'HSP',
    title: 'HSP — 繊細共感タイプ',
    emoji: '🌸',
    color: '#C084FC',
    grad: 'linear-gradient(135deg,#7C3AED,#C084FC)',
    desc: '高い確率でHSPです。他者の感情や環境の変化を深く処理する神経系を持ち、芸術・共感・直感力に優れています。',
    strengths: ['場の空気・他者の感情を瞬時に読み取る', '深い洞察力と芸術的感受性', 'ミスや危険を事前に察知する鋭い直感'],
    tips: ['刺激過多の後は必ず休息時間を確保して', '「敏感さ」は弱さではなくギフト。あなたの力として活かそう', '一人の時間を日課に組み込むことでパフォーマンスが上がります'],
  },
  {
    min: 13, max: 15,
    label: 'super-HSP',
    title: '超HSP — 高感度エンパスタイプ',
    emoji: '🔮',
    color: '#F472B6',
    grad: 'linear-gradient(135deg,#DB2777,#F472B6)',
    desc: '極めて高い感受性を持つ超HSP。他者の痛みや喜びを自分のことのように感じる「エンパス」的特性が強く出ています。',
    strengths: ['他者の感情を体感レベルで理解できる', '深い洞察と創造力で独自の視点を提供', '細部への鋭い注意力と美的感覚'],
    tips: ['他者のネガティブ感情を吸収しすぎないよう「境界線」を意識して', '毎日のデトックスルーティン（瞑想・自然散歩など）が必須です', '感受性を職業・創作・カウンセリングなどに活かすと力を発揮できます'],
  },
];

function ScoreRing({ score, total, color, grad }) {
  const pct = score / total;
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={128} height={128} viewBox="0 0 128 128" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A2040" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#E2E8FF" fontSize={26} fontWeight={900}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#5A6890" fontSize={11}>/ {total}</text>
    </svg>
  );
}

export default function Hsp() {
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('hsp');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hsp-v1') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState('quiz');

  const answered = Object.keys(answers).length;
  const total = QUESTIONS.length;
  const done = answered === total;
  const score = QUESTIONS.filter(q => answers[q.id] === true).length;

  const getType = (s) => HSP_TYPES.find(t => s >= t.min && s <= t.max) || HSP_TYPES[2];

  const toggle = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const analyze = async () => {
    if (loading || !done || !check()) return;
    setLoading(true);
    const type = getType(score);
    try {
      const lines = QUESTIONS.map((q, i) => `${i + 1}. ${q.text}: ${answers[q.id] ? 'はい' : 'いいえ'}`).join('\n');
      const prompt =
        `HSP診断結果:\nスコア: ${score}/${total} — ${type.title}\n\n回答:\n${lines}\n\n` +
        `上記の結果をもとに以下の形式でパーソナライズドアドバイスをください:\n` +
        `【あなたのHSPプロフィール】3文以内で現在の状態を的確に言語化する\n` +
        `【日常生活での活かし方】3つの具体的なアクション（番号付き）\n` +
        `【注意してほしいこと】HSPとして特に気をつけるべき1つのポイント\n` +
        `【あなたへのメッセージ】繊細さを肯定する温かい一言`;
      const res = await callAI(
        'あなたはHSP（敏感すぎる人）の専門家AIです。ユーザーの診断結果をもとに、繊細さを強みに変える共感的・肯定的なアドバイスをします。批判的にならず、ポジティブに本質を伝えてください。',
        prompt, 800
      );
      setAdvice(res || '');
      setPhase('result');
      increment();
      const entry = { date: new Date().toLocaleDateString('ja-JP'), score, label: type.title, color: type.color };
      setHistory(prev => {
        const h = [entry, ...prev].slice(0, 20);
        localStorage.setItem('hsp-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setPhase('result');
    }
    setLoading(false);
  };

  const reset = () => { setAnswers({}); setPhase('quiz'); setAdvice(''); setTab('quiz'); };

  const type = getType(score);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E2E8FF', margin: '0 0 6px', letterSpacing: '-0.02em' }}>AI HSP診断</h1>
        <p style={{ fontSize: 13, color: '#5A6890', margin: 0, lineHeight: 1.6 }}>15問で「敏感さの正体」を解き明かす<br/>あなたはどのタイプ？</p>
      </div>
      <UsageBadge remaining={remaining} premium={premium} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(12,10,30,0.5)', borderRadius: 12, padding: 4 }}>
        {[['quiz', '🌸 診断'], ['history', '📊 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '9px', border: 'none', borderRadius: 9,
            background: tab === id ? 'rgba(192,132,252,0.2)' : 'transparent',
            color: tab === id ? '#C084FC' : '#5A6890',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* Intro */}
      {tab === 'quiz' && phase === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: 16, padding: '24px 20px', marginBottom: 20 }}>
            <p style={{ color: '#C0C8E0', fontSize: 14, lineHeight: 1.9, margin: 0 }}>
              <strong style={{ color: '#C084FC' }}>HSP（Highly Sensitive Person）</strong>とは、生まれつき神経系が鋭敏で、刺激・感情・細部を深く処理する人のこと。人口の約<strong style={{ color: '#E2E8FF' }}>20%</strong>がHSPと言われています。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {['15問・約3分', '4タイプ診断', 'AIアドバイス付き'].map((t, i) => (
              <div key={i} style={{ flex: 1, padding: '12px 8px', background: 'rgba(12,10,30,0.6)', border: '1px solid rgba(192,132,252,0.15)', borderRadius: 12, color: '#8A9CC0', fontSize: 12, fontWeight: 600 }}>{t}</div>
            ))}
          </div>
          <button onClick={() => setPhase('quiz')} style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#7C3AED,#C084FC)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(192,132,252,0.25)',
          }}>🌸 診断スタート</button>
        </div>
      )}

      {/* Quiz */}
      {tab === 'quiz' && phase === 'quiz' && (
        <>
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5A6890', marginBottom: 6 }}>
              <span>{answered}/{total} 回答済み</span>
              <span>{Math.round((answered / total) * 100)}%</span>
            </div>
            <div style={{ height: 4, background: '#1A2040', borderRadius: 4 }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7C3AED,#F472B6)', width: `${(answered / total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>

          {QUESTIONS.map((q, qi) => {
            const ans = answers[q.id];
            const isAnswered = ans !== undefined;
            return (
              <div key={q.id} style={{
                marginBottom: 12, padding: '16px', borderRadius: 14,
                background: isAnswered ? 'rgba(192,132,252,0.07)' : 'rgba(12,10,30,0.6)',
                border: `1px solid ${isAnswered ? 'rgba(192,132,252,0.25)' : 'rgba(192,132,252,0.08)'}`,
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8FF', marginBottom: 12, lineHeight: 1.6 }}>
                  <span style={{ color: '#5A6890', fontSize: 11, marginRight: 6 }}>Q{qi + 1}.</span>{q.text}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[true, false].map(val => {
                    const sel = ans === val;
                    const label = val ? 'はい' : 'いいえ';
                    const selColor = val ? '#C084FC' : '#64748B';
                    return (
                      <button key={String(val)} onClick={() => toggle(q.id, val)} style={{
                        flex: 1, padding: '9px', border: `1px solid ${sel ? selColor + '60' : 'rgba(99,102,241,0.12)'}`,
                        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: sel ? selColor + '18' : 'rgba(12,10,30,0.4)',
                        color: sel ? selColor : '#5A6890',
                        fontSize: 13, fontWeight: sel ? 700 : 500, transition: 'all 0.15s',
                      }}>{label}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button onClick={analyze} disabled={!done || loading} style={{
            width: '100%', padding: '14px', marginTop: 8, border: 'none', borderRadius: 12,
            background: !done ? 'rgba(30,30,60,0.4)' : loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#7C3AED,#C084FC)',
            color: !done || loading ? '#3A4870' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: !done || loading ? 'default' : 'pointer',
            fontFamily: 'inherit', boxShadow: done && !loading ? '0 4px 20px rgba(192,132,252,0.3)' : 'none',
          }}>
            {loading ? '🌸 分析中...' : done ? '🔮 HSPタイプを診断する' : `あと${total - answered}問回答してください`}
          </button>
        </>
      )}

      {/* Result */}
      {tab === 'quiz' && phase === 'result' && (
        <div>
          {/* Type card */}
          <div style={{
            padding: '28px 20px', borderRadius: 18, border: `1px solid ${type.color}40`,
            background: `linear-gradient(135deg,${type.color}12,rgba(12,10,30,0.8))`,
            textAlign: 'center', marginBottom: 16,
          }}>
            <ScoreRing score={score} total={total} color={type.color} />
            <div style={{ fontSize: 42, margin: '12px 0 6px' }}>{type.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: type.color, marginBottom: 6 }}>{type.title}</div>
            <div style={{ fontSize: 13, color: '#8A9CC0', lineHeight: 1.75, maxWidth: 300, margin: '0 auto' }}>{type.desc}</div>
          </div>

          {/* Strengths */}
          <div style={{ background: 'rgba(12,10,30,0.6)', borderRadius: 14, border: '1px solid rgba(192,132,252,0.12)', padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#C084FC', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>✨ あなたの強み</div>
            {type.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < type.strengths.length - 1 ? 8 : 0 }}>
                <span style={{ color: type.color, fontSize: 14, flexShrink: 0 }}>•</span>
                <span style={{ color: '#C0C8E0', fontSize: 13, lineHeight: 1.65 }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{ background: 'rgba(12,10,30,0.6)', borderRadius: 14, border: '1px solid rgba(192,132,252,0.12)', padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#C084FC', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>💡 あなたへのヒント</div>
            {type.tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < type.tips.length - 1 ? 8 : 0 }}>
                <span style={{ color: type.color, fontSize: 14, flexShrink: 0 }}>•</span>
                <span style={{ color: '#C0C8E0', fontSize: 13, lineHeight: 1.65 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* AI Advice */}
          {advice && (
            <div style={{ background: 'rgba(12,10,30,0.6)', borderRadius: 14, border: '1px solid rgba(192,132,252,0.15)', padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#C084FC', fontWeight: 700, marginBottom: 12, letterSpacing: '0.08em' }}>🤖 AI パーソナルアドバイス</div>
              {advice.split('\n').filter(l => l.trim()).map((line, i) => (
                <p key={i} style={{
                  margin: '0 0 8px',
                  fontSize: line.startsWith('【') ? 11 : 13,
                  fontWeight: line.startsWith('【') ? 700 : 400,
                  color: line.startsWith('【') ? '#C084FC' : '#C0C8E0',
                  lineHeight: 1.8,
                }}>{line}</p>
              ))}
            </div>
          )}

          <button onClick={reset} style={{
            width: '100%', padding: '13px', background: 'transparent',
            border: '1px solid rgba(192,132,252,0.25)', borderRadius: 12,
            color: '#C084FC', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔄 もう一度診断する</button>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 20px', color: '#3A4870' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌸</div>
              <div style={{ fontSize: 14 }}>まだ診断履歴がありません</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>診断して自分のHSP傾向の変化を追跡しましょう</div>
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} style={{ padding: '12px 16px', background: 'rgba(12,10,30,0.5)', borderRadius: 10, border: '1px solid rgba(192,132,252,0.1)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#E2E8FF', fontWeight: 600 }}>{h.label}</span>
                  <div style={{ fontSize: 10, color: '#3A4870', marginTop: 2 }}>{h.date}</div>
                </div>
                <span style={{ fontSize: 22, fontWeight: 900, color: h.color }}>{h.score}<span style={{ fontSize: 12, color: '#5A6890' }}>/{total}</span></span>
              </div>
            ))
          )}
        </div>
      )}

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
