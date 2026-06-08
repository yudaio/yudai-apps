'use client';
import Link from 'next/link';
import { useState } from 'react';

const C = { bg:"#07091A", card:"#0C0F22", border:"#182040", text:"#C5D0F0", muted:"#4A5880", accent:"#5B7BFF" };

const FEATURED = [
  { id:"konoka", icon:"🌸", title:"このちゃんAI",  sub:"松田好花の話し方でAIと会話", color:"#A78BFA", tag:"チャット" },
  { id:"koe",    icon:"🕯️", title:"声の遺産",      sub:"あの人の言葉を、永遠に",     color:"#C8A84B", tag:"追悼" },
  { id:"monster",icon:"👾", title:"言葉モンスター", sub:"日記から唯一の存在が生まれる", color:"#059669", tag:"図鑑" },
];

const APPS = [
  { id:"kokoro", icon:"🪞", title:"内省",       sub:"毎日の記録が自分の地図になる", color:"#7C6FFF", tag:"日記" },
  { id:"books",  icon:"📖", title:"図書館",     sub:"感情が呼び寄せる、運命の一冊", color:"#4F46E5", tag:"本" },
  { id:"dream",  icon:"🌙", title:"夢映像化",   sub:"消えゆく夢を詩と画像に残す",   color:"#0D9488", tag:"AI画像" },
  { id:"fate",   icon:"🔮", title:"運命診断",   sub:"統計と心理学が運命を解析",     color:"#7C3AED", tag:"診断" },
  { id:"rant",   icon:"💢", title:"鬱憤爆発",   sub:"理不尽を3つの視点で解剖する",  color:"#DC2626", tag:"社会" },
  { id:"muda",   icon:"🧠", title:"無駄削減",   sub:"認知負荷を削ぎ落として時間を取り戻す", color:"#0891B2", tag:"効率" },
  { id:"genki",  icon:"🌐", title:"元気玉",     sub:"あなたの気分が世界と繋がる",   color:"#D97706", tag:"気分" },
  { id:"vending",icon:"🎰", title:"自販機マップ",sub:"近くの自販機を瞬時に発見",    color:"#2563EB", tag:"MAP" },
];

export default function Hub() {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 40px" }}>

      {/* ヘッダー */}
      <div style={{ textAlign: "center", padding: "36px 0 28px" }}>
        <div style={{ fontSize: 13, color: C.muted, letterSpacing: "0.15em", marginBottom: 10 }}>YUDAI APPS</div>
        <h1 style={{ color: C.text, fontSize: 28, margin: "0 0 10px", fontWeight: 700, letterSpacing: "-0.5px" }}>
          遊べる・使える・感じられる
        </h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.8 }}>
          AIと感情が交差する、11本のアプリ
        </p>
      </div>

      {/* 注目の3本 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>
          ✦ おすすめ
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {FEATURED.map(app => (
            <Link key={app.id} href={`/${app.id}`} style={{ textDecoration: "none" }}>
              <div
                onMouseEnter={() => setHover(app.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  padding: "16px 14px",
                  background: hover === app.id ? "#0E1228" : `linear-gradient(135deg, #0C0F22, #0A0D20)`,
                  border: `1px solid ${hover === app.id ? app.color + "66" : app.color + "33"}`,
                  borderRadius: 14, cursor: "pointer", transition: "all 0.18s",
                  transform: hover === app.id ? "translateY(-3px)" : "none",
                  boxShadow: hover === app.id ? `0 8px 24px ${app.color}22` : "none",
                }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{app.icon}</div>
                <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, display: "inline-block",
                  background: app.color + "22", color: app.color, marginBottom: 8 }}>{app.tag}</div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{app.title}</div>
                <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.5 }}>{app.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* その他のアプリ */}
      <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>
        すべてのアプリ
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {APPS.map(app => (
          <Link key={app.id} href={`/${app.id}`} style={{ textDecoration: "none" }}>
            <div
              onMouseEnter={() => setHover(app.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                padding: "16px",
                background: hover === app.id ? "#0E1228" : C.card,
                border: `1px solid ${hover === app.id ? app.color + "44" : C.border}`,
                borderLeft: `3px solid ${app.color}`,
                borderRadius: 12, cursor: "pointer", transition: "all 0.18s",
                transform: hover === app.id ? "translateY(-2px)" : "none",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{app.icon}</span>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8,
                  background: app.color + "22", color: app.color }}>{app.tag}</span>
              </div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{app.title}</div>
              <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{app.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <p style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 24, lineHeight: 1.8 }}>
        カードをタップしてデモを体験
      </p>
    </div>
  );
}
