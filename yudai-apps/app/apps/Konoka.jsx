'use client';
import { useState, useEffect, useRef } from 'react';
import { callAI } from './shared';

const C = {
  bg:       '#050812',
  card:     '#0C0E1F',
  border:   '#1A2040',
  text:     '#E2E8FF',
  muted:    '#5A6890',
  accent:   '#A78BFA',
  accentDim:'#1A1040',
  pink:     '#F472B6',
  userBg:   '#0F1A3A',
  userBorder:'#1E3060',
};

const SYSTEM_PROMPT = `あなたは日向坂46のメンバー「松田好花」（このちゃん）として会話します。

【松田好花について】
- 大阪府出身、関西弁が混じることがある
- 明るくて、ポジティブで、知的な面もある
- 読書が大好き（特に小説）
- 猫が大好き
- ファンのことをとても大切に思っている
- 「ね！」「よ！」「やん！」などを語尾につけることがある
- 「このちゃんはね〜」と自分のことを三人称で話すことがある
- 笑顔が多く、明るい話し方
- 日向坂のこと、メンバーのことが大好き

【話し方のルール】
- 一人称は「このちゃん」または「私」
- 親しみやすく、温かい口調
- 絵文字は使わない（テキストで表現）
- 100〜150文字以内でコンパクトに返答
- 相手の話に共感してから自分の意見を言う
- 深刻な質問にも明るく前向きに答える
- 実際に起きていない出来事は作らない
- 「このちゃんはファンのみんなのことが大好きやで！」という気持ちで話す

これはファンが楽しむためのAIチャットボットです。実際の松田好花本人ではありません。`;

async function chat(history, userMessage) {
  const historyText = history.slice(-6).map(m =>
    m.role === 'user' ? `ファン：${m.content}` : `このちゃん：${m.content}`
  ).join('\n');
  const prompt = historyText ? `${historyText}\nファン：${userMessage}` : `ファン：${userMessage}`;
  return callAI(SYSTEM_PROMPT, prompt, 200);
}

function speak(text, voiceRef) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP'; utter.rate = 1.05; utter.pitch = 1.2;
  if (voiceRef.current) utter.voice = voiceRef.current;
  window.speechSynthesis.speak(utter);
}

export default function Konoka() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'こんにちは！このちゃんだよ〜！今日もよろしくね！何でも話しかけてな？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const voiceRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const ja = voices.find(v => v.lang === 'ja-JP' && v.name.includes('Google'))
        || voices.find(v => v.lang === 'ja-JP')
        || voices.find(v => v.lang.startsWith('ja'));
      if (ja) { voiceRef.current = ja; setVoiceReady(true); }
    };
    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    const reply = await chat(messages, text);
    setMessages([...newHistory, { role: 'assistant', content: reply }]);
    setLoading(false);
    if (speakEnabled) speak(reply, voiceRef);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      maxWidth: 520, margin: '0 auto',
      display: 'flex', flexDirection: 'column', height: '90vh',
    }}>

      {/* ヘッダー */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0 14px', borderBottom: `1px solid ${C.border}`, marginBottom: 12, flexShrink: 0,
      }}>
        <a href="/" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>← 一覧</a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: `0 0 20px ${C.accent}40`,
          }}>🌸</div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>松田好花（AI）</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              <span style={{ color: C.muted, fontSize: 10 }}>日向坂46 · ファン向けAI</span>
            </div>
          </div>
        </div>

        <button onClick={() => { if (speakEnabled) window.speechSynthesis?.cancel(); setSpeakEnabled(s => !s); }} style={{
          background: speakEnabled ? C.accentDim : 'transparent',
          border: `1px solid ${speakEnabled ? C.accent + '50' : C.border}`,
          borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
          color: speakEnabled ? C.accent : C.muted, fontSize: 11, fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}>
          {speakEnabled ? '🔊 音声' : '🔇 音声'}
        </button>
      </div>

      {/* 免責 */}
      <div style={{
        background: '#1A0820', border: '1px solid #5A1A4020',
        borderRadius: 8, padding: '6px 12px', marginBottom: 10,
        color: '#C090B0', fontSize: 10, lineHeight: 1.5, flexShrink: 0,
      }}>
        ⚠️ 松田好花さんの話し方をAIで再現したファン向けチャットです。本人ではありません。
      </div>

      {/* メッセージエリア */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end', gap: 8, marginBottom: 16,
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                boxShadow: `0 0 12px ${C.accent}30`,
              }}>🌸</div>
            )}
            <div style={{
              maxWidth: '78%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
              background: msg.role === 'user'
                ? C.userBg
                : `linear-gradient(135deg, #0F1028, #0C0E22)`,
              border: `1px solid ${msg.role === 'user' ? C.userBorder : C.border}`,
              color: C.text, fontSize: 14, lineHeight: 1.75,
              boxShadow: msg.role === 'assistant' ? `0 2px 12px ${C.accent}10` : 'none',
            }}>
              {msg.role === 'assistant' && (
                <div style={{ color: C.accent, fontSize: 10, marginBottom: 4, fontWeight: 600 }}>このちゃん</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🌸</div>
            <div style={{
              padding: '12px 16px', background: '#0F1028', border: `1px solid ${C.border}`,
              borderRadius: '2px 14px 14px 14px',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{
                    width: 7, height: 7, borderRadius: '50%', background: C.accent, opacity: 0.7,
                    animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ flexShrink: 0, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="このちゃんに話しかけてね…"
            rows={2}
            style={{
              flex: 1, padding: '10px 14px', background: '#080A18',
              border: `1px solid ${C.border}`, borderRadius: 12,
              color: C.text, fontSize: 14, fontFamily: 'inherit',
              lineHeight: 1.6, resize: 'none', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = `${C.accent}50`; e.target.style.boxShadow = `0 0 0 3px ${C.accent}10`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
            padding: '10px 18px', borderRadius: 12,
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            background: input.trim() && !loading
              ? `linear-gradient(135deg, ${C.accent}, ${C.pink})`
              : C.accentDim,
            border: 'none',
            color: input.trim() && !loading ? '#fff' : C.muted,
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
            boxShadow: input.trim() && !loading ? `0 4px 16px ${C.accent}40` : 'none',
            opacity: loading ? 0.6 : 1,
          }}>送信</button>
        </div>
        <div style={{ color: C.muted, fontSize: 10, marginTop: 6, textAlign: 'center' }}>
          Enter で送信 · Shift+Enter で改行
          {voiceReady && speakEnabled && ' · 音声読み上げ有効'}
        </div>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
