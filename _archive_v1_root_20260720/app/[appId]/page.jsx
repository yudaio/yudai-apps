import Link from 'next/link';
import Coach from '../apps/Coach';
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
import Kokoro from '../apps/Kokoro';
import Koe from '../apps/Koe';
import Untangle from '../apps/Untangle';
import Konoka from '../apps/Konoka';
import FaceGlow from '../apps/FaceGlow';
import Suno from '../apps/Suno';
import GrowthTracker from '../apps/GrowthTracker';

const APPS = { coach: Coach, fate: Fate, muda: Muda, vending: Vending, genki: Genki, monster: Monster, books: Books, rant: Rant, dream: Dream, yamato: Yamato, biz: Biz, side: Side, marry: Marry, kokoro: Kokoro, koe: Koe, untangle: Untangle, konoka: Konoka, faceglow: FaceGlow, suno: Suno, growth: GrowthTracker };

const APP_META = {
  konoka:   { title: "このちゃんAI",      description: "松田好花の話し方でAIと会話できるチャットボット" },
  koe:      { title: "声の遺産",          description: "あの人の言葉を、AIで永遠に残す追悼アプリ" },
  monster:  { title: "言葉モンスター",    description: "日記から唯一無二のモンスターが生まれる育成図鑑" },
  kokoro:   { title: "内省",              description: "毎日の記録が自分の地図になるAI日記アプリ" },
  books:    { title: "図書館",            description: "感情が呼び寄せる運命の一冊をAIが提案" },
  dream:    { title: "夢映像化",          description: "消えゆく夢をAIが詩と画像に変えて保存" },
  fate:     { title: "運命診断",          description: "統計と心理学でAIがあなたの運命を解析" },
  rant:     { title: "鬱憤爆発",          description: "理不尽を3つの視点で解剖するAI感情整理アプリ" },
  muda:     { title: "無駄削減",          description: "認知負荷を削ぎ落としてAIが時間を取り戻す" },
  genki:    { title: "元気玉",            description: "あなたの気分が世界と繋がる気分共有アプリ" },
  vending:  { title: "自販機マップ",      description: "近くの自販機をAIが瞬時に発見" },
  faceglow: { title: "FACEGLOW",          description: "AIが顔を診断し理想の顔を可視化する美容アプリ" },
  suno:     { title: "Melody AI",         description: "テキストから楽曲をAIが瞬時に生成" },
  growth:   { title: "Growth Tracker",   description: "習慣・目標をAIと一緒に管理する成長記録アプリ" },
};

export function generateMetadata({ params }) {
  const meta = APP_META[params?.appId];
  if (!meta) return { title: "YUDAI APPS" };
  return {
    title: `${meta.title} — YUDAI APPS`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
    },
  };
}

export default function AppPage({ params }) {
  const appId = params?.appId ?? '';
  const App = APPS[appId];
  if (!App) return <div style={{ color: "#C5D0F0", padding: 32 }}>Not found: {JSON.stringify(params)}</div>;
  return (
    <div style={{ padding: "12px 16px 40px" }}>
      <Link href="/" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "#4A5880", fontSize: 13, textDecoration: "none",
        marginBottom: 12,
      }}>
        ← 一覧に戻る
      </Link>
      <App />
    </div>
  );
}
