'use client';
import { useState, useEffect } from 'react';
import { Btn, Loading, BackBtn, HistoryPanel, callAI, saveHistory, getHistory, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const moods = ["喜び","悲しみ","怒り","不安","倦怠","興奮","平穏","迷い"];
const genres = ["小説","哲学","ビジネス","歴史","SF","詩集","自己啓発","何でもOK"];

const Chip = ({ label, active, onClick, activeColor }) => (
  <button onClick={onClick} style={{
    padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
    border: `1px solid ${active ? activeColor : "#182040"}`,
    background: active ? activeColor + "22" : "transparent",
    color: active ? activeColor : "#4A5880", fontSize: 13
  }}>{label}</button>
);

function extractTitle(text) {
  const m = text.match(/【書名】([^\n]+)/);
  return m ? m[1].trim() : "";
}

export default function Books() {
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [res, setRes] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { setHistory(getHistory('books')); }, []);

  const run = async () => {
    setLoading(true);
    const r = await callAI(
      "あなたは「本の運命的な出会い」を設計するキュレーターです。出力：\n【書名】（著者名）\n【なぜ今この本なのか】3〜4文、詩的に\n【この本の核心】1〜2文\n【読んだ後のあなたへ】1文\n実在する書籍を推薦してください。",
      `気分：${mood}\nジャンル：${genre}`
    );
    setRes(r);
    saveHistory('books', `${mood}×${genre}`, r);
    setHistory(getHistory('books'));
    setLoading(false);
  };

  const bookTitle = extractTitle(res);
  const amazonUrl = bookTitle
    ? `https://www.amazon.co.jp/s?k=${encodeURIComponent(bookTitle)}&tag=yudaiapps-22`
    : null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>書物</h2>
      <p style={{ color: "#4A5880", margin: "0 0 24px", fontSize: 14 }}>今のあなたに運命の一冊を</p>

      <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 8 }}>今の気分は？</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {moods.map(m => <Chip key={m} label={m} active={mood === m} onClick={() => setMood(m)} activeColor="#A78BFF" />)}
      </div>
      <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 8 }}>ジャンル</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {genres.map(g => <Chip key={g} label={g} active={genre === g} onClick={() => setGenre(g)} activeColor="#5BDFB0" />)}
      </div>

      <Btn onClick={run} disabled={!mood || !genre}>本を見つける</Btn>
      {loading && <Loading />}
      {res && !loading && (
        <div style={{ marginTop: 16, background: "#0A0D20", borderRadius: 12, border: "1px solid #182040", overflow: "hidden" }}>
          <div style={{ padding: 16, color: "#C5D0F0", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{res}</div>
          <div style={{ borderTop: "1px solid #182040", padding: "10px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {amazonUrl && (
              <a href={amazonUrl} target="_blank" rel="noopener noreferrer" style={{
                background: "#FF9900", border: "none", borderRadius: 8,
                color: "#000", fontSize: 12, padding: "6px 14px", cursor: "pointer",
                textDecoration: "none", fontWeight: 600
              }}>Amazonで見る</a>
            )}
            <button onClick={() => share('運命の一冊', res)} style={{
              background: "none", border: "1px solid #182040", borderRadius: 8,
              color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
            }}>シェア / コピー</button>
          </div>
        </div>
      )}
      <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
    </div>
  );
}
