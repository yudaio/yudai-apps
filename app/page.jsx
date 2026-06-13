'use client'
import { useState } from 'react'

const CATEGORIES = [
  {
    id: 'all', label: 'すべて'
  },
  {
    id: 'ai', label: 'AI・創作'
  },
  {
    id: 'amazon', label: 'Amazon'
  },
]

const APPS = [
  // オリジナル
  { id: 'fate',    name: '運命診断',    icon: '🔮', desc: '統計・心理・行動経済学の3視点で運命を解析', cat: 'ai', premium: false, color: '#4a148c' },
  { id: 'books',   name: '書物',        icon: '📖', desc: '感情・状況に合った本をAIが推薦', cat: 'ai', premium: false, color: '#1b5e20' },
  { id: 'monster', name: '言葉モンスター', icon: '👾', desc: '日記から唯一無二の感情モンスターを召喚', cat: 'ai', premium: false, color: '#311b92' },
  { id: 'dream',   name: '夢映像化',    icon: '🌙', desc: '夢の断片を詩的散文として永遠に記録', cat: 'ai', premium: false, color: '#1a237e' },
  { id: 'rant',    name: '鬱憤爆発',    icon: '💢', desc: '社会問題を哲学・データ・人間の3視点で解剖', cat: 'ai', premium: false, color: '#b71c1c' },
  { id: 'muda',    name: '無駄削減',    icon: '🧠', desc: '認知負荷研究でルーティンを科学的に最適化', cat: 'ai', premium: true, color: '#1a237e' },
  { id: 'genki',   name: '元気玉',      icon: '🌐', desc: '今日の元気を記録して世界と比較', cat: 'ai', premium: false, color: '#0d47a1' },
  { id: 'vending', name: '自販機マップ', icon: '🎰', desc: '現在地周辺の自動販売機をすぐ発見', cat: 'ai', premium: false, color: '#1b5e20' },
  // Amazon系
  { id: 'review',  name: 'レビュー分析',  icon: '🔍', desc: 'Amazonレビューをまとめてセンチメント分析', cat: 'amazon', premium: false, color: '#e65100' },
  { id: 'qa',      name: 'Q&A自動生成', icon: '💬', desc: '商品Q&Aを瞬時に高品質生成', cat: 'amazon', premium: false, color: '#bf360c' },
  { id: 'return',  name: '返品リスク予測', icon: '📦', desc: 'AI購入前に返品リスクをスコアリング', cat: 'amazon', premium: true, color: '#4e342e' },
  { id: 'redflag', name: '危険商品検出', icon: '🚩', desc: '詐欺・粗悪品のサインをチェック', cat: 'amazon', premium: false, color: '#b71c1c' },
  { id: 'travel',  name: '旅行物語生成', icon: '✈️', desc: '商品×旅先の物語をAIが紡ぐ', cat: 'amazon', premium: true, color: '#1a237e' },
  { id: 'life',    name: 'モノの一生',   icon: '📖', desc: '商品視点の一生の物語を生成', cat: 'amazon', premium: true, color: '#1b5e20' },
  { id: 'curiosity', name: '好奇心エンジン', icon: '🔭', desc: '商品から知的つながりを発掘', cat: 'amazon', premium: false, color: '#4a148c' },
]

export default function Home() {
  const [cat, setCat] = useState('all')
  const filtered = cat === 'all' ? APPS : APPS.filter(a => a.cat === cat)
  const free = filtered.filter(a => !a.premium)
  const premium = filtered.filter(a => a.premium)

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #080808 60%)', borderBottom: '1px solid #181828', padding: '80px 20px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#7c6af7', marginBottom: 16, textTransform: 'uppercase' }}>AI-Powered Web Apps</div>
          <h1 style={{ fontSize: 'clamp(40px,7vw,72px)', fontWeight: 900, background: 'linear-gradient(135deg,#7c6af7 0%,#42a5f5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 16px', lineHeight: 1.1 }}>
            Yudai Apps
          </h1>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.8, margin: '0 0 32px' }}>
            Claude AIを活用した15のWebアプリ。<br />創作・診断・Amazon分析まで、無料で即使える。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#apps" style={{ background: '#7c6af7', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              無料で試す →
            </a>
            <a href="https://buy.stripe.com/placeholder" target="_blank" style={{ background: 'transparent', color: '#7c6af7', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: '1px solid #7c6af7' }}>
              ✨ プレミアム
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ borderBottom: '1px solid #181818', padding: '24px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['15', 'アプリ'], ['Claude', 'Powered'], ['無料', '基本利用'], ['日本語', 'ネイティブ']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#7c6af7' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#444', letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Banner */}
      <div style={{ background: 'linear-gradient(90deg, #1a1040 0%, #0d1a40 100%)', border: '1px solid #2a2060', margin: '32px 20px 0', borderRadius: 12, padding: '20px 28px', maxWidth: 860, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#7c6af7', letterSpacing: 2, marginBottom: 4 }}>✨ PREMIUM</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>プレミアムプランで全機能解放</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>返品予測・旅行物語・モノの一生など4アプリが追加解放 · 履歴無制限 · API優先</div>
          </div>
          <a href="https://buy.stripe.com/placeholder" target="_blank" style={{ background: '#7c6af7', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
            月額 ¥480 →
          </a>
        </div>
      </div>

      {/* Apps */}
      <div id="apps" style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px 80px' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              fontSize: 13, padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: cat === c.id ? 700 : 400,
              background: cat === c.id ? '#7c6af7' : 'transparent',
              border: `1px solid ${cat === c.id ? '#7c6af7' : '#333'}`,
              color: cat === c.id ? '#fff' : '#666'
            }}>{c.label}</button>
          ))}
        </div>

        {/* Free apps */}
        {free.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#444', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>無料アプリ</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, marginBottom: 40 }}>
              {free.map(app => <AppCard key={app.id} app={app} />)}
            </div>
          </>
        )}

        {/* Premium apps */}
        {premium.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#7c6af7', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>✨ プレミアム</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {premium.map(app => <AppCard key={app.id} app={app} />)}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #181818', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#333' }}>© 2025 Yudai Apps · Powered by Claude AI · <a href="mailto:contact@example.com" style={{ color: '#555', textDecoration: 'none' }}>Contact</a></div>
      </div>
    </div>
  )
}

function AppCard({ app }) {
  return (
    <a href={`/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#111', border: '1px solid #1e1e1e', borderRadius: 12,
        padding: '20px', cursor: 'pointer', transition: 'all .15s',
        borderTop: `3px solid ${app.color}`, position: 'relative'
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#171717'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.transform = 'none' }}
      >
        {app.premium && (
          <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, background: '#2a1a5a', color: '#7c6af7', border: '1px solid #3a2a6a', borderRadius: 10, padding: '2px 7px', letterSpacing: 1 }}>PRO</span>
        )}
        <div style={{ fontSize: 32, marginBottom: 10 }}>{app.icon}</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>{app.name}</h2>
        <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: 0 }}>{app.desc}</p>
      </div>
    </a>
  )
}
