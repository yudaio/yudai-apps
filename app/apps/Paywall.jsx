'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthGate';

// ── 設定 ──────────────────────────────────────────
const FREE_LIMIT = 3;           // 無料: 1日3回
const LS_PREMIUM = 'premium_v1'; // localStorageキー

// Lemon Squeezy のチェックアウトURL（あなたのURLに差し替えてください）
export const CHECKOUT_URL = process.env.NEXT_PUBLIC_LS_CHECKOUT_URL || 'https://your-store.lemonsqueezy.com/checkout/buy/YOUR_VARIANT_ID';

// ── Premium判定 ───────────────────────────────────
export function usePremium() {
  const auth = useAuth();
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    // 1. Supabaseのuser metadataを確認
    if (auth?.user?.user_metadata?.premium) { setPremium(true); return; }
    // 2. localStorageのトークンを確認（Lemon Squeezyリダイレクト後に保存）
    const token = localStorage.getItem(LS_PREMIUM);
    if (token) { setPremium(true); return; }
    setPremium(false);
  }, [auth?.user]);

  const activate = useCallback((token) => {
    localStorage.setItem(LS_PREMIUM, token);
    setPremium(true);
  }, []);

  return { premium, activate };
}

// ── 使用回数ゲート ─────────────────────────────────
export function useGate(appId) {
  const { premium } = usePremium();
  const [count, setCount] = useState(0);
  const [blocked, setBlocked] = useState(false);

  const todayKey = `usage_${appId}_${new Date().toLocaleDateString('en-CA')}`;

  useEffect(() => {
    const c = parseInt(localStorage.getItem(todayKey) || '0', 10);
    setCount(c);
  }, [todayKey]);

  const check = useCallback(() => {
    if (premium) return true; // プレミアムは無制限
    const c = parseInt(localStorage.getItem(todayKey) || '0', 10);
    if (c >= FREE_LIMIT) { setBlocked(true); return false; }
    return true;
  }, [premium, todayKey]);

  const increment = useCallback(() => {
    if (premium) return;
    const c = parseInt(localStorage.getItem(todayKey) || '0', 10);
    const next = c + 1;
    localStorage.setItem(todayKey, String(next));
    setCount(next);
  }, [premium, todayKey]);

  const dismiss = useCallback(() => setBlocked(false), []);

  return { premium, count, remaining: Math.max(0, FREE_LIMIT - count), blocked, check, increment, dismiss };
}

// ── Paywallモーダル ────────────────────────────────
export function PaywallModal({ onClose, lang = 'ja' }) {
  const { activate } = usePremium();

  const copy = {
    ja: {
      title: "今日の無料枠を使い切りました",
      subtitle: "プレミアムプランで無制限に使えます",
      price: "¥600 / 月",
      features: [
        "✦ 3アプリ 使い放題",
        "✦ モンスター図鑑 クラウド同期",
        "✦ 優先AIレスポンス",
        "✦ 新機能への早期アクセス",
      ],
      cta: "プレミアムにアップグレード",
      free: `無料枠は明日リセット（残り ${getRemainingHours()}時間）`,
      close: "今日はやめておく",
    },
    en: {
      title: "You've used today's free limit",
      subtitle: "Go premium for unlimited access",
      price: "$4.99 / month",
      features: [
        "✦ Unlimited use of all 3 apps",
        "✦ Monster collection cloud sync",
        "✦ Priority AI responses",
        "✦ Early access to new features",
      ],
      cta: "Upgrade to Premium",
      free: `Free limit resets in ${getRemainingHours()} hours`,
      close: "Maybe later",
    },
  };

  const t = copy[lang] || copy.en;

  const handleCheckout = () => {
    // Lemon Squeezy のチェックアウトページへ
    window.open(CHECKOUT_URL, '_blank');
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        maxWidth: 380, width: "100%", background: "#0C0F22",
        border: "1px solid #2A3070", borderRadius: 16, padding: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <h2 style={{ color: "#C5D0F0", fontSize: 18, margin: "0 0 6px", fontWeight: 700 }}>{t.title}</h2>
          <p style={{ color: "#4A5880", fontSize: 13, margin: 0 }}>{t.subtitle}</p>
        </div>

        {/* Price */}
        <div style={{
          textAlign: "center", padding: "14px 0", marginBottom: 16,
          borderTop: "1px solid #182040", borderBottom: "1px solid #182040",
        }}>
          <span style={{ color: "#5B7BFF", fontSize: 28, fontWeight: 800 }}>{t.price}</span>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 20 }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ color: "#C5D0F0", fontSize: 13, padding: "5px 0", lineHeight: 1.5 }}>{f}</div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleCheckout} style={{
          width: "100%", padding: "14px", background: "#5B7BFF",
          border: "none", borderRadius: 10, color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          marginBottom: 10,
        }}>{t.cta}</button>

        {/* Free reset */}
        <div style={{ textAlign: "center", color: "#4A5880", fontSize: 11, marginBottom: 10 }}>{t.free}</div>

        {/* Close */}
        <button onClick={onClose} style={{
          width: "100%", padding: "10px", background: "transparent",
          border: "1px solid #182040", borderRadius: 10, color: "#4A5880",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}>{t.close}</button>
      </div>
    </div>
  );
}

// ── 残り時間計算 ───────────────────────────────────
function getRemainingHours() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 3600000);
}

// ── 残り回数バッジ ─────────────────────────────────
export function UsageBadge({ remaining, premium, lang = 'ja' }) {
  if (premium) return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", background: "#0A1A30", border: "1px solid #1A3A60",
      borderRadius: 20, marginBottom: 12 }}>
      <span style={{ color: "#5B7BFF", fontSize: 11 }}>⚡ {lang === 'ja' ? 'プレミアム' : 'Premium'}</span>
    </div>
  );

  const color = remaining <= 1 ? "#FF5A5A" : remaining <= 2 ? "#FFD93A" : "#3AFF8A";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", background: "#0A0D20", border: `1px solid ${color}33`,
      borderRadius: 20, marginBottom: 12 }}>
      <span style={{ color, fontSize: 11 }}>
        {lang === 'ja' ? `本日あと${remaining}回無料` : `${remaining} free use${remaining !== 1 ? 's' : ''} left today`}
      </span>
    </div>
  );
}
