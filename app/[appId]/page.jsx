import Fate from '../apps/Fate'
import Muda from '../apps/Muda'
import Vending from '../apps/Vending'
import Genki from '../apps/Genki'
import Monster from '../apps/Monster'
import Books from '../apps/Books'
import Rant from '../apps/Rant'
import Dream from '../apps/Dream'

const APPS = {
  fate:    { name: '運命診断', icon: '🔮', component: Fate,    desc: '統計・心理・行動経済学の3視点で運命を解析' },
  muda:    { name: '無駄削減', icon: '🧠', component: Muda,    desc: '認知負荷研究に基づきルーティンを科学的に最適化' },
  vending: { name: '自販機マップ', icon: '🎰', component: Vending, desc: '現在地周辺の自動販売機をすぐ発見' },
  genki:   { name: '元気玉', icon: '🌐', component: Genki,   desc: '日々の元気状態をチェックインして世界と比較' },
  monster: { name: '言葉モンスター', icon: '👾', component: Monster, desc: '日記から唯一無二の感情モンスターを召喚' },
  books:   { name: '書物', icon: '📖', component: Books,   desc: '感情・状況に合った本をAIが推薦' },
  rant:    { name: '鬱憤爆発', icon: '💢', component: Rant,    desc: '社会問題を哲学・データ・人間の3視点で解剖' },
  dream:   { name: '夢映像化', icon: '🌙', component: Dream,   desc: '夢の断片を詩的散文として永遠に記録' },
}

export function generateStaticParams() {
  return Object.keys(APPS).map(id => ({ appId: id }))
}

export default function AppPage({ params }) {
  const app = APPS[params.appId]
  if (!app) return <div style={{ padding: 40, color: '#fff' }}>アプリが見つかりません</div>
  const Component = app.component

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
        <a href="/" style={{ fontSize: 13, color: '#666', textDecoration: 'none', display: 'block', marginBottom: 32 }}>← 全アプリ一覧</a>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, margin: '0 0 8px' }}>
            {app.icon} {app.name}
          </h1>
          <p style={{ color: '#666', fontSize: 14 }}>{app.desc}</p>
        </div>
        <Component />
      </div>
    </div>
  )
}
