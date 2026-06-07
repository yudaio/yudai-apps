'use client';
import { useState } from 'react';

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#7C5CFC",
  accentDim: "rgba(124,92,252,0.12)", accentBorder: "rgba(124,92,252,0.3)",
};

export function useApiKey() {
  const get = () => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch { return ''; }
  };
  const set = (key) => {
    try { localStorage.setItem('gemini_api_key', key); } catch {}
  };
  const clear = () => {
    try { localStorage.removeItem('gemini_api_key'); } catch {}
  };
  return { get, set, clear };
}

export default function ApiKeySetup({ onDone }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const { set } = useApiKey();

  const save = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    set(trimmed);
    onDone?.();
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
        Gemini APIキーを設定
      </h2>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.9, marginBottom: 28 }}>
        このアプリはあなた自身のGemini APIキーを使います。<br />
        キーはこのデバイスにのみ保存され、サーバーには送信されません。
      </p>

      <div style={{
        background: C.accentDim, border: `1px solid ${C.accentBorder}`,
        borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left'
      }}>
        <div style={{ color: C.text, fontSize: 12, lineHeight: 1.8 }}>
          <strong style={{ color: C.accent }}>取得方法（無料・1分）</strong><br />
          1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
            style={{ color: C.accent }}>aistudio.google.com/apikey</a> を開く<br />
          2. 「Create API key」をクリック<br />
          3. 表示されたキーをコピーして下に貼り付け
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && key.trim() && save()}
          placeholder="AIzaSy..."
          autoFocus
          style={{
            width: '100%', padding: '14px 44px 14px 16px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 12,
            color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <button onClick={() => setShow(!show)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16
        }}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>

      <button onClick={save} disabled={!key.trim()} style={{
        width: '100%', padding: '14px',
        background: key.trim() ? C.accent : C.card,
        border: 'none', borderRadius: 12,
        color: key.trim() ? '#fff' : C.muted,
        fontSize: 15, fontWeight: 700,
        cursor: key.trim() ? 'pointer' : 'default',
        fontFamily: 'inherit', transition: 'all 0.15s',
        boxShadow: key.trim() ? '0 8px 32px rgba(124,92,252,0.35)' : 'none'
      }}>
        保存して始める
      </button>

      <p style={{ color: C.muted, fontSize: 11, marginTop: 16, lineHeight: 1.7 }}>
        キーはブラウザのlocalStorageにのみ保存されます。<br />
        Gemini 1.5 Flashは無料枠で1日1,500リクエスト使えます。
      </p>
    </div>
  );
}
