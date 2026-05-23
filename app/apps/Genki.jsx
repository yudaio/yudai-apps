'use client';
import { useState, useEffect } from 'react';
import { Btn, BackBtn, saveHistory, getHistory, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';

const WORLD = [
  { city:"東京", mood:72, flag:"🇯🇵" }, { city:"NY", mood:58, flag:"🇺🇸" },
  { city:"ロンドン", mood:65, flag:"🇬🇧" }, { city:"パリ", mood:61, flag:"🇫🇷" },
  { city:"ソウル", mood:69, flag:"🇰🇷" }, { city:"バンコク", mood:80, flag:"🇹🇭" },
  { city:"シドニー", mood:75, flag:"🇦🇺" }, { city:"ムンバイ", mood:67, flag:"🇮🇳" },
];
const labels = ["","最悪","辛い","重い","しんどい","普通","まあまあ","良い","良い","とても良い","最高"];

export default function Genki() {
  const [mood, setMood] = useState(7);
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const h = getHistory('genki');
    setStreak(h.length);
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    saveHistory('genki', `気分:${mood}`, `${labels[mood]}（${mood}/10）`);
    setStreak(s => s + 1);
  };

  const color = mood >= 8 ? "#3AFF8A" : mood >= 5 ? "#FFD93A" : "#FF5A5A";
  const world = submitted ? WORLD.map((w, i) => i === 0 ? { ...w, mood: mood * 10 } : w) : WORLD;
  const avg = Math.round(world.reduce((a, b) => a + b.mood, 0) / world.length);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>元気玉</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>あなたの気分が世界と繋がる</p>

      {streak > 0 && (
        <div style={{ padding: "8px 14px", background: "#0A1A30", border: "1px solid #182040",
          borderRadius: 8, marginBottom: 16, color: "#5B7BFF", fontSize: 13 }}>
          🔥 {streak}日連続チェックイン中
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 64, color, fontWeight: 700, marginBottom: 4 }}>{mood}</div>
        <div style={{ color, fontSize: 16, marginBottom: 16 }}>{labels[mood]}</div>
        <input type="range" min={1} max={10} value={mood}
          onChange={e => { setMood(+e.target.value); setSubmitted(false); }}
          style={{ width: "100%", accentColor: color }} />
        <div style={{ display: "flex", justifyContent: "space-between", color: "#4A5880", fontSize: 11, marginTop: 4 }}>
          <span>最悪</span><span>最高</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <Btn onClick={handleSubmit}>世界に送る</Btn>
          {submitted && (
            <button onClick={() => share('今日の気分', `今日の気分は${mood}/10（${labels[mood]}）。世界平均は${avg}/10。`)}
              style={{ padding: "11px 22px", background: "none", border: "1px solid #182040",
                borderRadius: 10, color: "#4A5880", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              シェア
            </button>
          )}
        </div>
        {submitted && (
          <div style={{ marginTop: 12, color: "#4A5880", fontSize: 13 }}>
            世界平均 <span style={{ color: "#C5D0F0", fontWeight: 700 }}>{avg}/100</span> に対して
            あなたは <span style={{ color, fontWeight: 700 }}>{mood * 10}/100</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {world.map(w => {
          const c = w.mood >= 70 ? "#3AFF8A" : w.mood >= 55 ? "#FFD93A" : "#FF5A5A";
          return (
            <div key={w.city} style={{ padding: 12, background: "#0C0F22", border: "1px solid #182040", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#C5D0F0" }}>{w.flag} {w.city}</span>
                <span style={{ color: c, fontSize: 13, fontWeight: 700 }}>{w.mood}</span>
              </div>
              <div style={{ height: 4, background: "#182040", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${w.mood}%`, background: c, borderRadius: 2, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
