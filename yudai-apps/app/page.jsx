'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ── デザイントークン ── */
const C = {
  bg:       '#050812',
  surface:  '#0C0E1F',
  card:     '#0F1126',
  border:   '#1A2040',
  borderHi: '#2A3460',
  text:     '#E2E8FF',
  muted:    '#5A6890',
  mutedHi:  '#8A9CC0',
  accent:   '#6366F1',
  violet:   '#A78BFA',
  pink:     '#F472B6',
  cyan:     '#38BDF8',
  green:    '#34D399',
};

/* ── アプリデータ ── */
const FEATURED = [
  {
    id: 'konoka', icon: '🌸', title: 'このちゃんAI',
    sub: '松田好花（日向坂46）の話し方を再現したAIチャット。音声読み上げ付き。',
    color: '#A78BFA', tag: 'チャット',
    preview: ['「最近どう？」', '→ このちゃんだよ〜！', '元気にしてた？'],
  },
  {
    id: 'koe', icon: '🕯️', title: '声の遺産',
    sub: '大切な人の言葉・口癖を登録して、いつでも話しかけられる追悼AIチャット。',
    color: '#C8A84B', tag: '追悼',
    preview: ['「父に相談したい」', '→ 登録した言葉から', 'その人として応答'],
  },
  {
    id: 'monster', icon: '👾', title: '言葉モンスター',
    sub: '今日の日記からAIが感情モンスターを召喚。画像生成＋図鑑コレクション。',
    color: '#34D399', tag: '図鑑',
    preview: ['日記を書く', '→ AI＋画像生成', 'モンスター召喚！'],
  },
];

const APPS = [
  { id:'kokoro', icon:'🪞', title:'内省',         sub:'毎日の記録が感情地図になる',     color:'#7C6FFF', tag:'日記' },
  { id:'books',  icon:'📖', title:'図書館',        sub:'感情が呼び寄せる、運命の一冊',   color:'#4F46E5', tag:'読書' },
  { id:'dream',  icon:'🌙', title:'夢映像化',      sub:'消えゆく夢を詩と画像に残す',     color:'#0D9488', tag:'AI画像' },
  { id:'fate',   icon:'🔮', title:'運命診断',      sub:'統計と心理学がビジョンを解析',   color:'#7C3AED', tag:'診断' },
  { id:'rant',   icon:'💢', title:'鬱憤爆発',      sub:'理不尽を3視点で解剖する',        color:'#DC2626', tag:'社会' },
  { id:'muda',   icon:'🧠', title:'無駄削減',      sub:'週の節約時間を数値で可視化',     color:'#0891B2', tag:'効率' },
  { id:'genki',  icon:'🌐', title:'元気玉',        sub:'あなたの気分が世界と繋がる',     color:'#D97706', tag:'気分' },
  { id:'vending',icon:'🎰', title:'自販機マップ',  sub:'近くの自販機を瞬時に発見',       color:'#2563EB', tag:'MAP' },
];

function Orb({ style }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      filter: 'blur(80px)', pointerEvents: 'none',
      ...style,
    }} />
  );
}

function SpotlightCard({ app, index }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/${app.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative', overflow: 'hidden',
          padding: '28px 24px',
          background: hov ? '#0F1330' : '#0C0E22',
          border: `1px solid ${hov ? app.color + '55' : '#1E2448'}`,
          borderRadius: 20,
          boxShadow: hov ? `0 16px 48px ${app.color}20, 0 0 0 1px ${app.color}15` : 'none',
          height: '100%',
          transition: 'all 0.25s ease',
          transform: hov ? 'translateY(-4px)' : 'none',
          animationDelay: `${index * 0.1}s`,
        }}>

        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${app.color}18 0%, transparent 70%)`,
          opacity: hov ? 1 : 0.6,
          transition: 'opacity 0.3s',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: app.color + '18', color: app.color,
            border: `1px solid ${app.color}33`, fontWeight: 600, letterSpacing: '0.05em',
          }}>{app.tag}</span>
          <span style={{ fontSize: 28 }}>{app.icon}</span>
        </div>

        <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{app.title}</h3>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: '0 0 20px' }}>{app.sub}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {app.preview.map((line, i) => (
            <div key={i} style={{
              padding: '7px 12px',
              background: i % 2 === 0 ? '#080A1A' : app.color + '10',
              border: `1px solid ${i % 2 === 0 ? '#1A2040' : app.color + '20'}`,
              borderRadius: 8,
              color: i % 2 === 0 ? C.muted : app.color,
              fontSize: 11, fontFamily: 'monospace',
            }}>{line}</div>
          ))}
        </div>

        <div style={{
          marginTop: 20, color: app.color, fontSize: 12, fontWeight: 600,
          opacity: hov ? 1 : 0,
          transform: hov ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'all 0.2s',
        }}>
          試してみる →
        </div>
      </div>
    </Link>
  );
}

function AppCard({ app }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/${app.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative', overflow: 'hidden',
          padding: '18px 16px',
          background: hov ? '#0F1228' : C.card,
          border: `1px solid ${hov ? app.color + '44' : C.border}`,
          borderRadius: 14,
          boxShadow: hov ? `0 8px 24px ${app.color}15` : 'none',
          transition: 'all 0.2s ease',
          transform: hov ? 'translateY(-3px)' : 'none',
        }}>

        <div style={{
          position: 'absolute', bottom: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${app.color}12 0%, transparent 70%)`,
          opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>{app.icon}</span>
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 12,
            background: app.color + '15', color: app.color,
            border: `1px solid ${app.color}28`, fontWeight: 600,
          }}>{app.tag}</span>
        </div>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{app.title}</div>
        <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{app.sub}</div>
      </div>
    </Link>
  );
}

export default function Hub() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 80px', textAlign: 'center' }}>
        <Orb style={{ top: -100, left: '8%',  width: 500, height: 500, background: 'radial-gradient(circle, #6366F120 0%, transparent 70%)' }} />
        <Orb style={{ top:  -60, right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, #A78BFA15 0%, transparent 70%)' }} />
        <Orb style={{ bottom: -80, left: '42%', width: 300, height: 300, background: 'radial-gradient(circle, #38BDF812 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: '#6366F110', border: '1px solid #6366F128',
            color: '#A78BFA', fontSize: 12, fontWeight: 500, marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7', display: 'inline-block' }} />
            11本のAIアプリ、すべて無料で使える
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 68px)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em',
            margin: '0 0 22px',
          }}>
            <span style={{ color: C.text }}>AIと感情が</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 40%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>交差する場所</span>
          </h1>

          <p style={{
            color: C.muted, fontSize: 'clamp(14px, 2vw, 17px)',
            lineHeight: 1.9, margin: '0 0 40px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
          }}>
            チャット、診断、日記、図書館。<br />
            感情を起点に設計された、11本のプロダクト。
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/konoka" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                  border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 24px #6366F145',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px #6366F165'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px #6366F145'; }}
              >おすすめを試す →</button>
            </Link>
            <a href="#apps" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 28px', background: 'transparent',
                  border: '1px solid #252A50', borderRadius: 12,
                  color: C.mutedHi, fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#404880'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#252A50'; e.currentTarget.style.color = C.mutedHi; }}
              >全アプリを見る</button>
            </a>
          </div>
        </div>
      </section>

      {/* ── 統計バー ── */}
      <section style={{ padding: '0 24px 64px' }}>
        <div style={{
          maxWidth: 680, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#0C0E22', border: '1px solid #1E2448',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {[
            { val: '11', label: 'アプリ',    icon: '📦' },
            { val: '6',  label: 'AI搭載',    icon: '🤖' },
            { val: '∞',  label: '無料で使える', icon: '✨' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '22px 16px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid #1E2448' : 'none',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{
                fontSize: 30, fontWeight: 800,
                background: 'linear-gradient(135deg, #A78BFA, #6366F1)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── スポットライト ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontSize: 11, color: C.violet, letterSpacing: '0.15em',
              fontWeight: 600, textTransform: 'uppercase', marginBottom: 12,
            }}>✦ おすすめ</div>
            <h2 style={{
              fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800,
              color: C.text, letterSpacing: '-0.02em', margin: '0 0 10px',
            }}>まずはここから</h2>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>特に体験してほしい3本</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURED.map((app, i) => <SpotlightCard key={app.id} app={app} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── 全アプリ ── */}
      <section id="apps" style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
            paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
          }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>すべてのアプリ</h2>
            <span style={{ color: C.muted, fontSize: 12 }}>{APPS.length} apps</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {APPS.map((app, i) => <AppCard key={app.id} app={app} />)}
          </div>
        </div>
      </section>

      {/* ── フッター ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 2 }}>
          <span style={{
            background: 'linear-gradient(135deg, #A78BFA, #6366F1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}>Yudai Apps</span>
          {' '}· AIと感情が交差するプロダクト集<br />
          <span style={{ fontSize: 11 }}>Powered by Claude AI · 画像生成 Pollinations.ai</span>
        </p>
      </footer>
    </div>
  );
}
