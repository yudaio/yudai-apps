'use client';
import { useState, useCallback } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const WORDS = {
  basic: [
    { en:'achieve',   ja:'達成する',   alt:['失う','忘れる','避ける'] },
    { en:'balance',   ja:'バランス',   alt:['混乱','危険','孤独'] },
    { en:'challenge', ja:'挑戦',       alt:['休憩','失敗','後退'] },
    { en:'develop',   ja:'発展させる', alt:['破壊する','止める','隠す'] },
    { en:'effort',    ja:'努力',       alt:['失望','遅延','批判'] },
    { en:'express',   ja:'表現する',   alt:['否定する','忘れる','壊す'] },
    { en:'focus',     ja:'集中する',   alt:['迷う','逃げる','眠る'] },
    { en:'improve',   ja:'改善する',   alt:['悪化させる','無視する','諦める'] },
    { en:'notice',    ja:'気づく',     alt:['見逃す','消す','避ける'] },
    { en:'support',   ja:'支援する',   alt:['妨げる','批判する','離れる'] },
    { en:'grateful',  ja:'感謝している', alt:['不満な','怒っている','退屈な'] },
    { en:'confident', ja:'自信のある', alt:['臆病な','混乱した','疲れた'] },
    { en:'patient',   ja:'我慢強い',   alt:['短気な','乱暴な','無関心な'] },
    { en:'curious',   ja:'好奇心旺盛な', alt:['退屈な','不安な','冷たい'] },
    { en:'creative',  ja:'創造的な',   alt:['平凡な','退屈な','破壊的な'] },
  ],
  intermediate: [
    { en:'resilient',    ja:'回復力がある',   alt:['もろい','頑固な','無気力な'] },
    { en:'pragmatic',    ja:'実用的な',       alt:['非現実的な','感情的な','混乱した'] },
    { en:'eloquent',     ja:'雄弁な',         alt:['無口な','失礼な','曖昧な'] },
    { en:'meticulous',   ja:'細心の注意を払う', alt:['大雑把な','無頓着な','衝動的な'] },
    { en:'nuanced',      ja:'微妙なニュアンスのある', alt:['単純な','大げさな','誤解した'] },
    { en:'tenacious',    ja:'粘り強い',       alt:['諦めやすい','気まぐれな','弱い'] },
    { en:'diligent',     ja:'勤勉な',         alt:['怠惰な','不注意な','散漫な'] },
    { en:'ambiguous',    ja:'曖昧な',         alt:['明確な','単純な','誠実な'] },
    { en:'versatile',    ja:'多才な',         alt:['専門的な','限定的な','平凡な'] },
    { en:'persevere',    ja:'粘り強く続ける', alt:['諦める','休む','逃げる'] },
    { en:'collaborate',  ja:'協力する',       alt:['競争する','孤立する','妨害する'] },
    { en:'innovate',     ja:'革新する',       alt:['模倣する','維持する','否定する'] },
    { en:'empathy',      ja:'共感',           alt:['無関心','優越感','軽蔑'] },
    { en:'integrity',    ja:'誠実さ・高潔さ', alt:['不誠実','欺瞞','腐敗'] },
    { en:'momentum',     ja:'勢い・弾み',     alt:['停滞','減速','後退'] },
  ],
  advanced: [
    { en:'ubiquitous',    ja:'いたるところにある', alt:['希少な','一時的な','不可解な'] },
    { en:'quintessential',ja:'典型的な・最も本質的な', alt:['非典型的な','表面的な','偶然の'] },
    { en:'juxtapose',     ja:'並置する・対比する', alt:['統一する','隠す','単純化する'] },
    { en:'laconic',       ja:'簡潔な・寡黙な',   alt:['饒舌な','複雑な','不明瞭な'] },
    { en:'obfuscate',     ja:'曖昧にする・難解にする', alt:['明確にする','単純化する','強調する'] },
    { en:'fastidious',    ja:'細かいことにこだわる', alt:['大雑把な','無関心な','寛大な'] },
    { en:'gregarious',    ja:'社交的な・群れを好む', alt:['内向的な','孤立した','攻撃的な'] },
    { en:'harbinger',     ja:'前触れ・先駆け',   alt:['結果','遺産','模倣'] },
    { en:'intrinsic',     ja:'本質的な・固有の', alt:['外部的な','付加的な','人工的な'] },
    { en:'circumspect',   ja:'慎重な・用心深い', alt:['無謀な','衝動的な','無頓着な'] },
    { en:'benevolent',    ja:'慈悲深い・善意の', alt:['意地悪な','利己的な','無関心な'] },
    { en:'analogous',     ja:'類似した・相同の', alt:['対立する','無関係な','独特の'] },
    { en:'ephemeral',     ja:'はかない・一時的な', alt:['永続的な','強固な','実質的な'] },
    { en:'sycophant',     ja:'ごますり・おべっか使い', alt:['批評家','反逆者','指導者'] },
    { en:'tangential',    ja:'本筋から外れた',   alt:['中心的な','重要な','直接的な'] },
  ],
};

const LEVEL_LABELS = {
  basic:        { label:'初・中級', en:'A2-B1', color:'#34D399' },
  intermediate: { label:'中・上級', en:'B2-C1', color:'#60A5FA' },
  advanced:     { label:'上級',     en:'C1-C2', color:'#F472B6' },
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function Vocab() {
  const [level,    setLevel]    = useState(null);
  const [q,        setQ]        = useState(null); // { word, choices, correctIdx }
  const [qIdx,     setQIdx]     = useState(0);
  const [queue,    setQueue]    = useState([]);
  const [selected, setSelected] = useState(null); // index chosen
  const [hint,     setHint]     = useState('');
  const [hinting,  setHinting]  = useState(false);
  const [score,    setScore]    = useState({ correct:0, total:0 });
  const [done,     setDone]     = useState(false);
  const [history,  setHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('vocab-v1') || '[]'); } catch { return []; }
  });
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('vocab');

  const TOTAL = 10;

  const startQuiz = useCallback((lv) => {
    setLevel(lv);
    const pool = shuffle(WORDS[lv]).slice(0, TOTAL);
    setQueue(pool);
    setQIdx(0);
    setScore({ correct:0, total:0 });
    setDone(false);
    loadQuestion(pool, 0, lv);
  }, []);

  const loadQuestion = (pool, idx, lv) => {
    const word = pool[idx];
    const allWrong = shuffle(word.alt);
    const wrongChoices = allWrong.slice(0, 3);
    const choices = shuffle([word.ja, ...wrongChoices]);
    const correctIdx = choices.indexOf(word.ja);
    setQ({ word: word.en, correct: word.ja, choices, correctIdx, lv });
    setSelected(null);
    setHint('');
  };

  const choose = useCallback(async (idx) => {
    if (selected !== null) return;
    if (!check()) return;
    setSelected(idx);
    const isCorrect = idx === q.correctIdx;
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 };
    setScore(newScore);

    // Get AI hint
    setHinting(true);
    try {
      const res = await callAI(
        '英語学習者向けに簡潔に説明してください。',
        `"${q.word}" の日本語訳は「${q.correct}」です。この単語を使った自然な英語例文を1文（20語以内）と、日本語の意味を一言で示してください。形式：例文 → 和訳`,
        150
      );
      setHint(res);
      increment();
    } catch {
      setHint(`"${q.word}" = ${q.correct}`);
    }
    setHinting(false);
  }, [selected, q, score]);

  const next = useCallback(() => {
    const nextIdx = qIdx + 1;
    if (nextIdx >= TOTAL) {
      setDone(true);
      const entry = { date: new Date().toLocaleDateString('ja-JP'), level, score: score.correct, total: TOTAL };
      setHistory(prev => { const h = [entry, ...prev].slice(0, 20); localStorage.setItem('vocab-v1', JSON.stringify(h)); return h; });
    } else {
      setQIdx(nextIdx);
      loadQuestion(queue, nextIdx, level);
    }
  }, [qIdx, queue, level, score]);

  const lc = level ? LEVEL_LABELS[level] : null;

  if (!level) {
    return (
      <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
        <UsageBadge remaining={remaining} premium={premium} />
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>📖</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>英単語クイズ</h1>
          <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>10問で実力チェック。レベルを選んでスタート</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
          {Object.entries(LEVEL_LABELS).map(([lv, info]) => (
            <button key={lv} onClick={() => startQuiz(lv)} style={{
              padding:'18px 20px', textAlign:'left',
              background:'rgba(12,10,30,0.6)', border:`1px solid ${info.color}30`,
              borderRadius:14, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:14,
              transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${info.color}10`; e.currentTarget.style.borderColor = `${info.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,10,30,0.6)'; e.currentTarget.style.borderColor = `${info.color}30`; }}
            >
              <div style={{ width:44, height:44, borderRadius:12, background:`${info.color}18`, border:`1px solid ${info.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {lv==='basic' ? '🌱' : lv==='intermediate' ? '🌿' : '🌳'}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#E2E8FF' }}>{info.label} <span style={{ fontSize:11, color:info.color }}>{info.en}</span></div>
                <div style={{ fontSize:11, color:'#4A5880', marginTop:2 }}>
                  {lv==='basic' ? '日常会話・よく使う単語' : lv==='intermediate' ? '仕事・試験によく出る語彙' : 'ネイティブ水準の難語'}
                </div>
              </div>
              <div style={{ marginLeft:'auto', color:info.color, fontSize:20 }}>→</div>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div>
            <div style={{ fontSize:12, color:'#4A5880', marginBottom:10 }}>直近の記録</div>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', background:'rgba(12,10,30,0.4)', borderRadius:10, border:'1px solid rgba(99,102,241,0.1)', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'#6A7AB0' }}>{LEVEL_LABELS[h.level]?.label}</span>
                <span style={{ fontSize:12, color: h.score/h.total>=0.8 ? '#34D399' : h.score/h.total>=0.6 ? '#60A5FA' : '#FB7185', fontWeight:700 }}>{h.score}/{h.total}</span>
                <span style={{ fontSize:11, color:'#3A4870' }}>{h.date}</span>
              </div>
            ))}
          </div>
        )}
        {blocked && <PaywallModal onClose={dismiss} />}
      </div>
    );
  }

  if (done) {
    const pct = score.correct / TOTAL;
    const msg = pct >= 0.9 ? '完璧！素晴らしい！' : pct >= 0.7 ? 'Good job！もう少しで満点！' : pct >= 0.5 ? 'Keep it up！復習で定着を' : 'まずは基礎から固めよう';
    return (
      <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48, textAlign:'center' }}>
        <div style={{ padding:'40px 24px', background:'linear-gradient(145deg,rgba(99,102,241,0.1),rgba(124,92,252,0.06))', borderRadius:20, border:'1px solid rgba(99,102,241,0.18)', marginBottom:20 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>{pct>=0.9?'🏆':pct>=0.7?'🌟':pct>=0.5?'💪':'📚'}</div>
          <div style={{ fontSize:42, fontWeight:900, color:'#A78BFA', marginBottom:8 }}>{score.correct}<span style={{ fontSize:20, color:'#5A6890' }}>/{TOTAL}</span></div>
          <div style={{ fontSize:15, color:'#E2E8FF', fontWeight:700, marginBottom:6 }}>{msg}</div>
          <div style={{ fontSize:12, color:'#5A6890' }}>{lc.label} ({lc.en})</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => startQuiz(level)} style={{ flex:1, padding:'13px', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 もう一度
          </button>
          <button onClick={() => setLevel(null)} style={{ flex:1, padding:'13px', background:'rgba(12,10,30,0.5)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, color:'#8A9CC0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            レベル変更
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <UsageBadge remaining={remaining} premium={premium} />
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <button onClick={() => setLevel(null)} style={{ background:'none', border:'none', color:'#5A6890', cursor:'pointer', fontSize:18 }}>←</button>
        <div style={{ fontSize:12, color:lc.color, fontWeight:700 }}>{lc.label}</div>
        <div style={{ fontSize:12, color:'#5A6890' }}>{qIdx+1} / {TOTAL}</div>
      </div>

      {/* Progress */}
      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, marginBottom:24, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(qIdx/TOTAL)*100}%`, background:`linear-gradient(90deg,${lc.color},#A78BFA)`, borderRadius:4, transition:'width 0.4s ease' }}/>
      </div>

      {/* Score */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <div style={{ flex:1, padding:'10px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:10, textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#34D399' }}>{score.correct}</div>
          <div style={{ fontSize:10, color:'#4A5880' }}>正解</div>
        </div>
        <div style={{ flex:1, padding:'10px', background:'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.2)', borderRadius:10, textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#FB7185' }}>{score.total - score.correct}</div>
          <div style={{ fontSize:10, color:'#4A5880' }}>不正解</div>
        </div>
        <div style={{ flex:1, padding:'10px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#A78BFA' }}>{TOTAL - qIdx}</div>
          <div style={{ fontSize:10, color:'#4A5880' }}>残り</div>
        </div>
      </div>

      {/* Question */}
      {q && (
        <>
          <div style={{ padding:'32px 20px', background:'rgba(12,10,30,0.6)', borderRadius:16, border:`1px solid ${lc.color}20`, marginBottom:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#4A5880', marginBottom:12, letterSpacing:2, textTransform:'uppercase' }}>この単語の意味は？</div>
            <div style={{ fontSize:36, fontWeight:900, color:'#E2E8FF', letterSpacing:'-0.02em' }}>{q.word}</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {q.choices.map((ch, i) => {
              const isChosen  = selected === i;
              const isCorrect = i === q.correctIdx;
              let bg = 'rgba(12,10,30,0.5)';
              let border = 'rgba(99,102,241,0.12)';
              let color = '#B0B8D8';
              if (selected !== null) {
                if (isCorrect)        { bg = 'rgba(52,211,153,0.12)'; border = '#34D399'; color = '#34D399'; }
                else if (isChosen)    { bg = 'rgba(251,113,133,0.12)'; border = '#FB7185'; color = '#FB7185'; }
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={selected !== null}
                  style={{
                    padding:'14px 12px', background:bg,
                    border:`1px solid ${border}`, borderRadius:12,
                    color, fontSize:13, fontWeight:600, cursor: selected!==null ? 'default' : 'pointer',
                    fontFamily:'inherit', transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    minHeight:52,
                  }}
                >
                  {selected !== null && isCorrect && '✓ '}
                  {selected !== null && isChosen && !isCorrect && '✗ '}
                  {ch}
                </button>
              );
            })}
          </div>

          {/* Hint */}
          {(hinting || hint) && (
            <div style={{ padding:'14px 16px', background:'rgba(10,8,25,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.12)', marginBottom:16 }}>
              {hinting ? (
                <div style={{ color:'#5A6890', fontSize:12 }}>例文を生成中…</div>
              ) : (
                <p style={{ fontSize:12, color:'#8A9CC0', lineHeight:1.8, margin:0 }}>{hint}</p>
              )}
            </div>
          )}

          {selected !== null && !hinting && (
            <button onClick={next} style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {qIdx+1 < TOTAL ? '次の問題 →' : '結果を見る 🏆'}
            </button>
          )}
        </>
      )}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
