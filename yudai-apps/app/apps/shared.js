'use client';
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
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, max }),
  });
  const data = await res.json();
  return data.text;
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

export const Loading = () => (
  <div style={{ textAlign: "center", padding: "32px 0" }}>
    <div style={{ display: "inline-flex", gap: 6 }}>
      {[0, 1, 2].map(n => (
        <div key={n} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#6366F1",
          animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite`,
        }} />
      ))}
    </div>
    <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    <div style={{ color: "#3A4870", fontSize: 12, marginTop: 10 }}>処理中…</div>
  </div>
);

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
