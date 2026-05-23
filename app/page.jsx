const APPS = [
  { id: 'fate',    name: '運命診断',    icon: '🔮', desc: '統計・心理・行動経済学の3視点で運命を解析', score: 55, color: '#4a148c' },
  { id: 'muda',    name: '無駄削減',    icon: '🧠', desc: '認知負荷研究でルーティンを科学的に最適化', score: 50, color: '#1a237e' },
  { id: 'vending', name: '自販機マップ', icon: '🎰', desc: '現在地周辺の自動販売機をすぐ発見', score: 20, color: '#1b5e20' },
  { id: 'genki',   name: '元気玉',      icon: '🌐', desc: '今日の元気を記録して世界と比較', score: 48, color: '#0d47a1' },
  { id: 'monster', name: '言葉モンスター', icon: '👾', desc: '日記から唯一無二の感情モンスターを召喚', score: 58, color: '#311b92' },
  { id: 'books',   name: '書物',        icon: '📖', desc: '感情・状況に合った本をAIが推薦', score: 68, color: '#1b5e20' },
  { id: 'rant',    name: '鬱憤爆発',    icon: '💢', desc: '社会問題を哲学・データ・人間の3視点で解剖', score: 58, color: '#b71c1c' },
  { id: 'dream',   name: '夢映像化',    icon: '🌙', desc: '夢の断片を詩的散文として永遠に記録', score: 62, color: '#1a237e' },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, background: 'linear-gradient(135deg,#7c6af7,#42a5f5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 12px' }}>
            Yudai Apps
          </h1>
          <p style={{ color: '#555', fontSize: 15 }}>8つのAI駆動Webアプリ · Powered by Claude</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {APPS.map(app => (
            <a key={app.id} href={`/${app.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: '#141414', border: '1px solid #222', borderRadius: 14,
                padding: 24, cursor: 'pointer', transition: 'all .15s',
                borderTop: `3px solid ${app.color}`
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#141414'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{app.icon}</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{app.name}</h2>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: '0 0 16px' }}>{app.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: '#222', borderRadius: 2 }}>
                    <div style={{ width: `${app.score}%`, height: '100%', background: app.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{app.score}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
