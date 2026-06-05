'use client';
import Fate from '../apps/Fate';
import Muda from '../apps/Muda';
import Vending from '../apps/Vending';
import Genki from '../apps/Genki';
import Monster from '../apps/Monster';
import Books from '../apps/Books';
import Rant from '../apps/Rant';
import Dream from '../apps/Dream';

const APPS = { fate: Fate, muda: Muda, vending: Vending, genki: Genki, monster: Monster, books: Books, rant: Rant, dream: Dream };

export default function AppPage({ params }) {
  const { appId } = params;
  const App = APPS[appId];
  if (!App) return <div style={{ color: "#C5D0F0", padding: 32 }}>Not found</div>;
  return <div style={{ padding: 16 }}><App /></div>;
}
