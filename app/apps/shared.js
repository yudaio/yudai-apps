'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const C = {
  bg:      '#050812',
  surface: '#0C0E1F',
  card:    '#0F1126',
  border:  '#1A2040',
  borderHi:'#2A3460',
  text:    '#E2E8FF',
  muted:   '#5A6890',
  mutedHi: '#8A9CC0',
  accent:  '#6366F1',
  violet:  '#A78BFA',
  dim:     '#080A18',
};

export async function callAI(system, user, max = 700) {
  // 1. Pollinations.ai を直接クライアントから呼ぶ（ブラウザのIPを使用→レート制限を回避）
  const polMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: user },
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
          temperature: 0.8,
          seed: Math.floor(Math.random() * 9999),
        }),
      });
      if (res.status === 429 || res.status === 403) {
        // 429 = レート制限, 403 = Turnstile 認証エラー → サーバー経由にフォールバック
        if (res.status === 403) break; // Turnstile はリトライしても無意味
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch { /* network error → retry */ }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  // 2. フォールバック: サーバー経由（Anthropic/Gemini/Groq/Pollinations）
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user, max }),
    });
    const data = await res.json();
    // エラー文字列はnullに変換（呼び出し元でnullチェック可能にする）
    if (!data.text || data.text.startsWith('エラーが発生')) return null;
    return data.text;
  } catch {
    return null;
  }
}

export async function saveHistory(appId, input, result, userId = null) {
  if (supabase && userId) {
    await supabase.from('histories').insert({ user_id: userId, app_id: appId, input, result });
  }
  const key = `history_${appId}`;
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  const entry = { input, result, date: new Date().toLocaleDateString("ja-JP") };
  localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 10)));
}

export async function getHistoryRemote(appId, userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('histories').select('*')
    .eq('user_id', userId).eq('app_id', appId)
    .order('created_at', { ascending: false }).limit(10);
  return data?.map(d => ({ input: d.input, result: d.result, date: new Date(d.created_at).toLocaleDateString("ja-JP") })) ?? [];
}

export function getHistoryLocal(appId) {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(`history_${appId}`) || "[]");
}

export const getHistory = getHistoryLocal;

export async function share(title, text) {
  if (navigator.share) {
    await navigator.share({ title, text }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(text);
    alert("クリップボードにコピーしました");
  }
}

/* ── UIコンポーネント ── */

export const Btn = ({ onClick, disabled, color, children, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "12px 22px",
    background: disabled ? '#111428' : (color || 'linear-gradient(135deg, #6366F1, #A78BFA)'),
    border: disabled ? '1px solid #1E2448' : 'none',
    borderRadius: 10,
    color: disabled ? '#2A3460' : '#fff',
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit",
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(99,102,241,0.25)',
    transition: "all 0.2s",
    ...style
  }}>{children}</button>
);

export const TA = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: "100%", padding: "14px 16px",
      background: "#080A18",
      border: "1px solid #1E2448",
      borderRadius: 12,
      color: "#E2E8FF",
      fontSize: 14, resize: "vertical", fontFamily: "inherit",
      lineHeight: 1.8, boxSizing: "border-box", outline: "none",
    }}
    onFocus={e => { e.target.style.borderColor = '#6366F155'; e.target.style.boxShadow = '0 0 0 3px #6366F110'; }}
    onBlur={e => { e.target.style.borderColor = '#1E2448'; e.target.style.boxShadow = 'none'; }}
  />
);

export const ResultCard = ({ text, onShare, children }) => (
  <div style={{
    marginTop: 16,
    background: "linear-gradient(135deg, #0C0E22, #080A18)",
    borderRadius: 14, border: "1px solid #1E2448", overflow: "hidden",
  }}>
    <div style={{ padding: 20, color: "#E2E8FF", fontSize: 14, lineHeight: 2, whiteSpace: "pre-wrap" }}>
      {text}{children}
    </div>
    <div style={{ borderTop: "1px solid #1A2040", padding: "12px 16px", display: "flex", justifyContent: "flex-end" }}>
      <button onClick={onShare} style={{
        background: "transparent", border: "1px solid #1E2448", borderRadius: 8,
        color: "#5A6890", fontSize: 12, padding: "7px 16px",
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F150'; e.currentTarget.style.color = '#A78BFA'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2448'; e.currentTarget.style.color = '#5A6890'; }}
      >シェア / コピー</button>
    </div>
  </div>
);

export const HistoryPanel = ({ items, onSelect }) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1A2040" }}>
      <div style={{ color: "#3A4870", fontSize: 11, letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
        履歴
      </div>
      {items.map((item, i) => (
        <div key={i} onClick={() => onSelect(item)} style={{
          padding: "10px 14px",
          background: "#0A0C1E", border: "1px solid #1A2040",
          borderRadius: 10, marginBottom: 6, cursor: "pointer",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F140'; e.currentTarget.style.background = '#0C0F26'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2040'; e.currentTarget.style.background = '#0A0C1E'; }}
        >
          <div style={{ color: "#3A4870", fontSize: 10, marginBottom: 3 }}>{item.date}</div>
          <div style={{ color: "#8A9CC0", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input}</div>
        </div>
      ))}
    </div>
  );
};

export const Loading = ({ message = 'AIが考えています…' }) => (
  <div style={{ textAlign: "center", padding: "32px 16px" }}>
    <div style={{ display: "inline-flex", gap: 8, marginBottom: 12 }}>
      {[0, 1, 2].map(n => (
        <div key={n} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: `linear-gradient(135deg,#6366F1,#A78BFA)`,
          animation: `bounce 1.4s ease-in-out ${n * 0.22}s infinite`,
          boxShadow: '0 0 8px #6366F150',
        }} />
      ))}
    </div>
    <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.15)}}`}</style>
    <div style={{ color: "#6A78A8", fontSize: 13, fontWeight: 500 }}>{message}</div>
    <div style={{ color: "#2A3460", fontSize: 11, marginTop: 6 }}>通常10〜20秒かかります</div>
  </div>
);

/* ── AIエラーカード ── */
export const AIErrorCard = ({ onRetry, color = '#6366F1', message = 'AI接続エラー' }) => {
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);
  const handleRetry = () => { setCountdown(5); if (onRetry) onRetry(); };
  return (
    <div style={{ marginTop:16, padding:'16px 20px', background:'#0A0812', border:'1px solid #FF444430', borderRadius:14, textAlign:'center' }}>
      <div style={{ fontSize:28, marginBottom:8 }}>⚠️</div>
      <div style={{ color:'#FCA5A5', fontSize:14, fontWeight:700, marginBottom:6 }}>{message}</div>
      <div style={{ color:'#6A4848', fontSize:12, lineHeight:1.7, marginBottom:14 }}>
        AIサービスに一時的に接続できません。<br/>
        しばらく経ってから再度お試しください。
      </div>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={countdown > 0}
          style={{ padding:'9px 20px', background: countdown > 0 ? '#111428' : `${color}20`, border:`1px solid ${countdown > 0 ? '#1E2448' : color+'50'}`, borderRadius:10, color: countdown > 0 ? '#3A4870' : color, fontSize:13, fontWeight:600, cursor: countdown > 0 ? 'default' : 'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
          {countdown > 0 ? `${countdown}秒後に再試行...` : '🔄 もう一度試す'}
        </button>
      )}
    </div>
  );
};

/* ── アプリ使い方ガイド ── */
export const QuickGuide = ({ steps, color = '#6366F1', collapsed = true }) => {
  const [open, setOpen] = useState(!collapsed);
  return (
    <div style={{ marginBottom:20, border:`1px solid ${color}30`, borderRadius:14, overflow:'hidden', background:`${color}08` }}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:'inherit' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>📖</span>
          <span style={{ color:C.mutedHi, fontSize:13, fontWeight:600 }}>使い方ガイド</span>
        </div>
        <span style={{ color:C.muted, fontSize:16, transform:open?'rotate(90deg)':'none', transition:'transform 0.2s' }}>›</span>
      </button>
      {open && (
        <div style={{ padding:'4px 18px 16px', borderTop:`1px solid ${color}20` }}>
          {steps.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:12, marginBottom: i<steps.length-1?10:0, paddingTop:10 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', color, fontSize:11, fontWeight:900, flexShrink:0, marginTop:1 }}>{i+1}</div>
              <div style={{ color:C.muted, fontSize:13, lineHeight:1.65 }}>{s}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BackBtn = () => (
  <a href="/" style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    color: "#3A4870", fontSize: 13, marginBottom: 20,
    textDecoration: "none", transition: "color 0.15s",
  }}
    onMouseEnter={e => e.currentTarget.style.color = '#8A9CC0'}
    onMouseLeave={e => e.currentTarget.style.color = '#3A4870'}
  >← 一覧に戻る</a>
);

export const Label = ({ children }) => (
  <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>{children}</div>
);

export const PageHeader = ({ icon, title, sub, color }) => (
  <div style={{ marginBottom: 24 }}>
    <BackBtn />
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: (color || '#6366F1') + '18',
        border: `1px solid ${(color || '#6366F1')}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{icon}</div>
      <div>
        <h2 style={{ color: "#E2E8FF", margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
        <p style={{ color: "#5A6890", margin: 0, fontSize: 13 }}>{sub}</p>
      </div>
    </div>
    <div style={{ height: 1, background: `linear-gradient(90deg, ${(color || '#6366F1')}40, transparent)`, marginTop: 14 }} />
  </div>
);

/* ── AppHero（Canva風フルブリードヒーロー） ── */
export const AppHero = ({ icon, title, sub, grad, badge, children }) => (
  <div style={{
    background: grad || 'linear-gradient(135deg,#4C1D95,#6366F1)',
    padding: '56px 28px 48px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    margin: '-16px -16px 32px -16px',
  }}>
    <a href="/" style={{
      position: 'absolute', top: 18, left: 18,
      color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none',
      background: 'rgba(0,0,0,0.18)', padding: '6px 14px', borderRadius: 20,
      backdropFilter: 'blur(4px)',
    }}>← 戻る</a>
    {/* 装飾オーブ */}
    <div style={{ position:'absolute', top:-80, right:-80, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(0,0,0,0.12)', pointerEvents:'none' }} />
    <div style={{ position:'relative' }}>
      <div style={{ fontSize:56, marginBottom:10, lineHeight:1, filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>{icon}</div>
      <h1 style={{
        color:'#fff', fontSize:'clamp(40px,8vw,64px)',
        fontWeight:900, margin:'0 0 14px',
        letterSpacing:'-0.03em', lineHeight:1.05,
        textShadow:'0 2px 24px rgba(0,0,0,0.25)',
      }}>{title}</h1>
      <p style={{
        color:'rgba(255,255,255,0.78)', fontSize:16,
        margin:'0 auto', lineHeight:1.75,
        maxWidth:380,
      }}>{sub}</p>
      {badge && (
        <div style={{ marginTop:18, display:'inline-flex', alignItems:'center', gap:8, padding:'7px 18px', background:'rgba(255,255,255,0.15)', borderRadius:20, backdropFilter:'blur(4px)', color:'#fff', fontSize:13, fontWeight:600 }}>
          {badge}
        </div>
      )}
      {children}
    </div>
  </div>
);

/* ── HeroBtn（ヒーロー下の大CTAボタン） ── */
export const HeroBtn = ({ onClick, disabled, grad, children, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:'100%', padding:'18px',
    background: disabled ? '#111428' : (grad || 'linear-gradient(135deg,#6366F1,#A78BFA)'),
    border: disabled ? '1px solid #1E2448' : 'none',
    borderRadius:14, color: disabled ? '#2A3460' : '#fff',
    fontSize:17, fontWeight:800, cursor: disabled ? 'default' : 'pointer',
    fontFamily:'inherit',
    boxShadow: disabled ? 'none' : '0 8px 32px rgba(0,0,0,0.3)',
    transition:'all 0.2s',
    letterSpacing: '-0.01em',
    ...style,
  }}>{children}</button>
);

/* ── InputCard（ホワイト寄りの入力カード） ── */
export const InputCard = ({ children, style = {} }) => (
  <div style={{
    background:'#0D0F28',
    border:'1px solid #252A52',
    borderRadius:16, padding:'20px',
    marginBottom:16,
    ...style,
  }}>{children}</div>
);
