'use client';
import { useState, useRef, useEffect } from 'react';
import { PaywallModal, usePremium, useGate, UsageBadge } from './Paywall';

const SYSTEM = `あなたはUntangleというAIカウンセラーです。ユーザーが自分の「足かせ」（人生の行き詰まりの根本原因）に気づくための対話を行います。

【対話の構造】
STEP1: 行き詰まりを聞く（恋愛・仕事・人間関係・自己評価など複数あってよい）
STEP2: どんな形で現れるか聞く（頭から離れない・動けない・繰り返すパターンなど）
STEP3: 幼少期・親との関係を探る（ロールモデルの有無・承認された経験の有無）
STEP4: 恋愛・仕事・人間関係に共通するパターンを特定する
STEP5: 根っこが特定できたら [REVEAL: 足かせの正体を一文で] を返答末尾に含める

【厳守ルール】
- 返答は120文字以内（短く鋭く）
- 1回に質問は1つだけ
- 最低6往復してから診断する（早すぎる診断は禁止）
- 診断前は絶対に [REVEAL:...] を使わない
- 共感→深掘り→気づきの順で進める
- 日本語のみ
- [REVEAL:...] のフォーマットを必ず守る`;

const ROADMAP_SYSTEM = `ユーザーの足かせの正体と会話履歴から、具体的な90日ロードマップを生成してください。

【フォーマット】
## あなたの足かせ
（足かせの正体を2〜3文で詳しく説明）

## 根っこにあるもの
（幼少期・親との関係から来るパターンを説明）

## 90日ロードマップ

**DAY 1-30：気づきの定着**
- 具体的なアクション3つ

**DAY 31-60：行動の変化**
- 具体的なアクション3つ

**DAY 61-90：新しい自分**
- 具体的なアクション3つ

## 今日からできること
（明日すぐできる最小アクション1つ）

300文字以内で簡潔に。`;

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#7C5CFC",
  accentDim: "rgba(124,92,252,0.12)", accentBorder: "rgba(124,92,252,0.3)",
};

async function callAI(messages, system, max = 400) {
  // Pollinations をクライアントから直接呼ぶ（ブラウザIP使用）
  const polMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages,
  ];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: polMessages,
          max_tokens: max,
          temperature: 0.85,
          seed: Math.floor(Math.random() * 9999),
        }),
      });
      if (res.status === 403) break; // Turnstile ブロック → すぐフォールバック
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch { /* retry */ }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  // フォールバック: サーバー経由
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, max }),
    });
    const data = await res.json();
    if (!data.text || data.text.startsWith('エラーが発生')) return null;
    return data.text;
  } catch {
    return null;
  }
}

export default function Untangle() {
  const [phase, setPhase] = useState('landing'); // landing | chat | reveal | roadmap
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { premium } = usePremium();
  const { remaining, blocked, check, increment, dismiss } = useGate('untangle');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, reveal]);

  const startChat = async () => {
    setPhase('chat');
    setLoading(true);
    const opening = await callAI(
      [{ role: 'user', content: 'はじめます' }],
      SYSTEM
    );
    setMessages([
      { role: 'user', content: 'はじめます' },
      { role: 'assistant', content: opening || 'ごめんなさい、今AIに接続できません。しばらく経ってから再試行してください。' },
    ]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!check()) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const reply = await callAI(newMessages, SYSTEM) || '申し訳ありません、AIに接続できません。もう一度試してください。';
    const revealMatch = reply.match(/\[REVEAL:\s*([\s\S]+?)\]/);
    let displayReply = reply;

    if (revealMatch) {
      setReveal(revealMatch[1].trim());
      displayReply = reply.replace(/\[REVEAL:[\s\S]+?\]/, '').trim();
      setPhase('reveal');
    }

    setMessages(prev => [...prev, { role: 'assistant', content: displayReply }]);
    increment();
    setLoading(false);
  };

  const unlockReveal = async () => {
    if (!premium) { setShowPaywall(true); return; }
    await generateRoadmap();
  };

  const generateRoadmap = async () => {
    setPhase('roadmap');
    setLoading(true);
    const summary = messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n');
    const result = await callAI(
      [{ role: 'user', content: `足かせの正体：${reveal}\n\n会話履歴：\n${summary}` }],
      ROADMAP_SYSTEM,
      800
    );
    setRoadmap(result || 'AI接続エラー。しばらく経ってから再試行してください。');
    setLoading(false);
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    if (premium) generateRoadmap();
  };

  // ── LANDING ──────────────────────────────────────────────────
  if (phase === 'landing') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <div style={{ fontSize: 52, marginBottom: 16 }}>🧩</div>
      <h1 style={{ color: C.text, fontSize: 30, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
        Untangle
      </h1>
      <p style={{ color: C.accent, fontSize: 11, letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' }}>
        The thing holding you back has a name
      </p>

      {/* 使い方ガイド */}
      <div style={{ textAlign:'left', background:C.accentDim, border:`1px solid ${C.accentBorder}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
        <div style={{ color:C.accent, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:12 }}>HOW IT WORKS</div>
        {[
          'AIカウンセラーが恋愛・仕事・人間関係について深掘り質問する',
          '最低6往復の対話で、行き詰まりのパターンを探っていく',
          '根っこの「足かせ」が特定されたら診断完了（ネタバレは有料）',
          'プレミアムで「足かせの正体」と90日ロードマップを解放できる',
        ].map((s,i)=>(
          <div key={i} style={{ display:'flex', gap:10, marginBottom:i<3?8:0 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:`${C.accent}25`, border:`1px solid ${C.accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.accent, fontSize:10, fontWeight:900, flexShrink:0, marginTop:1 }}>{i+1}</div>
            <div style={{ color:C.text, fontSize:12, lineHeight:1.7, opacity:0.85 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
        <p style={{ color: C.text, fontSize: 14, lineHeight: 2, margin: 0 }}>
          恋愛・仕事・人間関係——<br />
          どこに行っても「これじゃない」と感じる。<br />
          頭から離れないあの後悔。動けない自分。<br /><br />
          <strong style={{ color: C.accent }}>それには、名前がある。</strong>
        </p>
      </div>
      <button onClick={startChat} style={{
        width: '100%', padding: '16px', background: C.accent,
        border: 'none', borderRadius: 12, color: '#fff',
        fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 8px 32px rgba(124,92,252,0.35)', transition: 'opacity 0.15s'
      }}>
        足かせの正体を探る（無料）
      </button>
      <p style={{ color: C.muted, fontSize: 11, marginTop: 14 }}>
        診断まで無料 · 正体の開示＋ロードマップは有料
      </p>
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );

  // ── ROADMAP ───────────────────────────────────────────────────
  if (phase === 'roadmap') return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔓</div>
        <h2 style={{ color: C.text, fontSize: 20, margin: '0 0 6px', fontWeight: 700 }}>足かせ診断 & ロードマップ</h2>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>生成中...</div>
      ) : (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '20px', color: C.text,
          fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap'
        }}>
          {roadmap}
        </div>
      )}
      <button onClick={() => { setPhase('landing'); setMessages([]); setReveal(null); setRoadmap(null); }}
        style={{
          width: '100%', marginTop: 20, padding: '12px',
          background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 10, color: C.muted, fontSize: 13,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
        もう一度診断する
      </button>
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );

  // ── CHAT ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px' }}>
      <UsageBadge remaining={remaining} premium={premium} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 20 }}>🧩</span>
        <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Untangle</span>
        <span style={{ color: C.muted, fontSize: 11, marginLeft: 'auto' }}>
          {Math.floor(messages.length / 2)} / 10 ターン
        </span>
      </div>

      {/* Messages */}
      <div style={{ minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 14
          }}>
            <div style={{
              maxWidth: '82%', padding: '12px 16px',
              background: m.role === 'user' ? C.accent : C.card,
              border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              color: m.role === 'user' ? '#fff' : C.text,
              fontSize: 14, lineHeight: 1.75
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
            <div style={{
              padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '18px 18px 18px 4px', color: C.muted, fontSize: 13
            }}>
              考えています...
            </div>
          </div>
        )}

        {/* Reveal card */}
        {reveal && (
          <div style={{
            margin: '24px 0', background: C.card, border: `1px solid ${C.accentBorder}`,
            borderRadius: 14, overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ color: C.accent, fontSize: 12, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                診断完了
              </div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
                あなたの足かせの正体が見えました
              </div>
            </div>
            <div style={{ padding: '16px 20px', position: 'relative' }}>
              <div style={{
                color: C.text, fontSize: 15, lineHeight: 1.8,
                filter: phase === 'reveal' && !premium ? 'blur(6px)' : 'none',
                userSelect: phase === 'reveal' && !premium ? 'none' : 'auto',
                transition: 'filter 0.3s'
              }}>
                {reveal}
              </div>
              {phase === 'reveal' && !premium && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(7,9,26,0.6)', backdropFilter: 'blur(2px)',
                  borderRadius: 8
                }}>
                  <button onClick={unlockReveal} style={{
                    padding: '12px 24px', background: C.accent, border: 'none',
                    borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 20px rgba(124,92,252,0.4)'
                  }}>
                    正体を見る →
                  </button>
                </div>
              )}
            </div>
            {(premium || phase !== 'reveal') && (
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}` }}>
                <button onClick={unlockReveal} style={{
                  width: '100%', padding: '12px', background: C.accent, border: 'none',
                  borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  90日ロードマップを見る →
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {phase === 'chat' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'sticky', bottom: 0,
          background: C.bg, paddingTop: 12 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="ここに入力..."
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', background: C.card,
              border: `1px solid ${C.border}`, borderRadius: 12,
              color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none'
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            padding: '12px 18px', background: input.trim() ? C.accent : C.card,
            border: 'none', borderRadius: 12, color: input.trim() ? '#fff' : C.muted,
            fontSize: 14, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'all 0.15s'
          }}>
            送信
          </button>
        </div>
      )}

      {showPaywall && <PaywallModal onClose={handlePaywallClose} />}
      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
