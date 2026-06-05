'use client';
import { useState, useEffect } from 'react';
import { share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';
import { supabase } from '../../lib/supabase';

/* ─── デザイントークン ────────────────────────────── */
const C = {
  paper:      '#F5EDD8',
  paperDark:  '#E8D9B8',
  paperDeep:  '#D4C49A',
  ink:        '#2C1A0E',
  inkLight:   '#5C3D1E',
  inkFaded:   '#8B6B4A',
  wood:       '#3D1F0A',
  woodLight:  '#6B3A1F',
  woodMid:    '#8B4513',
  spine1:     '#8B1A1A',  // 赤い背表紙
  spine2:     '#1A3A5C',  // 紺の背表紙
  spine3:     '#1A5C2A',  // 緑の背表紙
  spine4:     '#5C4A1A',  // 茶の背表紙
  spine5:     '#4A1A5C',  // 紫の背表紙
  gold:       '#B8860B',
  goldLight:  '#DAA520',
  red:        '#8B1A1A',
  stamp:      'rgba(139,26,26,0.15)',
};

const font = {
  serif:  "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  mono:   "'Courier New', 'Courier', monospace",
  sans:   "Inter, system-ui, sans-serif",
};

/* GlobalStyle はlayout.jsxに移動済み */

/* ─── 定数 ─────────────────────────────────────────── */
const SHELF_KEY = 'bookshelf_v1';
const SPINE_COLORS = [C.spine1, C.spine2, C.spine3, C.spine4, C.spine5];

const EMOTION_TAGS = {
  ja: ["感動","勇気","共感","驚き","癒し","刺激","切なさ","希望","気づき","孤独"],
  en: ["Moving","Inspiring","Relatable","Surprising","Healing","Stimulating","Bittersweet","Hopeful","Eye-opening","Lonely"],
};

const T = {
  ja: {
    title: "図書館",
    call: "BIBLIOTHECA",
    subtitle: "感情が、あなたの一冊を呼び寄せる",
    inputLabel: "今のあなたの気持ちや状況を書いてください",
    placeholder: "例：3年付き合った人と別れた。正しかったのかまだわからない。前に進みたいが何かが引っかかっている…",
    findBtn: "本を探す",
    searching: "書架を探索中…",
    tabs: ["探索", "本棚", "声"],
    amazonBtn: "入手する",
    shareBtn: "共有",
    noteLabel: "この本の記録",
    notePlaceholder: "この本から得たもの、気づき、感想…",
    phrasePlaceholder: "永遠に残したいフレーズ…",
    emotionLabel: "この本が与えた感情",
    saveNote: "本棚に保存",
    shareNote: "みんなに共有",
    notesSaved: "記録完了",
    shelfEmpty: "本棚はまだ空です",
    communityTitle: "読者たちの声",
    communityEmpty: "最初の声を残してください",
    noResult: "見つかりませんでした。もう少し詳しく書いてみてください。",
    pages: "頁",
    recordedCount: (n) => `${n}冊`,
  },
  en: {
    title: "Library",
    call: "BIBLIOTHECA",
    subtitle: "Your emotions will call forth the book meant for you",
    inputLabel: "Describe your feelings or situation",
    placeholder: "e.g. I ended a long relationship. I don't know if it was right. I want to move on but something holds me back…",
    findBtn: "Find My Book",
    searching: "Searching the stacks…",
    tabs: ["Discover", "Shelf", "Voices"],
    amazonBtn: "Acquire",
    shareBtn: "Share",
    noteLabel: "Record this book",
    notePlaceholder: "What you gained, insights, thoughts…",
    phrasePlaceholder: "A phrase you want to keep forever…",
    emotionLabel: "How this book made you feel",
    saveNote: "Save to shelf",
    shareNote: "Share with world",
    notesSaved: "Recorded",
    shelfEmpty: "Your shelf is empty",
    communityTitle: "Voices from readers",
    communityEmpty: "Be the first to leave a voice",
    noResult: "Nothing found. Try writing more about your situation.",
    pages: "pp.",
    recordedCount: (n) => `${n} book${n !== 1 ? 's' : ''}`,
  },
};

/* ─── ユーティリティ ──────────────────────────────── */
const loadShelf = () => typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem(SHELF_KEY) || '[]') : [];
const addToShelf = (entry) => {
  const u = [entry, ...loadShelf().filter(b => b.id !== entry.id)].slice(0, 50);
  localStorage.setItem(SHELF_KEY, JSON.stringify(u));
};

async function postCommunity(e) {
  if (!supabase) return;
  await supabase.from('book_notes').insert({
    book_title: e.title, phrase: e.phrase,
    note: e.note, emotions: e.emotions, lang: e.lang,
  });
}
async function getCommunity(lang) {
  if (!supabase) return [];
  const { data } = await supabase.from('book_notes').select('*')
    .eq('lang', lang).order('created_at', { ascending: false }).limit(20);
  return data || [];
}

/* ─── 小コンポーネント ────────────────────────────── */
const WoodDivider = () => (
  <div style={{
    height: 6, margin: "0",
    background: `repeating-linear-gradient(90deg, ${C.wood}, ${C.woodLight} 4px, ${C.wood} 8px)`,
    borderTop: `2px solid ${C.gold}`,
    borderBottom: `1px solid ${C.woodLight}`,
  }} />
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: font.mono, fontSize: 10, color: C.inkFaded,
    letterSpacing: "0.2em", textTransform: "uppercase",
    marginBottom: 8, borderLeft: `3px solid ${C.gold}`,
    paddingLeft: 8,
  }}>{children}</div>
);

const PaperTextarea = ({ value, onChange, placeholder, rows = 5 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    className="paper-texture"
    style={{
      width: "100%", padding: "14px 16px",
      background: C.paper,
      border: `1px solid ${C.paperDeep}`,
      borderBottom: `2px solid ${C.inkFaded}`,
      borderRadius: 2,
      color: C.ink, fontSize: 14,
      fontFamily: font.serif, lineHeight: 1.9,
      outline: "none",
      boxShadow: "inset 0 1px 4px rgba(0,0,0,0.1), 2px 3px 8px rgba(0,0,0,0.15)",
    }}
  />
);

const InkBtn = ({ onClick, disabled, children, outline, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "11px 22px",
    background: disabled ? C.paperDark : outline ? 'transparent' : C.ink,
    border: `1px solid ${disabled ? C.paperDeep : outline ? C.inkFaded : C.ink}`,
    borderRadius: 2,
    color: disabled ? C.inkFaded : outline ? C.ink : C.paper,
    fontSize: 13, fontFamily: font.mono,
    letterSpacing: "0.1em", cursor: disabled ? 'default' : 'pointer',
    boxShadow: disabled ? 'none' : outline ? 'none' : '2px 2px 0 rgba(0,0,0,0.3)',
    transition: "all 0.15s",
    ...style,
  }}>{children}</button>
);

const EmotionTag = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "4px 10px", cursor: "pointer",
    fontFamily: font.mono, fontSize: 11,
    border: `1px solid ${active ? C.inkLight : C.paperDeep}`,
    background: active ? C.inkLight : 'transparent',
    color: active ? C.paper : C.inkFaded,
    borderRadius: 2, letterSpacing: "0.05em",
    transition: "all 0.15s",
  }}>{label}</button>
);

const LangToggle = ({ lang, setLang }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {['ja', 'en'].map(l => (
      <button key={l} onClick={() => setLang(l)} style={{
        padding: "3px 10px", cursor: "pointer",
        fontFamily: font.mono, fontSize: 10, letterSpacing: "0.15em",
        border: `1px solid ${l === lang ? C.inkLight : C.paperDeep}`,
        background: l === lang ? C.inkLight : 'transparent',
        color: l === lang ? C.paper : C.inkFaded,
        borderRadius: 2,
      }}>{l.toUpperCase()}</button>
    ))}
  </div>
);

/* ─── カードカタログカード（検索結果） ──────────────── */
function CatalogCard({ book, explanation, lang, onNoted }) {
  const t = T[lang];
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');
  const [phrase, setPhrase] = useState('');
  const [emotions, setEmotions] = useState([]);
  const [busy, setBusy] = useState(false);
  const tags = EMOTION_TAGS[lang];

  const clean = explanation.replace(/【選択】\d+|\[Index\]\s*\d+/g, '').trim();
  const amazonUrl = `https://www.amazon${lang === 'ja' ? '.co.jp' : '.com'}/s?k=${encodeURIComponent(book.title + ' ' + book.authors)}${lang === 'ja' ? '&tag=yudaiapps-22' : ''}`;

  const handleSave = async (pub) => {
    const entry = {
      id: Date.now(), title: book.title, authors: book.authors,
      thumbnail: book.thumbnail, note, phrase, emotions, lang,
      date: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US'),
    };
    addToShelf(entry);
    if (pub) { setBusy(true); await postCommunity(entry); setBusy(false); }
    setSaved(true); onNoted?.();
  };

  return (
    <div className="card-enter" style={{ marginTop: 20 }}>
      {/* カードカタログ風カード */}
      <div style={{
        background: C.paper,
        border: `1px solid ${C.paperDeep}`,
        borderRadius: 2,
        boxShadow: "3px 4px 12px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.8) inset",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* カタログカードの穴（装飾） */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          width: 14, height: 14, borderRadius: "50%",
          background: C.paperDark,
          border: `1px solid ${C.paperDeep}`,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
        }} />

        {/* 上部ヘッダー */}
        <div style={{
          background: C.paperDark,
          borderBottom: `1px solid ${C.paperDeep}`,
          padding: "8px 14px 8px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: font.mono, fontSize: 9,
            color: C.inkFaded, letterSpacing: "0.15em" }}>CATALOG CARD</div>
          <div style={{ fontFamily: font.mono, fontSize: 9, color: C.inkFaded }}>
            {book.publishedDate?.slice(0,4) || '----'}
          </div>
        </div>

        {/* 本体 */}
        <div style={{ display: "flex", gap: 16, padding: "16px 16px 12px" }}>
          {/* 表紙画像 */}
          <div style={{ flexShrink: 0, position: "relative" }}>
            {book.thumbnail ? (
              <img src={book.thumbnail} alt={book.title} style={{
                width: 80, height: 114, objectFit: "cover",
                boxShadow: "3px 3px 10px rgba(0,0,0,0.4), -1px 0 0 rgba(0,0,0,0.2)",
                border: `1px solid ${C.paperDeep}`,
                borderRadius: "0 2px 2px 0",
                display: "block",
              }} />
            ) : (
              <div style={{
                width: 80, height: 114,
                background: `linear-gradient(135deg, ${C.spine2}, #0A2040)`,
                boxShadow: "3px 3px 10px rgba(0,0,0,0.4)",
                borderRadius: "0 2px 2px 0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>📖</div>
            )}
          </div>

          {/* テキスト情報 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: font.serif, fontSize: 16, fontWeight: 700,
              color: C.ink, lineHeight: 1.3, marginBottom: 4,
            }}>{book.title}</div>

            <div style={{
              fontFamily: font.mono, fontSize: 11,
              color: C.inkFaded, marginBottom: 8,
            }}>{book.authors}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              {book.rating && (
                <span style={{
                  fontFamily: font.mono, fontSize: 11, color: C.gold,
                }}>★ {book.rating.toFixed(1)}</span>
              )}
              {book.pageCount && (
                <span style={{ fontFamily: font.mono, fontSize: 10, color: C.inkFaded }}>
                  {book.pageCount} {t.pages}
                </span>
              )}
            </div>

            {/* スタンプ風ラベル */}
            <div style={{
              display: "inline-block",
              border: `2px solid ${C.red}`,
              color: C.red, padding: "1px 8px",
              fontFamily: font.mono, fontSize: 9,
              letterSpacing: "0.15em",
              transform: "rotate(-1.5deg)",
              opacity: 0.7,
            }}>RECOMMENDED</div>
          </div>
        </div>

        {/* 罫線エリア（AIコメント） */}
        <div className="paper-texture" style={{
          borderTop: `1px solid ${C.paperDeep}`,
          padding: "14px 16px",
          minHeight: 80,
        }}>
          <div style={{ fontFamily: font.mono, fontSize: 9,
            color: C.inkFaded, letterSpacing: "0.15em", marginBottom: 8 }}>
            LIBRARIAN'S NOTE
          </div>
          <div style={{
            fontFamily: font.serif, fontSize: 13, color: C.inkLight,
            lineHeight: 2, whiteSpace: "pre-wrap", fontStyle: "italic",
          }}>{clean}</div>
        </div>

        {/* アクション */}
        <div style={{
          borderTop: `2px solid ${C.paperDeep}`,
          padding: "10px 16px",
          display: "flex", gap: 8, justifyContent: "flex-end",
          background: C.paperDark, flexWrap: "wrap",
        }}>
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" style={{
            padding: "8px 16px",
            background: C.wood, border: `1px solid ${C.woodMid}`,
            color: C.paper, fontSize: 12, fontFamily: font.mono,
            textDecoration: "none", letterSpacing: "0.08em",
            boxShadow: "1px 2px 0 rgba(0,0,0,0.3)",
            borderRadius: 2,
          }}>{t.amazonBtn}</a>
          <button onClick={() => share(t.shareBtn, `「${book.title}」${book.authors}\n\n${clean}`)} style={{
            padding: "8px 14px", background: "transparent",
            border: `1px solid ${C.paperDeep}`, borderRadius: 2,
            color: C.inkFaded, fontSize: 12, fontFamily: font.mono,
            cursor: "pointer",
          }}>{t.shareBtn}</button>
          {!saved && (
            <button onClick={() => setShowNote(s => !s)} style={{
              padding: "8px 14px",
              background: showNote ? C.inkLight : "transparent",
              border: `1px solid ${showNote ? C.inkLight : C.paperDeep}`,
              borderRadius: 2,
              color: showNote ? C.paper : C.ink,
              fontSize: 12, fontFamily: font.mono, cursor: "pointer",
            }}>✎ {lang === 'ja' ? '記録する' : 'Record'}</button>
          )}
        </div>
      </div>

      {/* ノート入力 */}
      {showNote && !saved && (
        <div style={{
          marginTop: 8, padding: 16,
          background: C.paper, border: `1px solid ${C.paperDeep}`,
          borderRadius: 2,
          boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
        }}>
          <SectionLabel>{t.noteLabel}</SectionLabel>

          <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkFaded,
            marginBottom: 6 }}>{lang === 'ja' ? '得たもの・感想' : 'What you gained'}</div>
          <PaperTextarea value={note} onChange={setNote} placeholder={t.notePlaceholder} rows={3} />

          <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkFaded,
            margin: "12px 0 6px" }}>{lang === 'ja' ? '心に残ったフレーズ' : 'Memorable phrase'}</div>
          <PaperTextarea value={phrase} onChange={setPhrase} placeholder={t.phrasePlaceholder} rows={2} />

          <div style={{ fontFamily: font.mono, fontSize: 10, color: C.inkFaded,
            margin: "12px 0 8px" }}>{t.emotionLabel}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {tags.map(tag => (
              <EmotionTag key={tag} label={tag}
                active={emotions.includes(tag)}
                onClick={() => setEmotions(e => e.includes(tag) ? e.filter(x=>x!==tag) : [...e,tag])} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <InkBtn onClick={() => handleSave(false)}
              disabled={!note && !phrase && emotions.length === 0}
              outline style={{ flex: 1 }}>{t.saveNote}</InkBtn>
            <InkBtn onClick={() => handleSave(true)}
              disabled={(!note && !phrase && emotions.length === 0) || busy}
              style={{ flex: 1 }}>{busy ? '…' : t.shareNote}</InkBtn>
          </div>
        </div>
      )}

      {saved && (
        <div className="stamp-appear" style={{
          marginTop: 8, padding: "10px 16px",
          background: C.paperDark,
          border: `2px solid ${C.inkFaded}`,
          borderRadius: 2,
          textAlign: "center",
          fontFamily: font.mono, fontSize: 12,
          color: C.inkLight, letterSpacing: "0.15em",
          transform: "rotate(-1deg)",
        }}>✦ {t.notesSaved.toUpperCase()} ✦</div>
      )}
    </div>
  );
}

/* ─── 背表紙リストアイテム ────────────────────────── */
function SpineItem({ item, index, onClick }) {
  const color = SPINE_COLORS[index % SPINE_COLORS.length];
  return (
    <div className="spine-item" onClick={onClick}
      style={{
        display: "flex", gap: 12, padding: "10px 14px",
        background: C.paper,
        border: `1px solid ${C.paperDeep}`,
        borderLeft: `6px solid ${color}`,
        borderRadius: 2, marginBottom: 6,
        boxShadow: "1px 2px 4px rgba(0,0,0,0.12)",
      }}>
      {item.thumbnail && (
        <img src={item.thumbnail} alt="" style={{
          width: 32, height: 46, objectFit: "cover",
          borderRadius: 1, flexShrink: 0,
          border: `1px solid ${C.paperDeep}`,
        }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font.serif, fontSize: 13, fontWeight: 600,
          color: C.ink, marginBottom: 2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.title}</div>
        <div style={{ fontFamily: font.mono, fontSize: 10,
          color: C.inkFaded, marginBottom: 6 }}>{item.authors}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {item.emotions?.slice(0,3).map(e => (
            <span key={e} style={{
              fontSize: 9, padding: "1px 6px",
              background: color + '22', color,
              border: `1px solid ${color}44`,
              fontFamily: font.mono, borderRadius: 1,
            }}>{e}</span>
          ))}
        </div>
      </div>
      <div style={{ fontFamily: font.mono, fontSize: 9, color: C.inkFaded,
        alignSelf: "flex-end", whiteSpace: "nowrap" }}>{item.date}</div>
    </div>
  );
}

/* ─── コミュニティカード ──────────────────────────── */
function VoiceCard({ item }) {
  return (
    <div style={{
      background: C.paper,
      border: `1px solid ${C.paperDeep}`,
      borderRadius: 2, marginBottom: 10, padding: 16,
      boxShadow: "1px 2px 4px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontFamily: font.mono, fontSize: 9,
        color: C.inkFaded, letterSpacing: "0.12em", marginBottom: 8 }}>
        ◎ {item.book_title}
      </div>
      {item.phrase && (
        <div style={{
          fontFamily: font.serif, fontSize: 14, fontStyle: "italic",
          color: C.ink, lineHeight: 1.9,
          borderLeft: `3px solid ${C.gold}`, paddingLeft: 12,
          marginBottom: 8,
        }}>"{item.phrase}"</div>
      )}
      {item.note && (
        <div style={{ fontFamily: font.sans, fontSize: 12,
          color: C.inkFaded, lineHeight: 1.7 }}>{item.note}</div>
      )}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 10 }}>
        {item.emotions?.map(e => (
          <span key={e} style={{
            fontSize: 9, padding: "2px 7px",
            border: `1px solid ${C.paperDeep}`,
            color: C.inkFaded, fontFamily: font.mono,
            borderRadius: 1,
          }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── メインコンポーネント ────────────────────────── */
export default function Books() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shelf, setShelf] = useState([]);
  const [community, setCommunity] = useState([]);
  const t = T[lang];
  const gate = useGate('books');

  useEffect(() => { setInput(''); setResult(null); setError(''); }, [lang]);
  useEffect(() => {
    if (tab === 1) setShelf(loadShelf());
    if (tab === 2) getCommunity(lang).then(setCommunity);
  }, [tab, lang]);

  const run = async () => {
    if (!gate.check() || !input.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, lang }),
      });
      const data = await res.json();
      if (data.error || !data.book) setError(t.noResult);
      else { setResult(data); gate.increment(); }
    } catch { setError(t.noResult); }
    setLoading(false);
  };

  return (
    <div className="books-root" style={{
      maxWidth: 600, margin: "0 auto",
      background: C.wood,
      minHeight: "100vh",
    }}>

      {/* 木製本棚の上段 */}
      <WoodDivider />

      {/* ヘッダー */}
      <div style={{
        background: `linear-gradient(180deg, #1A0A02, ${C.wood})`,
        padding: "20px 20px 0",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <a href="/" style={{
            fontFamily: font.mono, fontSize: 10, color: C.inkFaded,
            textDecoration: "none", letterSpacing: "0.15em",
          }}>← BACK</a>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* 看板風タイトル */}
        <div style={{
          textAlign: "center", padding: "20px 16px 24px",
          borderTop: `1px solid ${C.gold}44`,
          borderBottom: `1px solid ${C.gold}44`,
          marginBottom: 0,
          background: "rgba(0,0,0,0.2)",
        }}>
          <div style={{ fontFamily: font.mono, fontSize: 9,
            color: C.gold + "88", letterSpacing: "0.4em", marginBottom: 8 }}>
            {t.call}
          </div>
          <div style={{
            fontFamily: font.serif, fontSize: 38, fontWeight: 700,
            color: C.goldLight, letterSpacing: "0.05em",
            textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 0 30px rgba(184,134,11,0.3)",
          }}>{t.title}</div>
          <div style={{ fontFamily: font.serif, fontSize: 12, fontStyle: "italic",
            color: C.gold + "88", marginTop: 6 }}>{t.subtitle}</div>
        </div>
      </div>

      {/* 本棚の仕切り */}
      <WoodDivider />

      {/* コンテンツエリア（紙） */}
      <div style={{
        background: C.paperDark,
        padding: "0 16px 40px",
        minHeight: "calc(100vh - 200px)",
      }}>
        {/* AuthBadge & Usage */}
        <div style={{ padding: "12px 0 4px" }}>
          <AuthBadge />
          <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang} />
          {gate.blocked && <PaywallModal onClose={gate.dismiss} lang={lang} />}
        </div>

        {/* タブ（カード目録インデックス風） */}
        <div style={{ display: "flex", gap: 0, marginBottom: 0, marginTop: 8 }}>
          {t.tabs.map((tb, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              flex: 1, padding: "8px 4px 6px",
              fontFamily: font.mono, fontSize: 11, letterSpacing: "0.1em",
              cursor: "pointer", border: "none",
              background: tab === i ? C.paper : C.paperDeep,
              color: tab === i ? C.ink : C.inkFaded,
              fontWeight: tab === i ? 700 : 400,
              borderTop: `3px solid ${tab === i ? C.gold : 'transparent'}`,
              borderRight: `1px solid ${C.paperDeep}`,
              transition: "all 0.15s",
            }}>{tb.toUpperCase()}</button>
          ))}
        </div>

        <div style={{
          background: C.paper,
          border: `1px solid ${C.paperDeep}`,
          borderTop: "none",
          borderRadius: "0 0 2px 2px",
          padding: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          minHeight: 400,
        }}>

          {/* ── Tab 0: 探索 ── */}
          {tab === 0 && (
            <>
              <SectionLabel>{t.inputLabel}</SectionLabel>
              <PaperTextarea value={input} onChange={setInput}
                placeholder={t.placeholder} rows={5} />

              <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
                <InkBtn onClick={run} disabled={!input.trim() || loading} style={{ minWidth: 180 }}>
                  {loading ? t.searching : t.findBtn}
                </InkBtn>
              </div>

              {loading && (
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <div style={{
                    display: "inline-block",
                    width: 32, height: 32,
                    border: `3px solid ${C.paperDeep}`,
                    borderTopColor: C.ink,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ fontFamily: font.mono, fontSize: 11,
                    color: C.inkFaded, marginTop: 10, letterSpacing: "0.1em" }}>
                    {t.searching}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ marginTop: 14, fontFamily: font.mono,
                  fontSize: 12, color: C.red, textAlign: "center" }}>{error}</div>
              )}

              {result && !loading && (
                <CatalogCard book={result.book} explanation={result.explanation}
                  lang={lang} onNoted={() => setShelf(loadShelf())} />
              )}
            </>
          )}

          {/* ── Tab 1: 本棚 ── */}
          {tab === 1 && (
            <>
              {shelf.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 40, opacity: 0.3 }}>📚</div>
                  <div style={{ fontFamily: font.serif, fontStyle: "italic",
                    color: C.inkFaded, marginTop: 12, fontSize: 13 }}>{t.shelfEmpty}</div>
                </div>
              ) : (
                <>
                  <SectionLabel>{t.recordedCount(shelf.length)}</SectionLabel>
                  {shelf.map((item, i) => (
                    <SpineItem key={item.id} item={item} index={i} onClick={() => {}} />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── Tab 2: 声 ── */}
          {tab === 2 && (
            <>
              <SectionLabel>{t.communityTitle}</SectionLabel>
              {community.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontFamily: font.serif, fontStyle: "italic",
                    color: C.inkFaded, fontSize: 13 }}>{t.communityEmpty}</div>
                </div>
              ) : (
                community.map((item, i) => <VoiceCard key={i} item={item} />)
              )}
            </>
          )}
        </div>
      </div>

      <WoodDivider />
    </div>
  );
}
