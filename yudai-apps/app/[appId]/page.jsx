import Link from 'next/link';
import Fate from '../apps/Fate';
import Muda from '../apps/Muda';
import Vending from '../apps/Vending';
import Genki from '../apps/Genki';
import Monster from '../apps/Monster';
import Books from '../apps/Books';
import Rant from '../apps/Rant';
import Dream from '../apps/Dream';
import Yamato from '../apps/Yamato';
import Biz from '../apps/Biz';
import Side from '../apps/Side';
import Marry from '../apps/Marry';
import Untangle from '../apps/Untangle';
import Konoka from '../apps/Konoka';
import Koe from '../apps/Koe';
import Kokoro from '../apps/Kokoro';
import Suno from '../apps/Suno';
import GrowthTracker from '../apps/GrowthTracker';
import FaceGlow from '../apps/FaceGlow';
import Coach from '../apps/Coach';
import Tarot from '../apps/Tarot';
import Fortune from '../apps/Fortune';

// UNTANGLE_MARKER_XK9Z2
const APPS = { fate: Fate, muda: Muda, vending: Vending, genki: Genki, monster: Monster, books: Books, rant: Rant, dream: Dream, yamato: Yamato, biz: Biz, side: Side, marry: Marry, untangle: Untangle, konoka: Konoka, koe: Koe, kokoro: Kokoro, suno: Suno, growth: GrowthTracker, faceglow: FaceGlow, coach: Coach, tarot: Tarot, fortune: Fortune };

const APP_META = {
  koe:     { title: '声の遺産',      description: '大切な人の言葉を登録 → いつでも話しかけられる追悼AIチャット。声と記憶を永遠に残す。' },
  konoka:  { title: 'このちゃんAI',  description: '日向坂46・松田好花の話し方をAIが再現。ファン必見のAIチャットボット。' },
  untangle:{ title: 'Untangle',      description: '人生の「足かせ」をAIカウンセラーが対話で解きほぐすカウンセリングアプリ。' },
  fate:    { title: '運命診断',      description: '統計と心理学があなたのビジョンを解析。あなたの本質と転機を暴く運命診断。' },
  marry:   { title: '婚活診断',      description: 'AI面接官があなたの婚活力を10項目でスコア診断。婚活戦略を見える化。' },
  side:    { title: '副業診断',      description: 'スキル・時間・目標を入力 → 最適な副業ロードマップをAIが生成。' },
  muda:    { title: '無駄削減',      description: '週のルーティンを入力 → 節約できる時間を数値で可視化するAI効率化アプリ。' },
  rant:    { title: '鬱憤爆発',      description: '理不尽・社会への怒りを哲学・データ・感情の3視点でAIが解剖する感情整理アプリ。' },
  dream:   { title: '夢映像化',      description: '昨夜の夢をAIが詩的散文＋AIアート画像として永遠に残す夢日記アプリ。' },
  monster: { title: '言葉モンスター',description: '日記からAIが唯一無二の感情モンスターを召喚。図鑑機能でコレクションを楽しむ。' },
  suno:    { title: 'Melody AI',     description: 'テキスト → プロ品質の楽曲歌詞をAIが瞬時に生成。ジャンル・テーマを自由に選択。' },
  biz:     { title: 'ビジネス文書', description: '提案書・企画書・メールをAIが業界水準で自動作成するビジネス文書生成アプリ。' },
  kokoro:  { title: '内省',          description: '毎日の記録をAIが感情タグ付け。パターン分析で自己理解が深まる日記アプリ。' },
  books:   { title: '感情図書館',    description: '今の感情を入力 → AIが運命の一冊を選書。感情と読書をつなぐ体験。' },
  genki:   { title: '元気玉',        description: 'あなたの気分を送信 → 世界中の人の感情とリアルタイムで繋がるコミュニティアプリ。' },
  yamato:  { title: '大和魂教育',    description: '日本の文化・歴史・精神をゲーム形式で学べる教育コンテンツ。' },
  vending: { title: '自販機マップ',  description: '現在地周辺の自販機をAIが瞬時に発見。最寄りルートも案内。' },
  growth:  { title: 'Growth Tracker',description: '習慣・目標をAIと一緒に管理。成長の軌跡を可視化する自己成長記録アプリ。' },
  faceglow:{ title: 'FACEGLOW',      description: 'AIが顔を診断し理想の顔を可視化する美容アプリ。改善ポイントをAIが詳しく解説。' },
  coach:   { title: 'AIコーチ',      description: '専属AIコーチとチャットしながら目標達成を加速。毎日の進捗をタスク管理で可視化。' },
  tarot:   { title: 'AIタロット',    description: '3枚のカードが過去・現在・未来を映す。AIが詩的かつ深い洞察でリーディングを生成。' },
  fortune: { title: '今日の運勢',    description: '12星座ごとに毎日更新されるAI星占い。恋愛・仕事・健康・金運をスコアで可視化。' },
};

export function generateMetadata({ params }) {
  const meta = APP_META[params?.appId];
  if (!meta) return { title: 'YUDAI APPS' };
  return {
    title: `${meta.title} — YUDAI APPS`,
    description: meta.description,
    openGraph: {
      title: `${meta.title} — YUDAI APPS`,
      description: meta.description,
      type: 'website',
    },
  };
}

export default function AppPage({ params }) {
  const { appId } = params;
  const App = APPS[appId];
  if (!App) return <div style={{ color: '#E2E8FF', padding: 32 }}>Not found</div>;
  return (
    <div style={{ padding: '12px 16px 40px' }}>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: '#4A5880', fontSize: 13, textDecoration: 'none',
        marginBottom: 12,
      }}>
        ← 一覧に戻る
      </Link>
      <App />
    </div>
  );
}
