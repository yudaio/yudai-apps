'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const CARDS = [
  { id:0,  name:'愚者',      en:'The Fool',          symbol:'🌟', meaning:'新しい始まり・無邪気さ・冒険' },
  { id:1,  name:'魔術師',    en:'The Magician',      symbol:'✨', meaning:'意志力・技能・創造力' },
  { id:2,  name:'女教皇',    en:'High Priestess',    symbol:'🌙', meaning:'直感・神秘・内なる知恵' },
  { id:3,  name:'女帝',      en:'The Empress',       symbol:'🌸', meaning:'豊かさ・母性・創造' },
  { id:4,  name:'皇帝',      en:'The Emperor',       symbol:'👑', meaning:'権威・安定・リーダーシップ' },
  { id:5,  name:'法王',      en:'The Hierophant',    symbol:'⚜️', meaning:'伝統・精神的指導・知恵' },
  { id:6,  name:'恋人',      en:'The Lovers',        symbol:'💕', meaning:'愛・選択・調和' },
  { id:7,  name:'戦車',      en:'The Chariot',       symbol:'⚡', meaning:'勝利・意志・前進' },
  { id:8,  name:'力',        en:'Strength',          symbol:'🦁', meaning:'内なる力・勇気・忍耐' },
  { id:9,  name:'隠者',      en:'The Hermit',        symbol:'🕯️', meaning:'内省・孤独・魂の探求' },
  { id:10, name:'運命の輪',  en:'Wheel of Fortune',  symbol:'🎡', meaning:'運命・転換・サイクル' },
  { id:11, name:'正義',      en:'Justice',           symbol:'⚖️', meaning:'公正・真実・因果応報' },
  { id:12, name:'吊られた男',en:'The Hanged Man',    symbol:'🔄', meaning:'犠牲・待機・視点の転換' },
  { id:13, name:'死神',      en:'Death',             symbol:'🌑', meaning:'変容・終わりと始まり・変化' },
  { id:14, name:'節制',      en:'Temperance',        symbol:'🌊', meaning:'バランス・調和・癒し' },
  { id:15, name:'悪魔',      en:'The Devil',         symbol:'🔗', meaning:'束縛・物欲・幻想' },
  { id:16, name:'塔',        en:'The Tower',         symbol:'🌩️', meaning:'突然の変化・崩壊・啓示' },
  { id:17, name:'星',        en:'The Star',          symbol:'⭐', meaning:'希望・インスピレーション・再生' },
  { id:18, name:'月',        en:'The Moon',          symbol:'🌕', meaning:'幻想・不安・潜在意識' },
  { id:19, name:'太陽',      en:'The Sun',           symbol:'☀️', meaning:'喜び・成功・活力' },
  { id:20, name:'審判',      en:'Judgement',         symbol:'🎺', meaning:'覚醒・再生・使命' },
  { id:21, name:'世界',      en:'The World',         symbol:'🌍', meaning:'完成・統合・達成' },
];

const POSITIONS = ['過去', '現在', '未来'];
const POS_DESC   = ['背景・根本原因', '現在の状況', 'これからの流れ'];

export default function Tarot() {
  const [question,  setQuestion]  = useState('');
  const [drawn,     setDrawn]     = useState(null);
  const [revealed,  setRevealed]  = useState([false, false, false]);
  const [reading,   setReading]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [tab,       setTab]       = useState('draw');
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('tarot');
  const [history,   setHistory]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('tarot-v1') || '[]'); } catch { return []; }
  });

  const drawCards = async () => {
    if (shuffling || !check()) return;
    setShuffling(true);
    await new Promise(r => setTimeout(r, 700));
    setShuffling(false);
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
    setDrawn(shuffled.slice(0, 3));
    setRevealed([false, false, false]);
    setReading('');
  };

  const revealCard = async (idx) => {
    if (!drawn || revealed[idx]) return;
    const next = revealed.map((v, i) => i === idx ? true : v);
    setRevealed(next);
    if (next.every(Boolean)) await triggerReading(drawn);
  };

  const triggerReading = async (cards) => {
    setLoading(true);
    try {
      const desc = cards.map((c, i) => `${POSITIONS[i]}「${c.name}」: ${c.meaning}`).join('\n');
      const q    = question.trim() ? `質問: ${question.trim()}\n\n` : '';
      const res  = await callAI(
        'あなたはプロのタロット占い師です。3枚のカードの流れを読み、詩的かつ深い洞察でリーディングしてください。過去→現在→未来の繋がりを大切にし、具体的なアドバイスも含めて日本語で250〜350文字。',
        `${q}引いたカード:\n${desc}`
      );
      setReading(res);
      increment();
      const entry = {
        date: new Date().toLocaleDateString('ja-JP'),
        question: question.trim() || '（フリーリーディング）',
        cards: cards.map(c => c.name),
        reading: res,
      };
      setHistory(prev => {
        const h = [entry, ...prev].slice(0, 10);
        localStorage.setItem('tarot-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setReading('リーディングの生成に失敗しました。もう一度お試しください。');
    }
    setLoading(false);
  };

  const allRevealed   = revealed.every(Boolean);
  const revealedCount = revealed.filter(Boolean).length;

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🎴</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>
          AIタロット占い
        </h1>
        <p style={{ fontSize:13, color:'#6A7AB0', margin:0 }}>
          3枚のカードが過去・現在・未来を映し出す
        </p>
      </div>
      <UsageBadge remaining={remaining} premium={premium} />

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(15,12,40,0.5)', borderRadius:12, padding:4 }}>
        {[['draw','🎴 占う'],['history','📖 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            transition:'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'draw' && (
        <>
          {/* Question */}
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="占いたいことを入力（任意）例：恋愛・仕事・転機..."
            rows={2}
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'12px 16px', marginBottom:14,
              background:'rgba(10,8,30,0.7)',
              border:'1px solid rgba(99,102,241,0.22)',
              borderRadius:12, color:'#E2E8FF', fontSize:14,
              outline:'none', resize:'none', fontFamily:'inherit',
            }}
          />

          {/* Draw button */}
          <button
            onClick={drawCards}
            disabled={shuffling}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: shuffling ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              border:'none', borderRadius:12,
              color: shuffling ? '#6A7AB0' : '#fff',
              fontSize:15, fontWeight:700, cursor: shuffling ? 'default' : 'pointer',
              fontFamily:'inherit',
              boxShadow: shuffling ? 'none' : '0 4px 24px rgba(99,102,241,0.35)',
              transition:'all 0.2s',
            }}
          >
            {shuffling ? '🃏 シャッフル中...' : drawn ? '🔄 もう一度引く' : '🃏 カードを引く'}
          </button>

          {/* Hint */}
          {drawn && !allRevealed && (
            <p style={{ textAlign:'center', color:'#5A6890', fontSize:12, margin:'-8px 0 14px' }}>
              {revealedCount === 0 ? 'カードをタップして一枚ずつ開く' : `あと${3 - revealedCount}枚開く`}
            </p>
          )}

          {/* Card spread */}
          {drawn && (
            <div style={{ display:'flex', gap:10, marginBottom:22 }}>
              {drawn.map((card, i) => (
                <div key={i} style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:'#7C5CFC', letterSpacing:2, marginBottom:6, textTransform:'uppercase', fontWeight:700 }}>
                    {POSITIONS[i]}
                  </div>
                  <div
                    onClick={() => revealCard(i)}
                    style={{
                      paddingBottom:'148%', position:'relative', borderRadius:10,
                      border: revealed[i] ? '1px solid rgba(124,92,252,0.45)' : '1px solid rgba(79,70,229,0.18)',
                      background: revealed[i]
                        ? 'linear-gradient(160deg,#1A1750 0%,#0B0828 100%)'
                        : 'linear-gradient(160deg,#221A65 0%,#140C48 100%)',
                      cursor: revealed[i] ? 'default' : 'pointer',
                      boxShadow: revealed[i] ? '0 0 28px rgba(124,92,252,0.18)' : '0 4px 16px rgba(0,0,0,0.3)',
                      transition:'all 0.35s ease',
                      overflow:'hidden',
                    }}
                  >
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:8 }}>
                      {revealed[i] ? (
                        <>
                          <div style={{ fontSize:28, marginBottom:8 }}>{card.symbol}</div>
                          <div style={{ fontSize:11, color:'#E2E8FF', fontWeight:700, textAlign:'center', lineHeight:1.3 }}>{card.name}</div>
                          <div style={{ fontSize:8, color:'#7C5CFC', marginTop:4, textAlign:'center' }}>{card.en}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:20, opacity:0.55 }}>🔮</div>
                          <div style={{ fontSize:8, color:'rgba(124,92,252,0.35)', marginTop:8 }}>タップ</div>
                        </>
                      )}
                    </div>
                  </div>
                  {revealed[i] && (
                    <div style={{ fontSize:9, color:'#4A5880', marginTop:5, lineHeight:1.4 }}>{POS_DESC[i]}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:'center', padding:'24px', background:'rgba(10,8,30,0.6)', borderRadius:14, border:'1px solid rgba(99,102,241,0.18)', marginBottom:20 }}>
              <div style={{ fontSize:22, marginBottom:8 }}>✨</div>
              <div style={{ color:'#A78BFA', fontSize:13 }}>星の声を読み解いています…</div>
            </div>
          )}

          {/* Reading */}
          {reading && (
            <div style={{ padding:'18px 20px', background:'linear-gradient(145deg,rgba(79,70,229,0.1),rgba(124,92,252,0.06))', borderRadius:14, border:'1px solid rgba(124,92,252,0.22)', marginBottom:20 }}>
              <div style={{ fontSize:11, color:'#A78BFA', marginBottom:10, fontWeight:700, letterSpacing:1 }}>✨ タロットリーディング</div>
              <p style={{ fontSize:14, color:'#D0D8F0', lineHeight:1.85, margin:0, whiteSpace:'pre-wrap' }}>{reading}</p>
            </div>
          )}

          {/* Card key (all revealed) */}
          {allRevealed && drawn && (
            <div style={{ background:'rgba(10,8,30,0.4)', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize:11, color:'#4A5880', marginBottom:10 }}>カードの意味</div>
              {drawn.map((card, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i<2 ? 8 : 0 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{card.symbol}</span>
                  <div>
                    <span style={{ fontSize:12, color:'#A78BFA', fontWeight:600 }}>{POSITIONS[i]}：{card.name}</span>
                    <span style={{ fontSize:11, color:'#4A5880', marginLeft:6 }}>{card.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🎴</div>
              <div style={{ fontSize:14 }}>まだ占い履歴がありません</div>
              <div style={{ fontSize:12, marginTop:8, color:'#2A3460' }}>「占う」タブでカードを引いてみましょう</div>
            </div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(10,8,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {h.cards.map((c, j) => (
                    <span key={j} style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(99,102,241,0.12)', color:'#8B9CF0', border:'1px solid rgba(99,102,241,0.18)' }}>{c}</span>
                  ))}
                </div>
                <span style={{ fontSize:10, color:'#2A3460', flexShrink:0, marginLeft:8 }}>{h.date}</span>
              </div>
              <div style={{ fontSize:11, color:'#4A5880', marginBottom:6 }}>Q: {h.question}</div>
              <div style={{ fontSize:12, color:'#7A8AAD', lineHeight:1.65 }}>{h.reading?.slice(0, 120)}…</div>
            </div>
          ))}
        </div>
      )}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
