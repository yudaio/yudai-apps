'use client';
import { useState } from 'react';

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#7C5CFC",
  accentDim: "rgba(124,92,252,0.12)", accentBorder: "rgba(124,92,252,0.3)",
};

const PROVIDERS = {
  gemini: {
    label: 'Gemini',
    icon: '✨',
    color: '#4285F4',
    colorDim: 'rgba(66,133,244,0.12)',
    placeholder: 'AIzaSy...',
    free: true,
    note: '無料枠: 1日1,500リクエスト',
    url: 'https://aistudio.google.com/apikey',
    urlLabel: 'aistudio.google.com/apikey',
    steps: ['aistudio.google.com/apikey を開く', '「Create API key」をクリック', 'キーをコピーして貼り付け'],
  },
  claude: {
    label: 'Claude',
    icon: '🧠',
    color: '#C07B4A',
    colorDim: 'rgba(192,123,74,0.12)',
    placeholder: 'sk-ant-...',
    free: false,
    note: '感情の深掘りが得意・従量課金',
    url: 'https://console.anthropic.com/settings/keys',
    urlLabel: 'console.anthropic.com',
    steps: ['console.anthropic.com/settings/keys を開く', '「Create Key」をクリック', 'キーをコピーして貼り付け'],
  },
};

export function useApiKey() {
  const getProvider = () => {
    try { return localStorage.getItem('ai_provider') || 'gemini'; } catch { return 'gemini'; }
  };
  const getKey = (provider) => {
    try { return localStorage.getItem(`ai_key_${provider || getProvider()}`) || ''; } catch { return ''; }
  };
  const save = (provider, key) => {
    try {
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem(`ai_key_${provider}`, key);
    } catch {}
  };
  const clear = () => {
    try {
      localStorage.removeItem('ai_provider');
      localStorage.removeItem('ai_key_gemini');
      localStorage.removeItem('ai_key_claude');
    } catch {}
  };
  const hasKey = () => !!getKey();
  return { getProvider, getKey, save, clear, hasKey };
}

export default function ApiKeySetup({ onDone }) {
  const [provider, setProvider] = useState('gemini');
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const { save } = useApiKey();
  const p = PROVIDERS[provider];

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    save(provider, trimmed);
    onDone?.();
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔑</div>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
        AIプロバイダーを選択
      </h2>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 24 }}>
        あなた自身のAPIキーを使います。<br />
        キーはこのデバイスにのみ保存されます。
      </p>

      {/* Provider tabs */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 24,
        background: C.card, borderRadius: 12, padding: 6,
        border: `1px solid ${C.border}`
      }}>
        {Object.entries(PROVIDERS).map(([id, info]) => (
          <button key={id} onClick={() => { setProvider(id); setKey(''); }} style={{
            flex: 1, padding: '12px 8px',
            background: provider === id ? info.colorDim : 'transparent',
            border: provider === id ? `1px solid ${info.color}40` : '1px solid transparent',
            borderRadius: 8,
            color: provider === id ? info.color : C.muted,
            fontSize: 14, fontWeight: provider === id ? 700 : 400,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
          }}>
            {info.icon} {info.label}
            {info.free && (
              <span style={{
                display: 'block', fontSize: 10,
                color: provider === id ? info.color : C.muted, marginTop: 2
              }}>無料枠あり</span>
            )}
          </button>
        ))}
      </div>

      {/* Info card */}
      <div style={{
        background: `${p.colorDim}`, border: `1px solid ${p.color}30`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'left'
      }}>
        <div style={{ color: p.color, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          {p.icon} {p.label} APIキーの取得
        </div>
        {p.steps.map((step, i) => (
          <div key={i} style={{ color: C.muted, fontSize: 12, marginBottom: 4, display: 'flex', gap: 8 }}>
            <span style={{ color: p.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            {i === 0 ? (
              <span>
                <a href={p.url} target="_blank" rel="noreferrer"
                  style={{ color: p.color }}>{p.urlLabel}</a> を開く
              </span>
            ) : step}
          </div>
        ))}
        <div style={{ color: C.muted, fontSize: 11, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          {p.note}
        </div>
      </div>

      {/* Key input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && key.trim() && handleSave()}
          placeholder={p.placeholder}
          autoFocus
          style={{
            width: '100%', padding: '14px 44px 14px 16px', background: C.card,
            border: `1px solid ${key.trim() ? p.color + '60' : C.border}`, borderRadius: 12,
            color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.15s'
          }}
        />
        <button onClick={() => setShow(!show)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16
        }}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>

      <button onClick={handleSave} disabled={!key.trim()} style={{
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

      <p style={{ color: C.muted, fontSize: 11, marginTop: 14, lineHeight: 1.7 }}>
        キーはブラウザのlocalStorageにのみ保存されます。
      </p>
    </div>
  );
}
