'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthGate';

// ── 設定 ──────────────────────────────────────────
const FREE_LIMIT = 3;           // 無料: 1日3回
const LS_PREMIUM = 'premium_v1'; // localStorageキー

const STRIPE_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

async function openCheckout(userId, email) {
  if (STRIPE_ENABLED) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });
    const data = await res.json();
    if (data.url) { window.location.href = data.url; return; }
  }
  // フォールバック: Lemon Squeezy URL がある場合
  const lsUrl = process.env.NEXT_PUBLIC_LS_CHECKOUT_URL;
  if (lsUrl) { window.open(lsUrl, '_blank'); return; }
  // 最終フォールバック: メール
  const subject = encodeURIComponent('【YUDAI APPS】プレミアムプランの申し込み');
  const body = encodeURIComponent('プレミアムプランに申し込みたいです。\n\nお名前：\n');
  window.location.href = `mailto:yamamor1208@icloud.com?subject=${subject}&body=${body}`;
}

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
  const [hov, setHov] = useState(false);

  const copy = {
    ja: {
      title: '今日の無料枠を使い切りました',
      subtitle: 'プレミアムなら毎日使い放題',
      trial: '7日間無料で始める',
      price: 'その後 ¥480/月',
      badge: '最も人気',
      features: [
        { icon:'🚀', text:'全アプリ AI使い放題（回数無制限）' },
        { icon:'💾', text:'会話・結果を無制限に保存' },
        { icon:'⚡', text:'優先AI処理（レスポンス高速化）' },
        { icon:'📤', text:'結果をPDF・テキストでエクスポート' },
        { icon:'🔓', text:'Untangle 足かせ診断の全解放' },
        { icon:'🌟', text:'新機能への早期アクセス' },
      ],
      free: `無料枠は明日リセット（残り${getRemainingHours()}時間）`,
      close: '今日はやめておく',
      cancel: 'いつでもキャンセル可 · クレジットカード不要（7日間）',
    },
    en: {
      title: "You've reached today's limit",
      subtitle: 'Go Premium for unlimited access',
      trial: 'Start 7-day free trial',
      price: 'Then $3.99 / month',
      badge: 'Most popular',
      features: [
        { icon:'🚀', text:'Unlimited AI on all apps' },
        { icon:'💾', text:'Save & export all results' },
        { icon:'⚡', text:'Priority AI — faster responses' },
        { icon:'📤', text:'PDF / text export' },
        { icon:'🔓', text:'Untangle full diagnosis unlock' },
        { icon:'🌟', text:'Early access to new features' },
      ],
      free: `Free limit resets in ${getRemainingHours()} hours`,
      close: 'Maybe later',
      cancel: 'Cancel anytime · No card required for trial',
    },
  };

  const t = copy[lang] || copy.en;
  const auth = useAuth();
  const ctaLabel = STRIPE_ENABLED ? t.trial : (lang === 'ja' ? '📧 メールで申し込む' : '📧 Apply via email');

  const handleCheckout = () => openCheckout(auth?.user?.id, auth?.user?.email);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16, backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div style={{
        maxWidth: 400, width: '100%',
        background: 'linear-gradient(135deg,#0E1035,#0A0C28)',
        border: '1px solid #3A40A0',
        borderRadius: 20, padding: '28px 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px #ffffff08',
        position: 'relative', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* 背景グロー */}
        <div style={{ position:'absolute', top:-80, right:-80, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,#6366F125,transparent 70%)', pointerEvents:'none' }}/>

        {/* バッジ */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ padding:'4px 14px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', borderRadius:20, color:'#fff', fontSize:11, fontWeight:700 }}>✨ {t.badge}</div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
          <h2 style={{ color: '#E2E8FF', fontSize: 19, margin: '0 0 6px', fontWeight: 800, letterSpacing:'-0.02em' }}>{t.title}</h2>
          <p style={{ color: '#5A6890', fontSize: 13, margin: 0 }}>{t.subtitle}</p>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 20, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'14px 16px', border:'1px solid #1E2448' }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom: i<t.features.length-1?'1px solid #1A2040':'none' }}>
              <span style={{ fontSize:14 }}>{f.icon}</span>
              <span style={{ color: '#C5D0F0', fontSize: 13 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <button
          onClick={handleCheckout}
          onMouseEnter={()=>setHov(true)}
          onMouseLeave={()=>setHov(false)}
          style={{
            width: '100%', padding: '15px', marginBottom: 8,
            background: hov ? 'linear-gradient(135deg,#818CF8,#A78BFA)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
            transform: hov ? 'translateY(-1px)' : 'none',
          }}>
          {ctaLabel}
        </button>
        <div style={{ textAlign:'center', color:'#4A5880', fontSize:12, marginBottom:10 }}>{t.price}</div>
        <div style={{ textAlign:'center', color:'#3A4870', fontSize:11, marginBottom:14 }}>{t.cancel}</div>

        {/* Free reset */}
        <div style={{ textAlign: 'center', color: '#3A4870', fontSize: 11, marginBottom: 12 }}>{t.free}</div>

        {/* Close */}
        <button onClick={onClose} style={{
          width: '100%', padding: '10px', background: 'transparent',
          border: '1px solid #1E2448', borderRadius: 10, color: '#4A5880',
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition:'all 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#3A4870';e.currentTarget.style.color='#8A9CC0';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E2448';e.currentTarget.style.color='#4A5880';}}
        >{t.close}</button>
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
