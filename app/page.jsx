'use client';
import Link from 'next/link';
import { useState } from 'react';

const C = { bg:"#07091A", card:"#0C0F22", border:"#182040", text:"#C5D0F0", muted:"#4A5880", accent:"#5B7BFF" };

const APPS = [
  { id:"fate",    icon:"🔮", title:"運命診断",     sub:"統計と心理学が運命を解析",       score:82, color:"#7C3AED", tag:"AI" },
  { id:"muda",    icon:"🧠", title:"無駄削減",     sub:"認知負荷を科学的に削ぎ落とす",   score:72, color:"#0891B2", tag:"AI" },
  { id:"vending", icon:"🎰", title:"自販機マップ", sub:"瞬時に見つかる・B2B設計",        score:71, color:"#2563EB", tag:"MAP" },
  { id:"genki",   icon:"🌐", title:"元気玉",       sub:"感情チェックイン×世界可視化",    score:75, color:"#D97706", tag:"MOOD" },
  { id:"monster", icon:"👾", title:"言葉モンスター",sub:"日記から唯一の存在が生まれる",  score:83, color:"#059669", tag:"AI" },
  { id:"books",   icon:"📖", title:"書物",         sub:"運命的な本との出会いを設計",     score:80, color:"#4F46E5", tag:"AI" },
  { id:"rant",    icon:"💢", title:"鬱憤爆発",     sub:"社会問題をAIが3視点で解剖",      score:73, color:"#DC2626", tag:"AI" },
  { id:"dream",   icon:"🌙", title:"夢映像化",     sub:"消えゆく夢を詩的散文に永遠化",   score:80, color:"#0D9488", tag:"AI" },
  { id:"kokoro",  icon:"🪞", title:"内省",         sub:"毎日の記録が自分の地図になる",   score:95, color:"#5B7BFF", tag:"NEW" },
];

export default function Hub() {
  const [hover, setHover] = useState(null);
  const avg = Math.round(APPS.reduce((a, b) => a + b.score, 0) / APPS.length);
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>
      <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
        <h1 style={{ color: C.text, fontSize: 26, margin: "0 0 8px", letterSpacing: "-0.5px" }}>App Portfolio</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          平均スコア <span style={{ color: C.accent, fontWeight: 700 }}>{avg}点</span> · 8アプリ · AI搭載6本
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {APPS.map(app => (
          <Link key={app.id} href={`/${app.id}`} style={{ textDecoration: "none" }}>
            <div
              onMouseEnter={() => setHover(app.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                padding: "18px", background: hover === app.id ? "#0E1228" : C.card,
                border: `1px solid ${hover === app.id ? app.color + "44" : C.border}`,
                borderLeft: `3px solid ${app.color}`,
                borderRadius: 12, cursor: "pointer", transition: "all 0.18s",
                transform: hover === app.id ? "translateY(-2px)" : "none", height: "100%",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{app.icon}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10,
                    background: app.color + "22", color: app.color, border: `1px solid ${app.color}44` }}>{app.tag}</span>
                  <span style={{ fontSize: 12, color: app.color, fontWeight: 700 }}>{app.score}</span>
                </div>
              </div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{app.title}</div>
              <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{app.sub}</div>
            </div>
          </Link>
        ))}
      </div>
      <p style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 16 }}>
        カードをクリックしてデモを体験 · AI搭載アプリはClaude APIに直接接続
      </p>
    </div>
  );
}
