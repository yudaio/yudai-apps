'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#C8A84B",
  red: "#B91C1C", gold: "#C8A84B", deep: "#1a1200",
};

const QUOTES = [
  { text: "本能に流されるのが動物。理性で本能を制するのが人間。それを極めるのが大和魂だ。", author: "大和の教え" },
  { text: "苦しみを避けることを覚えた人間は、本当の喜びも知らない。", author: "戸塚宏" },
  { text: "自分に負けることが、最大の敗北である。", author: "大和魂の精神" },
  { text: "鍛錬とは、できないことをできるようにすることではなく、やりたくないことをやれるようにすることだ。", author: "戸塚宏" },
  { text: "感情は風のようなもの。帆を張るのか、嵐に飲まれるのかは、理性が決める。", author: "大和の教え" },
  { text: "人は弱い生き物だ。だからこそ、強くなることに価値がある。", author: "戸塚宏" },
  { text: "我慢とは、感情を殺すことではない。感情を見つめ、それでも動じない力だ。", author: "大和魂の精神" },
  { text: "楽を求める心が、人間を腐らせる。", author: "戸塚宏" },
];

const THEORY = [
  {
    title: "本能とは何か",
    icon: "🔥",
    color: "#DC2626",
    content: `本能とは、生物が生まれながらに持つ行動パターンであり、欲求・感情・快楽・苦痛回避の衝動を含む。

人間の本能は主に「生存本能」「快楽追求」「苦痛回避」「社会的承認欲求」の4つに大別される。

本能は悪ではない。生命維持に不可欠なエネルギーであり、行動の原動力だ。しかし制御なき本能は、人を動物レベルの存在に留める。`
  },
  {
    title: "理性とは何か",
    icon: "⚡",
    color: "#3B82F6",
    content: `理性とは、人間固有の「考える力」であり、本能的衝動を認識し、評価し、制御する能力だ。

理性の働きは「過去の反省」「現在の判断」「未来の予測」の3軸で機能する。

戸塚宏が指摘したのは、現代の教育が理性の訓練を怠り、子供の本能をそのまま肯定しすぎている点だ。苦しみを与えないことが優しさではなく、苦しみを乗り越える力を育てることこそが真の教育だという。`
  },
  {
    title: "本能と理性の統合",
    icon: "☯",
    color: "#C8A84B",
    content: `大和魂の本質は「本能を否定せず、理性で昇華させる」ことにある。

武士道の「克己（こっき）」—自己に打ち克つ—は、本能を殺すことではなく、本能を見つめた上で、より高い目的のために動く選択ができることを指す。

戸塚の教育論の核心：人間は楽を求める本能がある。しかし、あえて苦しみを選ぶ訓練を通じて初めて、本能を超えた「意志」が育つ。これが自己成長の原理だ。`
  },
  {
    title: "戸塚宏の教育哲学",
    icon: "⚓",
    color: "#7C3AED",
    content: `戸塚宏（1940年〜）は戸塚ヨットスクールを設立した教育者。その教育論は賛否両論を生んだが、核心にある哲学は現代に問いを投げかける。

【主要思想】
・「甘え」の排除：苦しみを与えないことは、苦しみへの耐性をなくす
・身体を通じた精神鍛錬：頭で理解するだけでなく、体で体得する
・本能的快楽追求への警鐘：スマホ・ゲーム依存は本能の奴隷化だ

※注：戸塚の実践的方法については法的・倫理的な議論がある。ここでは教育哲学としての思想に焦点を当てる。`
  },
];

const QUIZ = [
  { q: "嫌なことがあると、すぐに誰かに愚痴りたくなる", instinct: 2 },
  { q: "食べたいものより、体に良いものを選べる", instinct: -2 },
  { q: "感情が高ぶると、後先考えずに行動してしまう", instinct: 3 },
  { q: "目標のためなら、遊びや娯楽を我慢できる", instinct: -3 },
  { q: "怠けたい気持ちに負けることが多い", instinct: 2 },
  { q: "困難な状況でも、冷静に次の手を考えられる", instinct: -2 },
  { q: "承認されないと、やる気が出ない", instinct: 2 },
  { q: "批判を受けても、感情的にならず受け入れられる", instinct: -2 },
  { q: "楽しい誘いがあると、やるべきことを後回しにしがち", instinct: 3 },
  { q: "長期的な利益のために、今の苦しみを選べる", instinct: -3 },
];

function TheoryTab() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
        本能と理性の関係を理解することが、自己を知る第一歩だ。
      </p>
      {THEORY.map((t, i) => (
        <div key={i} style={{
          background: C.card, border: `1px solid ${open === i ? t.color + "66" : C.border}`,
          borderLeft: `3px solid ${t.color}`, borderRadius: 10, marginBottom: 10, overflow: "hidden"
        }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, textAlign: "left"
          }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ color: C.text, fontSize: 14, fontWeight: 600, flex: 1 }}>{t.title}</span>
            <span style={{ color: C.muted, fontSize: 12 }}>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 16px 16px", color: C.muted, fontSize: 12, lineHeight: 1.9, whiteSpace: "pre-line" }}>
              {t.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuizTab() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const answered = Object.keys(answers).length;
  const total = QUIZ.length;

  function calcResult() {
    let score = 0;
    Object.entries(answers).forEach(([i, a]) => {
      const q = QUIZ[parseInt(i)];
      score += a === "yes" ? q.instinct : -q.instinct;
    });
    setResult(score);
  }

  function getLabel(score) {
    if (score >= 10) return { label: "本能優位型", icon: "🔥", color: "#DC2626", desc: "感情と直感で動くタイプ。エネルギーは豊富だが、衝動に流されやすい。理性の訓練が鍵。" };
    if (score >= 4) return { label: "本能寄り", icon: "🌊", color: "#F97316", desc: "感情豊かで行動力があるが、長期的視点が弱い。日々の内省習慣を持つと大きく変わる。" };
    if (score >= -3) return { label: "バランス型", icon: "☯", color: "#C8A84B", desc: "本能と理性のバランスがとれている。大和魂の土台がある。さらに深める余地がある。" };
    if (score >= -9) return { label: "理性寄り", icon: "⚡", color: "#3B82F6", desc: "論理的で自制心が強い。ただし感情を抑圧しすぎていないか確認を。本能のエネルギーも活かせ。" };
    return { label: "理性優位型", icon: "🧊", color: "#6366F1", desc: "高い自制心を持つ。感情・直感を封じすぎると創造性や生命力が失われる。本能と対話せよ。" };
  }

  if (result !== null) {
    const r = getLabel(result);
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 60, margin: "20px 0 10px" }}>{r.icon}</div>
        <div style={{ color: r.color, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{r.label}</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 20, padding: "0 10px" }}>{r.desc}</div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ color: C.muted, fontSize: 11 }}>スコア</div>
          <div style={{ color: r.color, fontSize: 28, fontWeight: 700 }}>{result > 0 ? `+${result}` : result}</div>
          <div style={{ color: C.muted, fontSize: 11 }}>本能← 0 →理性</div>
        </div>
        <button onClick={() => { setAnswers({}); setResult(null); }} style={{
          background: C.gold + "22", border: `1px solid ${C.gold}44`, color: C.gold,
          borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13
        }}>もう一度診断する</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
        各質問に「はい」か「いいえ」で答えよ。 ({answered}/{total})
      </p>
      <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${(answered / total) * 100}%`, background: C.gold, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      {QUIZ.map((q, i) => (
        <div key={i} style={{
          background: answers[i] !== undefined ? C.card : "#0a0c1e",
          border: `1px solid ${answers[i] !== undefined ? C.gold + "44" : C.border}`,
          borderRadius: 10, padding: 14, marginBottom: 10
        }}>
          <div style={{ color: C.text, fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
            {i + 1}. {q.q}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["yes", "no"].map(a => (
              <button key={a} onClick={() => setAnswers({ ...answers, [i]: a })} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: answers[i] === a ? (a === "yes" ? "#DC262622" : "#3B82F622") : "transparent",
                border: `1px solid ${answers[i] === a ? (a === "yes" ? "#DC2626" : "#3B82F6") : C.border}`,
                color: answers[i] === a ? (a === "yes" ? "#DC2626" : "#3B82F6") : C.muted,
              }}>{a === "yes" ? "はい" : "いいえ"}</button>
            ))}
          </div>
        </div>
      ))}
      {answered === total && (
        <button onClick={calcResult} style={{
          width: "100%", background: C.gold + "22", border: `1px solid ${C.gold}`,
          color: C.gold, borderRadius: 10, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 8
        }}>診断結果を見る →</button>
      )}
    </div>
  );
}

function LogTab() {
  const KEY = "yamato_logs";
  const [logs, setLogs] = useState([]);
  const [text, setText] = useState("");
  const [tag, setTag] = useState("内省");
  const TAGS = ["内省", "本能の気づき", "理性の勝利", "敗北・反省", "鍛錬記録"];

  useEffect(() => {
    try { setLogs(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);

  function save() {
    if (!text.trim()) return;
    const entry = { text: text.trim(), tag, date: new Date().toLocaleDateString("ja-JP"), id: Date.now() };
    const next = [entry, ...logs];
    setLogs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setText("");
  }

  function del(id) {
    const next = logs.filter(l => l.id !== id);
    setLogs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  const tagColors = { "内省": "#4A5880", "本能の気づき": "#DC2626", "理性の勝利": "#3B82F6", "敗北・反省": "#7C3AED", "鍛錬記録": "#C8A84B" };

  return (
    <div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>今日の気づき・内省を記録せよ。</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)} style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            background: tag === t ? tagColors[t] + "33" : "transparent",
            border: `1px solid ${tag === t ? tagColors[t] : C.border}`,
            color: tag === t ? tagColors[t] : C.muted,
          }}>{t}</button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="今日、本能に負けたか？理性が勝ったか？何に気づいたか？"
        style={{
          width: "100%", minHeight: 100, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 12, color: C.text, fontSize: 13, lineHeight: 1.7,
          resize: "vertical", boxSizing: "border-box", fontFamily: "inherit"
        }}
      />
      <button onClick={save} style={{
        width: "100%", background: C.gold + "22", border: `1px solid ${C.gold}44`,
        color: C.gold, borderRadius: 8, padding: "10px 0", cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 8
      }}>記録する</button>
      <div style={{ marginTop: 20 }}>
        {logs.length === 0 && <p style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>記録なし。今日から始めよ。</p>}
        {logs.map(l => (
          <div key={l.id} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${tagColors[l.tag] || C.muted}`,
            borderRadius: 10, padding: 12, marginBottom: 10
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: (tagColors[l.tag] || C.muted) + "22", color: tagColors[l.tag] || C.muted,
                border: `1px solid ${(tagColors[l.tag] || C.muted)}44` }}>{l.tag}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: C.muted, fontSize: 10 }}>{l.date}</span>
                <button onClick={() => del(l.id)} style={{
                  background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: "0 4px"
                }}>×</button>
              </div>
            </div>
            <p style={{ color: C.text, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{l.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuotesTab() {
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("yamato_saved_quotes") || "[]"); } catch { return []; }
  });

  const q = QUOTES[idx];

  function toggleSave() {
    const next = saved.includes(idx) ? saved.filter(i => i !== idx) : [...saved, idx];
    setSaved(next);
    localStorage.setItem("yamato_saved_quotes", JSON.stringify(next));
  }

  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, #1a1200, #0C0F22)",
        border: `1px solid ${C.gold}44`, borderRadius: 16, padding: "32px 20px", textAlign: "center", marginBottom: 20
      }}>
        <div style={{ fontSize: 36, marginBottom: 20 }}>⚔️</div>
        <blockquote style={{
          color: C.text, fontSize: 15, lineHeight: 1.9, fontStyle: "italic",
          margin: "0 0 16px", borderLeft: "none", padding: 0
        }}>「{q.text}」</blockquote>
        <div style={{ color: C.gold, fontSize: 12 }}>— {q.author}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setIdx((idx - 1 + QUOTES.length) % QUOTES.length)} style={{
          flex: 1, background: C.card, border: `1px solid ${C.border}`, color: C.muted,
          borderRadius: 8, padding: 10, cursor: "pointer", fontSize: 13
        }}>← 前へ</button>
        <button onClick={toggleSave} style={{
          flex: 1, background: saved.includes(idx) ? C.gold + "22" : C.card,
          border: `1px solid ${saved.includes(idx) ? C.gold : C.border}`,
          color: saved.includes(idx) ? C.gold : C.muted,
          borderRadius: 8, padding: 10, cursor: "pointer", fontSize: 13
        }}>{saved.includes(idx) ? "★ 保存済み" : "☆ 保存"}</button>
        <button onClick={() => setIdx((idx + 1) % QUOTES.length)} style={{
          flex: 1, background: C.card, border: `1px solid ${C.border}`, color: C.muted,
          borderRadius: 8, padding: 10, cursor: "pointer", fontSize: 13
        }}>次へ →</button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
        {QUOTES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
            background: i === idx ? C.gold : C.border, padding: 0
          }} />
        ))}
      </div>
      {saved.length > 0 && (
        <div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>★ 保存した名言</div>
          {saved.map(i => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${C.gold}33`, borderLeft: `3px solid ${C.gold}`,
              borderRadius: 10, padding: 12, marginBottom: 8
            }}>
              <p style={{ color: C.text, fontSize: 12, lineHeight: 1.7, margin: "0 0 4px", fontStyle: "italic" }}>
                「{QUOTES[i].text}」
              </p>
              <span style={{ color: C.gold, fontSize: 11 }}>— {QUOTES[i].author}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Yamato() {
  const [tab, setTab] = useState("theory");
  const TABS = [
    { id: "theory", label: "理論", icon: "📜" },
    { id: "quiz",   label: "自己診断", icon: "🔍" },
    { id: "log",    label: "内省ログ", icon: "📝" },
    { id: "quotes", label: "名言集", icon: "⚔️" },
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⛩️</div>
        <h1 style={{ color: C.gold, fontSize: 22, margin: "0 0 4px", letterSpacing: "0.1em" }}>大和魂教育</h1>
        <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>本能と理性を知り、自己を鍛える</p>
      </div>

      <div style={{ display: "flex", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, overflow: "hidden" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 4px", border: "none", cursor: "pointer",
            background: tab === t.id ? C.gold + "22" : "transparent",
            borderBottom: `2px solid ${tab === t.id ? C.gold : "transparent"}`,
            color: tab === t.id ? C.gold : C.muted, fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
          }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "theory" && <TheoryTab />}
      {tab === "quiz"   && <QuizTab />}
      {tab === "log"    && <LogTab />}
      {tab === "quotes" && <QuotesTab />}
    </div>
  );
}
