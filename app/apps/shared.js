'use client';
import { supabase } from '../../lib/supabase';

export const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#5B7BFF", dim: "#0A0D20"
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

// history: Supabase優先、fallback to localStorage
export async function saveHistory(appId, input, result, userId = null) {
  if (supabase && userId) {
    await supabase.from('histories').insert({ user_id: userId, app_id: appId, input, result });
  }
  // always save locally too
  const key = `history_${appId}`;
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  const entry = { input, result, date: new Date().toLocaleDateString("ja-JP") };
  localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 10)));
}

export async function getHistoryRemote(appId, userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from('histories')
    .select('*')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .order('created_at', { ascending: false })
    .limit(10);
  return data?.map(d => ({ input: d.input, result: d.result, date: new Date(d.created_at).toLocaleDateString("ja-JP") })) ?? [];
}

export function getHistoryLocal(appId) {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(`history_${appId}`) || "[]");
}

// alias for simpler imports
export const getHistory = getHistoryLocal;

export async function share(title, text) {
  if (navigator.share) {
    await navigator.share({ title, text }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(text);
    alert("クリップボードにコピーしました");
  }
}

export const Btn = ({ onClick, disabled, color, children, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "11px 22px", background: disabled ? "#1A1E38" : (color || "#5B7BFF"),
    border: "none", borderRadius: 10, color: disabled ? "#3A4060" : "#fff",
    fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit", transition: "opacity 0.15s", ...style
  }}>{children}</button>
);

export const TA = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{
      width: "100%", padding: "12px", background: "#0A0D20",
      border: "1px solid #182040", borderRadius: 10, color: "#C5D0F0",
      fontSize: 14, resize: "vertical", fontFamily: "inherit",
      lineHeight: 1.7, boxSizing: "border-box", outline: "none"
    }} />
);

export const ResultCard = ({ text, onShare, children }) => (
  <div style={{ marginTop: 16, background: "#0A0D20", borderRadius: 12,
    border: "1px solid #182040", overflow: "hidden" }}>
    <div style={{ padding: 16, color: "#C5D0F0", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
      {text}{children}
    </div>
    <div style={{ borderTop: "1px solid #182040", padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
      <button onClick={onShare} style={{
        background: "none", border: "1px solid #182040", borderRadius: 8,
        color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
      }}>シェア / コピー</button>
    </div>
  </div>
);

export const HistoryPanel = ({ items, onSelect }) => {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 10 }}>過去の履歴</div>
      {items.map((item, i) => (
        <div key={i} onClick={() => onSelect(item)} style={{
          padding: "10px 14px", background: "#0C0F22", border: "1px solid #182040",
          borderRadius: 8, marginBottom: 6, cursor: "pointer"
        }}>
          <div style={{ color: "#4A5880", fontSize: 11, marginBottom: 2 }}>{item.date}</div>
          <div style={{ color: "#C5D0F0", fontSize: 13, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.input}</div>
        </div>
      ))}
    </div>
  );
};

export const Loading = () => (
  <div style={{ textAlign: "center", color: "#4A5880", padding: 24, fontSize: 14 }}>処理中...</div>
);

export const BackBtn = () => (
  <a href="/" style={{ display: "inline-block", color: "#4A5880", fontSize: 13,
    marginBottom: 16, textDecoration: "none" }}>← 一覧に戻る</a>
);

export const Label = ({ children }) => (
  <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 6 }}>{children}</div>
);
