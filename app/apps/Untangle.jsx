'use client';
import { useState, useRef, useEffect } from 'react';
import { PaywallModal, usePremium } from './Paywall';
import ApiKeySetup, { useApiKey } from './ApiKeySetup';

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#7C5CFC",
  accentDim: "rgba(124,92,252,0.12)", accentBorder: "rgba(124,92,252,0.3)",
  gold: "#F5C518", goldDim: "rgba(245,197,24,0.10)",
};

function buildSystem(idol) {
  return `あなたはUntangleというAIカウンセラーです。ユーザーが自分の「足かせ」（人生の行き詰まりの根本原因）に気づくための対話を行います。
${idol ? `\nユーザーの憧れの人物：「${idol}」。対話の中で自然にこの人物の視点・言葉・姿勢を取り入れてください。` : ''}

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
}

function buildRoadmapSystem(idol) {
  return `ユーザーの足かせの正体と会話履歴から、具体的な90日ロードマップを生成してください。
${idol ? `\nユーザーの憧れの人物は「${idol}」です。ロードマップに「${idol}ならどうするか」という視点を自然に織り込んでください。` : ''}

【フォーマット】
## あなたの足かせ
（足かせの正体を2〜3文で詳しく説明）

## 根っこにあるもの
（幼少期・親との関係から来るパターンを説明）
${idol ? `\n## ${idol}からのメッセージ\n（この人物ならあなたにこう言うだろう、という言葉を1〜2文。その人らしい口調で）\n` : ''}
## 90日ロードマップ

**DAY 1-30：気づきの定着**
- 具体的なアクション3つ

**DAY 31-60：行動の変化**
- 具体的なアクション3つ

**DAY 61-90：新しい自分**
- 具体的なアクション3つ

## 今日からできる最小アクション
- アクション1
- アクション2
- アクション3

400文字以内で簡潔に。`;
}

async function callAI(messages, system, max = 400, provider = 'gemini', key = '') {
  const keyParam = provider === 'gemini' ? { geminiKey: key } : { claudeKey: key };
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max, ...(key && keyParam) }),
  });
  const data = await res.json();
  return data.text;
}

function useWins() {
  const [wins, setWins] = useState(() => {
    try { return JSON.parse(localStorage.getItem('untangle_wins') || '[]'); } catch { return []; }
  });
  const addWins = (items) => {
    const newWins = items.map(text => ({
      text, date: new Date().toLocaleDateString('ja-JP'), done: false
    }));
    const updated = [...newWins, ...wins].slice(0, 15);
    setWins(updated);
    try { localStorage.setItem('untangle_wins', JSON.stringify(updated)); } catch {}
  };
  const toggleWin = (i) => {
    const updated = wins.map((w, idx) => idx === i ? { ...w, done: !w.done } : w);
    setWins(updated);
    try { localStorage.setItem('untangle_wins', JSON.stringify(updated)); } catch {}
  };
  const doneCount = wins.filter(w => w.done).length;
  return { wins, addWins, toggleWin, doneCount };
}

export default function Untangle() {
  const [phase, setPhase] = useState('landing');
  const [idol, setIdol] = useState(() => {
    try { return localStorage.getItem('untangle_idol') || ''; } catch { return ''; }
  });
  const [idolInput, setIdolInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { premium } = usePremium();
  const { wins, addWins, toggleWin, doneCount } = useWins();
  const apiKeyStore = useApiKey();
  const [hasKey, setHasKey] = useState(() => apiKeyStore.hasKey());
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, reveal]);

  const saveIdol = (name) => {
    setIdol(name);
    try { localStorage.setItem('untangle_idol', name); } catch {}
  };

  const startChat = async (idolName) => {
    setPhase('chat');
    setLoading(true);
    const opening = await callAI(
      [{ role: 'user', content: 'はじめます' }],
      buildSystem(idolName),
      400,
      apiKeyStore.getProvider(),
      apiKeyStore.getKey()
    );
    setMessages([
      { role: 'user', content: 'はじめます' },
      { role: 'assistant', content: opening },
    ]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleIdolSubmit = () => {
    const name = idolInput.trim();
    saveIdol(name);
    startChat(name);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const reply = await callAI(newMessages, buildSystem(idol), 400, apiKeyStore.getKey());
    const revealMatch = reply.match(/\[REVEAL:\s*([\s\S]+?)\]/);
    let displayReply = reply;

    if (revealMatch) {
      setReveal(revealMatch[1].trim());
      displayReply = reply.replace(/\[REVEAL:[\s\S]+?\]/, '').trim();
      setPhase('reveal');
    }

    setMessages(prev => [...prev, { role: 'assistant', content: displayReply }]);
    setLoading(false);
  };

  const unlockReveal = async () => {
    if (!premium) { setShowPaywall(true); return; }
    await generateRoadmap();
  };

  const generateRoadmap = async () => {
    setPhase('roadmap');
    setLoading(true);
    const summary = messages.map(m =>
      `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`
    ).join('\n');
    const result = await callAI(
      [{ role: 'user', content: `足かせの正体：${reveal}\n\n会話履歴：\n${summary}` }],
      buildRoadmapSystem(idol),
      900,
      apiKeyStore.getProvider(),
      apiKeyStore.getKey()
    );
    setRoadmap(result);
    // 最小アクションを自動でwinsリストに追加
    const actionSection = result.match(/最小アクション([\s\S]*?)(?=##|$)/);
    if (actionSection) {
      const items = [...actionSection[1].matchAll(/[-•]\s*(.+)/g)].map(m => m[1].trim()).filter(Boolean);
      if (items.length > 0) addWins(items);
    }
    setLoading(false);
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    if (premium) generateRoadmap();
  };

  const resetAll = () => {
    setPhase('landing');
    setMessages([]);
    setReveal(null);
    setRoadmap(null);
  };

  // ── API KEY SETUP ─────────────────────────────────────────────
  if (!hasKey) return (
    <ApiKeySetup onDone={() => setHasKey(true)} />
  );

  // ── LANDING ──────────────────────────────────────────────────
  if (phase === 'landing') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🧩</div>
      <h1 style={{ color: C.text, fontSize: 30, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
        Untangle
      </h1>
      <p style={{ color: C.accent, fontSize: 11, letterSpacing: 3, marginBottom: 28, textTransform: 'uppercase' }}>
        The thing holding you back has a name
      </p>

      <div style={{
        background: C.accentDim, border: `1px solid ${C.accentBorder}`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'left'
      }}>
        <p style={{ color: C.text, fontSize: 14, lineHeight: 2, margin: 0 }}>
          恋愛・仕事・人間関係——<br />
          どこに行っても「これじゃない」と感じる。<br />
          頭から離れないあの後悔。動けない自分。<br /><br />
          それには、名前がある。
        </p>
      </div>

      {/* 小さな勝利ストリーク */}
      {wins.length > 0 && (
        <div style={{
          background: C.goldDim, border: '1px solid rgba(245,197,24,0.25)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: C.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              🔥 小さな勝利
            </span>
            <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>
              {doneCount}/{wins.length} 達成
            </span>
          </div>
          {wins.slice(0, 3).map((w, i) => (
            <div key={i} onClick={() => toggleWin(i)} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: 14 }}>{w.done ? '✅' : '⬜'}</span>
              <span style={{
                color: w.done ? C.muted : C.text, fontSize: 12,
                textDecoration: w.done ? 'line-through' : 'none'
              }}>{w.text}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setPhase('idol')} style={{
        width: '100%', padding: '16px', background: C.accent,
        border: 'none', borderRadius: 12, color: '#fff',
        fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 8px 32px rgba(124,92,252,0.35)',
      }}>
        足かせの正体を探る
      </button>
      <p style={{ color: C.muted, fontSize: 11, marginTop: 14 }}>
        診断まで無料 · 正体の開示＋ロードマップは有料
      </p>
      <button onClick={() => { apiKeyStore.clear(); setHasKey(false); }} style={{
        background: 'none', border: 'none', color: C.muted, fontSize: 11,
        cursor: 'pointer', marginTop: 8, textDecoration: 'underline'
      }}>
        🔑 APIキーを変更
      </button>
    </div>
  );

  // ── IDOL SETUP ────────────────────────────────────────────────
  if (phase === 'idol') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>🪞</div>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
          あなたの憧れは誰ですか？
        </h2>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, margin: 0 }}>
          アイドル、歴史上の人物、漫画のキャラ、尊敬する人——<br />
          その人の視点があなたの中に宿ります
        </p>
      </div>

      <input
        value={idolInput}
        onChange={e => setIdolInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && idolInput.trim() && handleIdolSubmit()}
        placeholder="例：乃木坂46、スティーブ・ジョブズ、鬼滅の炭治郎..."
        autoFocus
        style={{
          width: '100%', padding: '14px 16px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 12,
          color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
          boxSizing: 'border-box', marginBottom: 12
        }}
      />

      <button
        onClick={handleIdolSubmit}
        disabled={!idolInput.trim()}
        style={{
          width: '100%', padding: '14px',
          background: idolInput.trim() ? C.accent : C.card,
          border: 'none', borderRadius: 12,
          color: idolInput.trim() ? '#fff' : C.muted,
          fontSize: 15, fontWeight: 700,
          cursor: idolInput.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit', marginBottom: 10, transition: 'all 0.15s'
        }}>
        この人と一緒に始める ✨
      </button>
      <button onClick={() => startChat('')} style={{
        width: '100%', padding: '10px', background: 'transparent',
        border: `1px solid ${C.border}`, borderRadius: 12,
        color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
      }}>
        スキップして始める
      </button>

      {/* 仕組みの説明 */}
      <div style={{ marginTop: 32 }}>
        {[
          ['🪞', 'ロールモデルの視点', 'その人ならどうするか——という声があなたに宿ります'],
          ['💬', '内的対話の置き換え', '「できない自分」の声を憧れの人の言葉に変えます'],
          ['📈', '小さな勝利の積み重ね', '毎日のアクションにチェックを入れてドーパミンを積みます'],
          ['👥', '見られている感覚', '憧れの人が見ているという意識が行動を変えます'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{
            display: 'flex', gap: 14, marginBottom: 12,
            padding: '12px 14px', background: C.card, borderRadius: 10,
            border: `1px solid ${C.border}`
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{title}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ROADMAP ───────────────────────────────────────────────────
  if (phase === 'roadmap') return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔓</div>
        <h2 style={{ color: C.text, fontSize: 20, margin: '0 0 6px', fontWeight: 700 }}>
          足かせ診断 & ロードマップ
        </h2>
        {idol && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: C.gold, fontSize: 12, marginTop: 4,
            background: C.goldDim, padding: '4px 12px', borderRadius: 20,
            border: '1px solid rgba(245,197,24,0.25)'
          }}>
            🪞 {idol}の視点
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>生成中...</div>
      ) : (
        <>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px', color: C.text,
            fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 16
          }}>
            {roadmap}
          </div>

          {/* 小さな勝利チェックリスト */}
          {wins.length > 0 && (
            <div style={{
              background: C.goldDim, border: '1px solid rgba(245,197,24,0.25)',
              borderRadius: 12, padding: '16px', marginBottom: 16
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <span style={{ color: C.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  🔥 小さな勝利リスト
                </span>
                <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>
                  {doneCount}/{wins.length} 達成
                </span>
              </div>
              {wins.map((w, i) => (
                <div key={i} onClick={() => toggleWin(i)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
                  cursor: 'pointer', padding: '8px', borderRadius: 8,
                  background: w.done ? 'rgba(245,197,24,0.08)' : 'transparent',
                  transition: 'background 0.15s'
                }}>
                  <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>
                    {w.done ? '✅' : '⬜'}
                  </span>
                  <div>
                    <div style={{
                      color: w.done ? C.muted : C.text, fontSize: 13,
                      textDecoration: w.done ? 'line-through' : 'none'
                    }}>{w.text}</div>
                    <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{w.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button onClick={resetAll} style={{
        width: '100%', marginTop: 8, padding: '12px',
        background: 'transparent', border: `1px solid ${C.border}`,
        borderRadius: 10, color: C.muted, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit'
      }}>
        もう一度診断する
      </button>
    </div>
  );

  // ── CHAT ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        paddingBottom: 16, borderBottom: `1px solid ${C.border}`
      }}>
        <span style={{ fontSize: 20 }}>🧩</span>
        <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Untangle</span>
        {idol && (
          <span style={{
            color: C.gold, fontSize: 11, background: C.goldDim,
            padding: '2px 10px', borderRadius: 20,
            border: '1px solid rgba(245,197,24,0.25)'
          }}>
            🪞 {idol}
          </span>
        )}
        <span style={{
          color: apiKeyStore.getProvider() === 'gemini' ? '#4285F4' : '#C07B4A',
          fontSize: 10, background: apiKeyStore.getProvider() === 'gemini' ? 'rgba(66,133,244,0.12)' : 'rgba(192,123,74,0.12)',
          padding: '2px 8px', borderRadius: 20,
        }}>
          {apiKeyStore.getProvider() === 'gemini' ? '✨ Gemini' : '🧠 Claude'}
        </span>
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
        <div style={{
          display: 'flex', gap: 8, marginTop: 16, position: 'sticky', bottom: 0,
          background: C.bg, paddingTop: 12
        }}>
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
    </div>
  );
}
