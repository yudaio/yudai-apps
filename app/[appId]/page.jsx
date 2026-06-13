import Fate from '../apps/Fate'
import Muda from '../apps/Muda'
import Vending from '../apps/Vending'
import Genki from '../apps/Genki'
import Monster from '../apps/Monster'
import Books from '../apps/Books'
import Rant from '../apps/Rant'
import Dream from '../apps/Dream'
import ReviewIntelligence from '../apps/ReviewIntelligence'
import AutoAnswer from '../apps/AutoAnswer'
import ReturnPredictor from '../apps/ReturnPredictor'
import RedFlag from '../apps/RedFlag'
import TravelNarrator from '../apps/TravelNarrator'
import LifeOfThings from '../apps/LifeOfThings'
import CuriosityEngine from '../apps/CuriosityEngine'

const APPS = {
  fate:     { name: '運命診断',       icon: '🔮', component: Fate,               desc: '統計・心理・行動経済学の3視点で運命を解析', premium: false },
  muda:     { name: '無駄削減',       icon: '🧠', component: Muda,               desc: '認知負荷研究でルーティンを科学的に最適化', premium: true },
  vending:  { name: '自販機マップ',   icon: '🎰', component: Vending,            desc: '現在地周辺の自動販売機をすぐ発見', premium: false },
  genki:    { name: '元気玉',         icon: '🌐', component: Genki,              desc: '日々の元気状態をチェックインして世界と比較', premium: false },
  monster:  { name: '言葉モンスター', icon: '👾', component: Monster,            desc: '日記から唯一無二の感情モンスターを召喚', premium: false },
  books:    { name: '書物',           icon: '📖', component: Books,              desc: '感情・状況に合った本をAIが推薦', premium: false },
  rant:     { name: '鬱憤爆発',       icon: '💢', component: Rant,               desc: '社会問題を哲学・データ・人間の3視点で解剖', premium: false },
  dream:    { name: '夢映像化',       icon: '🌙', component: Dream,              desc: '夢の断片を詩的散文として永遠に記録', premium: false },
  review:   { name: 'レビュー分析',   icon: '🔍', component: ReviewIntelligence, desc: 'Amazonレビューをセンチメント分析', premium: false },
  qa:       { name: 'Q&A自動生成',   icon: '💬', component: AutoAnswer,         desc: '商品Q&Aを瞬時に高品質生成', premium: false },
  return:   { name: '返品リスク予測', icon: '📦', component: ReturnPredictor,    desc: '購入前に返品リスクをAIでスコアリング', premium: true },
  redflag:  { name: '危険商品検出',   icon: '🚩', component: RedFlag,            desc: '詐欺・粗悪品のサインをチェック', premium: false },
  travel:   { name: '旅行物語生成',   icon: '✈️', component: TravelNarrator,     desc: '商品×旅先の物語をAIが紡ぐ', premium: true },
  life:     { name: 'モノの一生',     icon: '📖', component: LifeOfThings,       desc: '商品視点の一生の物語を生成', premium: true },
  curiosity:{ name: '好奇心エンジン', icon: '🔭', component: CuriosityEngine,    desc: '商品から知的つながりを発掘', premium: false },
}

export function generateStaticParams() {
  return Object.keys(APPS).map(id => ({ appId: id }))
}

export default function AppPage({ params }) {
  const app = APPS[params.appId]
  if (!app) return <div style={{ padding: 40, color: '#fff' }}>アプリが見つかりません</div>
  const Component = app.component

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <a href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>← 全アプリ一覧</a>
          {app.premium && (
            <span style={{ fontSize: 11, background: '#1a0d40', color: '#7c6af7', border: '1px solid #3a2a6a', borderRadius: 10, padding: '3px 10px', letterSpacing: 1 }}>✨ PRO</span>
          )}
        </div>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, margin: '0 0 8px' }}>
            {app.icon} {app.name}
          </h1>
          <p style={{ color: '#555', fontSize: 14, margin: 0 }}>{app.desc}</p>
        </div>
        <Component />
      </div>
    </div>
  )
}
