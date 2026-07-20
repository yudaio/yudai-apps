'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const MODES = [
  { id: 'text',  icon: '📝', label: '文章',       desc: '日本語の誤字・脱字・不自然な表現を検出して修正案を提示' },
  { id: 'code',  icon: '💻', label: 'コード',     desc: 'バグ・構文エラー・改善点を検出して修正コードを生成' },
  { id: 'error', icon: '⚠️', label: 'エラー解析', desc: 'エラーメッセージの原因を解説してステップ別解決策を提示' },
];

const EXAMPLES = {
  text:  '彼女はとても重要の仕事をしています。\n昨日、私は彼の友達に会いました。\nこの問題をについて話し合いましょう。\n私たちは毎朝、朝食を食べます。',
  code:  'function calcTotal(items) {\n  let total = 0\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price\n  }\n  reutrn total\n}\n\nconst result = calcTotal([{price: 100}, {price: 200}])\nconsole.log(\'合計:\' + result',
  error: 'TypeError: Cannot read properties of undefined (reading \'map\')\n    at ProductList.jsx:18:25\n    at renderWithHooks (react-dom.development.js:14985:18)\n    at mountIndeterminateComponent (react-dom.development.js:17811:13)',
};

const COLOR = '#EF4444';

export default function ErrorCheck() {
  const [mode, setMode]       = useState('text');
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('errcheck');

  const analyze = async () => {
    if (!input.trim() || loading || !check()) return;
    setLoading(true);
    setResult(null);

    let system, prompt;
    if (mode === 'text') {
      system = 'あなたは日本語校正の専門家AIです。文章の誤字・脱字・文法エラー・助詞の誤り・不自然な表現を詳細に検出し、具体的な修正案を提供します。';
      prompt =
        `以下の日本語文章をチェックしてください:\n\n${input}\n\n` +
        `以下の形式で回答:\n` +
        `【検出されたエラー】\n（番号付きで各エラー・修正前→修正後・理由を説明）\n\n` +
        `【修正後の文章】\n（全エラーを修正した完全な文章）\n\n` +
        `【チェックサマリー】\n（エラー総数と総評を1〜2文で）`;
    } else if (mode === 'code') {
      system = 'あなたはシニアソフトウェアエンジニアAIです。コードのバグ・構文エラー・論理エラー・パフォーマンス問題を検出し、修正コードと解説を提供します。';
      prompt =
        `以下のコードをチェックしてください:\n\n\`\`\`\n${input}\n\`\`\`\n\n` +
        `以下の形式で回答:\n` +
        `【検出されたエラー・問題点】\n（番号付きで各問題・原因・リスクを説明）\n\n` +
        `【修正後のコード】\n（全問題を修正した完全なコード）\n\n` +
        `【改善アドバイス】\n（さらに品質を上げるための提案1〜3点）`;
    } else {
      system = 'あなたはシステムエラーの診断専門家AIです。エラーメッセージを分析し、原因と解決手順を分かりやすい日本語で説明します。';
      prompt =
        `以下のエラーメッセージを解析してください:\n\n${input}\n\n` +
        `以下の形式で回答:\n` +
        `【エラーの種類と原因】\n（エラーが何を意味するか分かりやすく説明）\n\n` +
        `【解決手順】\n（ステップバイステップの具体的な解決方法）\n\n` +
        `【予防策】\n（再発を防ぐためのベストプラクティス）`;
    }

    try {
      const res = await callAI(system, prompt, 1000);
      setResult(res || 'チェックに失敗しました。');
      increment();
    } catch {
      setResult('AIに接続できませんでした。しばらく経ってから再試行してください。');
    }
    setLoading(false);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => { setInput(''); setResult(null); };

  const isCode = mode === 'code' || mode === 'error';

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', paddingBottom: 48 }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.15)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E2E8FF', margin: '0 0 8px', letterSpacing: '-0.02em' }}>AIエラーチェッカー</h1>
        <p style={{ fontSize: 13, color: '#5A6890', margin: 0 }}>文章・コード・エラーメッセージをAIが自動チェック</p>
      </div>
      <UsageBadge remaining={remaining} premium={premium} />

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(12,10,30,0.5)', borderRadius: 12, padding: 4 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null); }} style={{
            flex: 1, padding: '9px 6px', border: 'none', borderRadius: 9,
            background: mode === m.id ? 'rgba(239,68,68,0.2)' : 'transparent',
            color: mode === m.id ? '#FCA5A5' : '#5A6890',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>{m.icon} {m.label}</button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: '#3A4870', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
        {MODES.find(m => m.id === mode)?.desc}
      </div>

      {/* Input */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#4A5880', fontWeight: 500 }}>
            {mode === 'text' ? '📝 チェックしたい文章' : mode === 'code' ? '💻 チェックしたいコード' : '⚠️ エラーメッセージ'}
          </div>
          <button onClick={() => setInput(EXAMPLES[mode])} style={{
            fontSize: 11, color: '#3A4870', background: 'transparent',
            border: '1px solid #1E2448', borderRadius: 6,
            padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit',
          }}>サンプル</button>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            mode === 'text' ? 'チェックしたい日本語文章を貼り付けてください...' :
            mode === 'code' ? 'チェックしたいコードを貼り付けてください...' :
            '解析したいエラーメッセージを貼り付けてください...'
          }
          rows={7}
          style={{
            width: '100%', padding: '14px 16px',
            background: '#080A18', border: '1px solid #1E2448', borderRadius: 12,
            color: '#E2E8FF', fontSize: 13, resize: 'vertical',
            fontFamily: isCode ? 'monospace' : 'inherit',
            lineHeight: 1.8, boxSizing: 'border-box', outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = '#EF444455'; e.target.style.boxShadow = '0 0 0 3px #EF444410'; }}
          onBlur={e => { e.target.style.borderColor = '#1E2448'; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ fontSize: 11, color: '#2A3460', textAlign: 'right', marginTop: 4 }}>{input.length} 文字</div>
      </div>

      {/* Analyze Button */}
      <button onClick={analyze} disabled={!input.trim() || loading} style={{
        width: '100%', padding: '14px', marginBottom: 20,
        background: !input.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#DC2626,#EF4444)',
        border: 'none', borderRadius: 12,
        color: !input.trim() || loading ? '#3A4870' : '#fff',
        fontSize: 15, fontWeight: 700, cursor: !input.trim() || loading ? 'default' : 'pointer',
        fontFamily: 'inherit',
        boxShadow: input.trim() && !loading ? '0 4px 20px rgba(239,68,68,0.3)' : 'none',
        transition: 'all 0.2s',
      }}>
        {loading ? '🔍 チェック中...' : '🔍 自動チェック開始'}
      </button>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ display: 'inline-flex', gap: 8, marginBottom: 12 }}>
            {[0, 1, 2].map(n => (
              <div key={n} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'linear-gradient(135deg,#DC2626,#EF4444)',
                animation: `bounce 1.4s ease-in-out ${n * 0.22}s infinite`,
              }} />
            ))}
          </div>
          <div style={{ color: '#6A78A8', fontSize: 13 }}>AIがエラーを検出中...</div>
          <div style={{ color: '#2A3460', fontSize: 11, marginTop: 6 }}>通常10〜20秒かかります</div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #0C0E22, #080A18)',
            borderRadius: 14, border: '1px solid #1E2448', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1A2040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#FCA5A5', fontSize: 12, fontWeight: 700 }}>🔍 チェック結果</span>
              <button onClick={copyResult} style={{
                background: 'transparent', border: '1px solid #1E2448', borderRadius: 8,
                color: copied ? '#34D399' : '#5A6890', fontSize: 11, padding: '5px 12px',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}>{copied ? '✓ コピー済み' : 'コピー'}</button>
            </div>
            <div style={{ padding: '20px', color: '#E2E8FF', fontSize: 13, lineHeight: 2, fontFamily: isCode ? 'monospace' : 'inherit' }}>
              {result.split('\n').map((line, i) => (
                <p key={i} style={{
                  margin: '0 0 4px',
                  fontSize: line.startsWith('【') ? 11 : 13,
                  fontWeight: line.startsWith('【') ? 700 : 400,
                  color: line.startsWith('【') ? '#FCA5A5' : '#C0C8E0',
                  whiteSpace: 'pre-wrap',
                }}>{line}</p>
              ))}
            </div>
          </div>
          <button onClick={reset} style={{
            width: '100%', padding: '13px', marginTop: 12,
            background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12,
            color: '#FCA5A5', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔄 新しくチェックする</button>
        </div>
      )}

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
