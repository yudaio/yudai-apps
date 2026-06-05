'use client';
import { useState, useEffect } from 'react';
import { callAI, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { supabase } from '../../lib/supabase';

// ── デザイントークン ───────────────────────────────
const C = {
  bg:       '#07091A',
  card:     '#0C0F22',
  border:   '#182040',
  accent:   '#5B7BFF',
  gold:     '#C8A84B',
  text:     '#C5D0F0',
  muted:    '#4A5880',
  green:    '#3AFF8A',
  purple:   '#A78BFF',
  red:      '#FF5A5A',
};

const EMOTION_COLORS = {
  '喜び': '#FFD93A', 'joy': '#FFD93A',
  '悲しみ': '#5B7BFF', 'sadness': '#5B7BFF',
  '怒り': '#FF5A5A', 'anger': '#FF5A5A',
  '不安': '#A78BFF', 'anxiety': '#A78BFF',
  '孤独': '#4A5880', 'loneliness': '#4A5880',
  '希望': '#3AFF8A', 'hope': '#3AFF8A',
  '疲れ': '#8B6B4A', 'fatigue': '#8B6B4A',
  '感謝': '#C8A84B', 'gratitude': '#C8A84B',
  '迷い': '#7A8090', 'confusion': '#7A8090',
  '興奮': '#FF9A3A', 'excitement': '#FF9A3A',
};

const T = {
  ja: {
    title: '内省',
    subtitle: '毎日の記録が、やがて自分の地図になる',
    tabs: ['📝 今日', '📅 履歴', '🔍 パターン'],
    inputLabel: '今日の気持ちや出来事を書いてください',
    placeholder: '今日何があったか、どんな気分だったか、思ったこと…何でも',
    saveBtn: '記録する',
    saving: '記録中...',
    savedMsg: '記録しました ✓',
    emptyHistory: 'まだ記録がありません\n今日の気持ちを書いてみましょう',
    patternLock: `パターン分析はあと{n}日分の記録で解放されます`,
    patternTitle: 'あなたの感情パターン',
    patternBtn: 'パターンを分析する',
    analyzing: '記録を読み解いています…',
    shareTitle: '内省パターン',
    langHint: 'EN',
    days: '日',
    entries: '件の記録',
  },
  en: {
    title: 'Naïsei',
    subtitle: 'Daily records become a map of yourself',
    tabs: ['📝 Today', '📅 History', '🔍 Patterns'],
    inputLabel: 'Write about how you feel today',
    placeholder: 'What happened today, how you felt, what you thought… anything',
    saveBtn: 'Record',
    saving: 'Saving…',
    savedMsg: 'Recorded ✓',
    emptyHistory: 'No records yet\nWrite about today',
    patternLock: `Pattern analysis unlocks after {n} more days`,
    patternTitle: 'Your Emotional Patterns',
    patternBtn: 'Analyze My Patterns',
    analyzing: 'Reading your records…',
    shareTitle: 'My Emotional Patterns',
    langHint: 'JA',
    days: ' days',
    entries: ' entries',
  },
};

const MIN_ENTRIES_FOR_PATTERN = 7;
const LOCAL_KEY = 'kokoro_entries';

// ── ローカルストレージ ──────────────────────────────
function loadLocal() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
}
function saveLocal(entry) {
  const prev = loadLocal();
  const updated = [entry, ...prev].slice(0, 200);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}

// ── Supabase ─────────────────────────────────────
async function saveRemote(userId, entry) {
  if (!supabase) return;
  await supabase.from('daily_entries').insert({
    user_id: userId,
    entry_date: entry.date,
    mood_text: entry.text,
    emotion_tags: entry.tags,
    lang: entry.lang,
  });
}

async function loadRemote(userId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  return (data || []).map(d => ({
    id: d.id,
    date: d.entry_date,
    text: d.mood_text,
    tags: d.emotion_tags || [],
    lang: d.lang,
    created_at: d.created_at,
  }));
}

// ── 感情タグ抽出 ──────────────────────────────────
async function extractTags(text, lang) {
  const prompt = lang === 'en'
    ? `Extract 2-4 emotion tags from this journal entry. Output ONLY a JSON array of strings, nothing else. Example: ["hope","anxiety","gratitude"]\n\nEntry: "${text}"`
    : `この日記から感情タグを2〜4個抽出してください。JSONの配列のみ出力。例：["希望","不安","感謝"]\n\n日記：「${text}」`;

  try {
    const result = await callAI('You extract emotion tags from journal entries. Output only a JSON array.', prompt, 100);
    const match = result.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch { return []; }
}

// ── パターン分析 ──────────────────────────────────
async function analyzePatterns(entries, lang) {
  const summary = entries.slice(0, 30).map((e, i) =>
    `${i + 1}. [${e.date}] タグ:${e.tags.join(',')} 内容:${e.text.slice(0, 60)}`
  ).join('\n');

  const prompt = lang === 'en'
    ? `Analyze these journal entries and find the person's emotional patterns. Output:
[Pattern 1] One repeating pattern with specific examples
[Pattern 2] Another pattern
[Pattern 3] A third pattern
[Insight] One deep psychological insight about this person
[Message] One encouraging message to this person

Journal entries:
${summary}`
    : `以下の日記から感情パターンを分析してください。出力：
【パターン1】繰り返されているパターンを具体的な記録を引用しながら
【パターン2】別のパターン
【パターン3】もう一つのパターン
【洞察】この人について深い心理的考察を1〜2文
【メッセージ】この人への温かいメッセージ

日記記録：
${summary}`;

  return callAI(
    lang === 'en'
      ? 'You are a compassionate psychological pattern analyst. Find meaningful patterns in journal entries.'
      : 'あなたは共感力の高い心理パターン分析の専門家です。日記からパターンを発見します。',
    prompt,
    800
  );
}

// ── サブコンポーネント ──────────────────────────────
const EmotionTag = ({ tag }) => {
  const color = EMOTION_COLORS[tag] || C.muted;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', margin: '2px',
      borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>{tag}</span>
  );
};

const EntryCard = ({ entry }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: 14, marginBottom: 8,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ color: C.muted, fontSize: 11 }}>{entry.date}</span>
      <div>{entry.tags.map(t => <EmotionTag key={t} tag={t} />)}</div>
    </div>
    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>
      {entry.text.slice(0, 120)}{entry.text.length > 120 ? '…' : ''}
    </div>
  </div>
);

// ── メインコンポーネント ────────────────────────────
export default function Kokoro() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [tab, setTab] = useState(0);
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pattern, setPattern] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const t = T[lang];

  // 記録を読み込む
  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const remote = await loadRemote(auth.user.id);
        setEntries(remote.length > 0 ? remote : loadLocal());
      } else {
        setEntries(loadLocal());
      }
    }
    load();
  }, [auth?.user]);

  // 今日すでに記録済みか
  const today = new Date().toLocaleDateString('en-CA');
  const todayEntry = entries.find(e => e.date === today);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);

    // 感情タグを抽出
    const tags = await extractTags(text, lang);

    const entry = {
      id: Date.now(),
      date: today,
      text,
      tags,
      lang,
      created_at: new Date().toISOString(),
    };

    saveLocal(entry);
    if (auth?.user) await saveRemote(auth.user.id, entry);

    const updated = [entry, ...entries.filter(e => e.date !== today)];
    setEntries(updated);
    setText('');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzePatterns(entries, lang);
    setPattern(result);
    setAnalyzing(false);
  };

  const remaining = Math.max(0, MIN_ENTRIES_FOR_PATTERN - entries.length);
  const canAnalyze = entries.length >= MIN_ENTRIES_FOR_PATTERN;

  // 感情タグの集計
  const tagCount = {};
  entries.forEach(e => e.tags.forEach(tag => {
    tagCount[tag] = (tagCount[tag] || 0) + 1;
  }));
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <a href="/" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>← 一覧に戻る</a>
        <button onClick={() => { setLang(l => l === 'ja' ? 'en' : 'ja'); setPattern(''); }} style={{
          padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
          border: `1px solid ${C.border}`, background: 'transparent',
          color: C.muted, fontSize: 11, fontFamily: 'inherit',
        }}>{t.langHint}</button>
      </div>

      {/* タイトル */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: C.text, margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{t.title}</h2>
        <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>{t.subtitle}</p>
      </div>

      {/* 統計バー */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: '10px 14px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ color: C.accent, fontSize: 22, fontWeight: 700 }}>{entries.length}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{lang === 'ja' ? '件の記録' : 'entries'}</div>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ color: C.gold, fontSize: 22, fontWeight: 700 }}>
              {Math.ceil((new Date() - new Date(entries[entries.length - 1]?.date || new Date())) / 86400000) + 1}
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>{lang === 'ja' ? '日目' : 'day streak'}</div>
          </div>
          <div style={{ flex: 2, padding: '10px 14px', background: C.card,
            border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>
              {lang === 'ja' ? 'よく感じること' : 'Most felt'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {topTags.map(([tag]) => <EmotionTag key={tag} tag={tag} />)}
            </div>
          </div>
        </div>
      )}

      <AuthBadge />

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {t.tabs.map((tb, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, padding: '10px 4px', background: 'transparent',
            fontFamily: 'inherit', fontSize: 12, fontWeight: tab === i ? 600 : 400,
            border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            color: tab === i ? C.accent : C.muted,
          }}>{tb}</button>
        ))}
      </div>

      {/* ── Tab 0: 今日 ── */}
      {tab === 0 && (
        <div>
          {todayEntry && !saved ? (
            <div style={{ marginBottom: 16, padding: 14, background: C.card,
              border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>
                {lang === 'ja' ? '今日の記録' : "Today's record"}
              </div>
              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
                {todayEntry.text}
              </div>
              <div>{todayEntry.tags.map(t => <EmotionTag key={t} tag={t} />)}</div>
            </div>
          ) : null}

          {saved ? (
            <div style={{ padding: 20, background: '#0A1A10',
              border: `1px solid #1A4A20`, borderRadius: 10,
              color: C.green, textAlign: 'center', fontSize: 15 }}>
              {t.savedMsg}
            </div>
          ) : (
            <>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>{t.inputLabel}</div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t.placeholder}
                rows={6}
                style={{
                  width: '100%', padding: '14px', background: '#0A0D20',
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.text, fontSize: 14, fontFamily: 'inherit',
                  lineHeight: 1.8, resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                style={{
                  marginTop: 12, width: '100%', padding: '13px',
                  background: text.trim() && !saving ? C.accent : '#1A1E38',
                  border: 'none', borderRadius: 10,
                  color: text.trim() && !saving ? '#fff' : C.muted,
                  fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}>
                {saving ? t.saving : t.saveBtn}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Tab 1: 履歴 ── */}
      {tab === 1 && (
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0',
              color: C.muted, fontSize: 14, whiteSpace: 'pre-line' }}>
              📝{'\n'}{t.emptyHistory}
            </div>
          ) : (
            <>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
                {entries.length}{t.entries}
              </div>
              {entries.map(e => <EntryCard key={e.id || e.date} entry={e} />)}
            </>
          )}
        </div>
      )}

      {/* ── Tab 2: パターン ── */}
      {tab === 2 && (
        <div>
          {!canAnalyze ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <div style={{ color: C.text, fontSize: 15, marginBottom: 8 }}>
                {t.patternLock.replace('{n}', remaining)}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>
                {lang === 'ja'
                  ? 'データが蓄積されるほど、より深いパターンが見つかります'
                  : 'More data means deeper patterns'}
              </div>
              {/* プログレスバー */}
              <div style={{ marginTop: 20, background: C.border, borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${(entries.length / MIN_ENTRIES_FOR_PATTERN) * 100}%`,
                  background: C.accent, height: '100%', borderRadius: 4,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
                {entries.length} / {MIN_ENTRIES_FOR_PATTERN}
              </div>
            </div>
          ) : (
            <div>
              {!pattern && !analyzing && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div style={{ color: C.text, fontSize: 14, marginBottom: 16 }}>
                    {lang === 'ja'
                      ? `${entries.length}件の記録からパターンを発見します`
                      : `Analyzing ${entries.length} journal entries`}
                  </div>
                  <button onClick={handleAnalyze} style={{
                    padding: '13px 32px', background: C.accent,
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>{t.patternBtn}</button>
                </div>
              )}

              {analyzing && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14 }}>
                  {t.analyzing}
                </div>
              )}

              {pattern && !analyzing && (
                <div>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                    🔍 {t.patternTitle}
                  </div>
                  <div style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 20,
                    color: C.text, fontSize: 14, lineHeight: 2,
                    whiteSpace: 'pre-wrap',
                  }}>{pattern}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={handleAnalyze} style={{
                      flex: 1, padding: '10px', background: 'transparent',
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{lang === 'ja' ? '再分析' : 'Re-analyze'}</button>
                    <button onClick={() => share(t.shareTitle, pattern)} style={{
                      flex: 1, padding: '10px', background: 'transparent',
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{lang === 'ja' ? 'シェア' : 'Share'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
