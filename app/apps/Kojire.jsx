'use client';
import { useState } from 'react';
import { callAI, AppHero, Loading, AIErrorCard, share } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const COLOR = '#7C5CFC';
const GRAD  = 'linear-gradient(135deg, #4C1D95, #7C5CFC, #FB7185)';

const REL_TYPES = [
  { id:'friend', emoji:'👫', label:'友人・知人',  color:'#38BDF8' },
  { id:'lover',  emoji:'💑', label:'恋人',        color:'#FB7185' },
  { id:'family', emoji:'🏠', label:'家族',        color:'#FBBF24' },
  { id:'work',   emoji:'💼', label:'職場・同僚',  color:'#34D399' },
  { id:'other',  emoji:'🤝', label:'その他',      color:'#A78BFA' },
];

const SYSTEM = `あなたは「AI修復師」という人間関係の専門AIです。
ユーザーのこじれた人間関係を分析し、必ず以下のマーカーを使って回答してください。

##SCORE##
修復難易度を0〜100の整数のみ（0=簡単、100=非常に困難）

##ANALYSIS##
状況分析（3〜4文。何がこじれの本質か客観的に）

##OTHERSIDE##
相手の立場からの本音（2〜3文。「相手の視点では…」で始める）

##MESSAGE##
今すぐ送れるメッセージ文案（実際に使えるLINE・メールの文章。敬語/タメ語は関係性に合わせる）

##DONTS##
やってはいけないNG行動を3つ（各行を「・」から始める）

##STEP##
今日すぐできる具体的な一歩（1〜2文）

##PROGNOSIS##
修復の見通し（2文。正直に、でも希望を持てる内容で）`;

function parse(text) {
  const get = (key) => {
    const keys = ['SCORE','ANALYSIS','OTHERSIDE','MESSAGE','DONTS','STEP','PROGNOSIS'];
    const start = text.indexOf(`##${key}##`);
    if (start === -1) return '';
    const from = start + key.length + 4;
    let end = text.length;
    for (const k of keys) {
      if (k === key) continue;
      const pos = text.indexOf(`##${k}##`, from);
      if (pos !== -1 && pos < end) end = pos;
    }
    return text.slice(from, end).trim();
  };
  return {
    score:     parseInt(get('SCORE')) || 50,
    analysis:  get('ANALYSIS'),
    otherSide: get('OTHERSIDE'),
    message:   get('MESSAGE'),
    donts:     get('DONTS').split('\n').filter(l => l.trim().startsWith('・')).map(l => l.replace(/^・\s*/, '')),
    step:      get('STEP'),
    prognosis: get('PROGNOSIS'),
  };
}

function Gauge({ score }) {
  const c = score < 35 ? '#34D399' : score < 65 ? '#FBBF24' : '#FB7185';
  const lbl = score < 35 ? '修復しやすい' : score < 65 ? 'やや難しい' : '要慎重に進める';
  return (
    <div style={{ marginBottom:20, padding:'16px', background:'#0C0E22', border:'1px solid #1E2448', borderRadius:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
        <span style={{ fontSize:12, color:'#5A6890', fontWeight:600 }}>修復難易度スコア</span>
        <span style={{ fontSize:30, fontWeight:900, color:c }}>{score}</span>
      </div>
      <div style={{ height:10, borderRadius:8, background:'#1A2040', overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg,#34D399,${c})`, borderRadius:8, transition:'width 1s ease' }}/>
      </div>
      <div style={{ fontSize:12, color:c, fontWeight:700 }}>{lbl}</div>
    </div>
  );
}

function Card({ icon, title, color, children }) {
  return (
    <div style={{ marginBottom:14, background:'#0C0E22', border:`1px solid ${color}30`, borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'11px 16px', background:`${color}12`, borderBottom:`1px solid ${color}20`, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:15 }}>{icon}</span>
        <span style={{ fontSize:12, fontWeight:700, color }}>{title}</span>
      </div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  );
}

function ProgressBar({ step, relColor }) {
  const rel = REL_TYPES.find(r => r.id === step.relType);
  return (
    <div style={{ marginBottom:24, padding:'14px 16px', background:`${relColor}12`, border:`1px solid ${relColor}30`, borderRadius:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ fontSize:18 }}>{rel?.emoji}</span>
        <span style={{ fontSize:13, fontWeight:700, color:relColor }}>{rel?.label}との関係</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'#5A6890' }}>質問 {step.num} / 3</span>
      </div>
      <div style={{ height:4, borderRadius:4, background:'#1A2040', overflow:'hidden' }}>
        <div style={{ width:`${(step.num/3)*100}%`, height:'100%', background:relColor, borderRadius:4, transition:'width 0.4s ease' }}/>
      </div>
    </div>
  );
}

function NavBtns({ onBack, onNext, nextLabel, nextDisabled, nextGrad }) {
  return (
    <div style={{ display:'flex', gap:10, marginTop:16 }}>
      <button onClick={onBack} style={{ padding:'14px 20px', background:'transparent', border:'1px solid #1A2040', borderRadius:12, color:'#5A6890', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>← 戻る</button>
      <button onClick={onNext} disabled={nextDisabled} style={{
        flex:1, padding:'14px',
        background: nextDisabled ? '#111428' : (nextGrad || `linear-gradient(135deg,#7C5CFC,#4C1D95)`),
        border: nextDisabled ? '1px solid #1E2448' : 'none',
        borderRadius:12, color: nextDisabled ? '#2A3460' : '#fff',
        fontSize:15, fontWeight:700, cursor: nextDisabled ? 'default' : 'pointer',
        fontFamily:'inherit', boxShadow: nextDisabled ? 'none' : '0 4px 20px rgba(124,92,252,0.3)',
      }}>{nextLabel}</button>
    </div>
  );
}

function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      style={{ width:'100%', padding:'14px 16px', background:'#080A18', border:'1px solid #1E2448', borderRadius:12, color:'#E2E8FF', fontSize:14, resize:'vertical', fontFamily:'inherit', lineHeight:1.8, boxSizing:'border-box', outline:'none' }}
      onFocus={e => { e.target.style.borderColor='#7C5CFC55'; e.target.style.boxShadow='0 0 0 3px #7C5CFC10'; }}
      onBlur={e => { e.target.style.borderColor='#1E2448'; e.target.style.boxShadow='none'; }}
    />
  );
}

export default function Kojire() {
  const [phase,   setPhase]   = useState('type');
  const [relType, setRelType] = useState(null);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [result,  setResult]  = useState(null);
  const [err,     setErr]     = useState(false);
  const [copied,  setCopied]  = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('kojire');

  const rel = REL_TYPES.find(r => r.id === relType);
  const relColor = rel?.color || COLOR;

  const analyze = async () => {
    if (!check()) return;
    setPhase('loading'); setErr(false);
    const prompt = `関係の種類: ${rel?.label}\n何があったか: ${q1}\n現在の状態: ${q2}\nどうしたいか: ${q3}`;
    try {
      const text = await callAI(SYSTEM, prompt, 900);
      if (!text) throw new Error();
      setResult(parse(text));
      increment();
      setPhase('result');
    } catch {
      setErr(true);
      setPhase('result');
    }
  };

  const reset = () => {
    setPhase('type'); setRelType(null);
    setQ1(''); setQ2(''); setQ3('');
    setResult(null); setErr(false);
  };

  const copyMsg = async () => {
    if (!result?.message) return;
    try { await navigator.clipboard.writeText(result.message); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  /* ── タイプ選択 ── */
  if (phase === 'type') return (
    <div style={{ maxWidth:480, margin:'0 auto' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <AppHero
        icon="🧩"
        title="AI修復師"
        sub="こじれた関係をAIが分析して修復プランを提案"
        grad={GRAD}
        badge="💡 感情ではなく構造で解決する"
      />
      <div style={{ padding:'0 4px' }}>
        <div style={{ fontSize:13, color:'#5A6890', marginBottom:16, textAlign:'center' }}>誰とのこじれですか？</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:10 }}>
          {REL_TYPES.slice(0,4).map(t => (
            <button key={t.id} onClick={() => { setRelType(t.id); setPhase('q1'); }} style={{
              padding:'20px 12px', background:`${t.color}10`, border:`1px solid ${t.color}30`,
              borderRadius:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background=`${t.color}22`; e.currentTarget.style.borderColor=`${t.color}60`; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=`${t.color}10`; e.currentTarget.style.borderColor=`${t.color}30`; e.currentTarget.style.transform='none'; }}>
              <span style={{ fontSize:30 }}>{t.emoji}</span>
              <span style={{ fontSize:14, fontWeight:700, color:t.color }}>{t.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => { setRelType('other'); setPhase('q1'); }} style={{
          width:'100%', padding:'16px', background:'#A78BFA10', border:'1px solid #A78BFA30',
          borderRadius:14, cursor:'pointer', fontFamily:'inherit', color:'#A78BFA', fontSize:14, fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background='#A78BFA22'; e.currentTarget.style.borderColor='#A78BFA60'; }}
        onMouseLeave={e => { e.currentTarget.style.background='#A78BFA10'; e.currentTarget.style.borderColor='#A78BFA30'; }}>
          🤝 その他の関係
        </button>
      </div>
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );

  /* ── 質問1 ── */
  if (phase === 'q1') return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'0 4px' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <ProgressBar step={{ num:1, relType }} relColor={relColor} />
      <div style={{ marginBottom:8, fontSize:15, fontWeight:700, color:'#E2E8FF' }}>何がきっかけでこじれましたか？</div>
      <div style={{ fontSize:12, color:'#5A6890', marginBottom:12 }}>具体的な出来事・言葉・行動など、何でも書いて</div>
      <TextArea value={q1} onChange={setQ1} placeholder="例: 先週のLINEで送った一言が気に触ったらしく、それから既読スルーが続いている…" />
      <NavBtns onBack={reset} onNext={() => setPhase('q2')} nextLabel="次へ →" nextDisabled={!q1.trim()} />
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );

  /* ── 質問2 ── */
  if (phase === 'q2') return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'0 4px' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <ProgressBar step={{ num:2, relType }} relColor={relColor} />
      <div style={{ marginBottom:8, fontSize:15, fontWeight:700, color:'#E2E8FF' }}>今、その関係はどんな状態ですか？</div>
      <div style={{ fontSize:12, color:'#5A6890', marginBottom:12 }}>最後のやりとり・現在の雰囲気・経過した時間など</div>
      <TextArea value={q2} onChange={setQ2} placeholder="例: 3日間完全に連絡が途絶えている。向こうからも何もない。以前は毎日話していた仲。" />
      <NavBtns onBack={() => setPhase('q1')} onNext={() => setPhase('q3')} nextLabel="次へ →" nextDisabled={!q2.trim()} />
    </div>
  );

  /* ── 質問3 ── */
  if (phase === 'q3') return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'0 4px' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <ProgressBar step={{ num:3, relType }} relColor={relColor} />
      <div style={{ marginBottom:8, fontSize:15, fontWeight:700, color:'#E2E8FF' }}>あなたはどうなりたいですか？</div>
      <div style={{ fontSize:12, color:'#5A6890', marginBottom:12 }}>正直に。修復したい、距離を置きたい、謝りたい…何でもOK</div>
      <TextArea value={q3} onChange={setQ3} placeholder="例: できれば関係を元に戻したい。でも自分から謝るべきかどうかわからない。" />
      <NavBtns
        onBack={() => setPhase('q2')}
        onNext={analyze}
        nextLabel="🧩 AIが分析する"
        nextDisabled={!q3.trim()}
        nextGrad="linear-gradient(135deg,#7C5CFC,#FB7185)"
      />
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );

  /* ── ローディング ── */
  if (phase === 'loading') return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'48px 16px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🧩</div>
      <Loading message="こじれの構造を分析中…" />
      <div style={{ marginTop:12, color:'#2A3460', fontSize:12 }}>相手の視点・修復プランを生成しています</div>
    </div>
  );

  /* ── 結果 ── */
  return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'0 4px' }}>
      <UsageBadge remaining={remaining} premium={premium} />

      {/* ヘッダー */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, padding:'13px 16px', background:'#0C0E22', border:'1px solid #1E2448', borderRadius:14 }}>
        <span style={{ fontSize:20 }}>{rel?.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#E2E8FF' }}>{rel?.label}との関係 — 修復レポート</div>
          <div style={{ fontSize:11, color:'#5A6890', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q1.slice(0,35)}…</div>
        </div>
        <button onClick={reset} style={{ padding:'6px 12px', background:'transparent', border:'1px solid #1A2040', borderRadius:8, color:'#5A6890', fontSize:11, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>最初から</button>
      </div>

      {err ? (
        <AIErrorCard onRetry={analyze} color={COLOR} message="AI分析に失敗しました" />
      ) : result ? (
        <>
          <Gauge score={result.score} />

          <Card icon="🔍" title="状況分析" color="#7C5CFC">
            <p style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.85, margin:0 }}>{result.analysis}</p>
          </Card>

          <Card icon="👁" title="相手の立場から見ると" color="#FB7185">
            <p style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.85, margin:0, fontStyle:'italic' }}>{result.otherSide}</p>
          </Card>

          <Card icon="💬" title="今すぐ送れるメッセージ案" color="#34D399">
            <div style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.85, background:'#34D39910', padding:'12px 14px', borderRadius:10, border:'1px solid #34D39930', marginBottom:10, whiteSpace:'pre-wrap' }}>
              {result.message}
            </div>
            <button onClick={copyMsg} style={{
              width:'100%', padding:'11px',
              background: copied ? '#34D39920' : 'transparent',
              border:`1px solid ${copied ? '#34D399' : '#34D39940'}`,
              borderRadius:10, color: copied ? '#34D399' : '#5A6890',
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
            }}>
              {copied ? '✓ コピーしました！' : '📋 コピーして使う'}
            </button>
          </Card>

          <Card icon="🚫" title="NG行動 — やってはいけないこと" color="#FBBF24">
            {result.donts.map((d, i) => (
              <div key={i} style={{ display:'flex', gap:10, marginBottom: i < result.donts.length - 1 ? 10 : 0 }}>
                <span style={{ color:'#FBBF24', fontSize:14, flexShrink:0, marginTop:1 }}>✕</span>
                <span style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.7 }}>{d}</span>
              </div>
            ))}
          </Card>

          <Card icon="👣" title="今日の一歩" color="#38BDF8">
            <p style={{ fontSize:14, color:'#38BDF8', lineHeight:1.85, fontWeight:600, margin:0 }}>{result.step}</p>
          </Card>

          <Card icon="🔮" title="修復の見通し" color="#A78BFA">
            <p style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.85, margin:0 }}>{result.prognosis}</p>
          </Card>

          <div style={{ display:'flex', gap:10, marginTop:8, marginBottom:32 }}>
            <button onClick={() => share('AI修復師', `${result.analysis}\n\n📩 メッセージ案:\n${result.message}`)} style={{
              flex:1, padding:'13px', background:'transparent', border:'1px solid #1E2448', borderRadius:12,
              color:'#5A6890', fontSize:13, cursor:'pointer', fontFamily:'inherit',
            }}>📤 シェア</button>
            <button onClick={reset} style={{
              flex:1, padding:'13px', background:GRAD, border:'none', borderRadius:12,
              color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            }}>別の相談をする</button>
          </div>
        </>
      ) : null}

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
