'use client';
import { useState, useEffect } from 'react';
import { callAI, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { supabase } from '../../lib/supabase';

const C = {
  bg:      '#08061A',
  card:    '#100E2A',
  border:  '#1E1A45',
  accent:  '#7C6FFF',
  glow:    '#5B4FFF',
  gold:    '#E8C87A',
  text:    '#E2DCFF',
  muted:   '#6B6490',
  green:   '#4DFFA0',
  soft:    '#2A2560',
};

const EMOTION_COLORS = {
  '喜び':'#FFD93A','joy':'#FFD93A',
  '悲しみ':'#7B9FFF','sadness':'#7B9FFF',
  '怒り':'#FF6B6B','anger':'#FF6B6B',
  '不安':'#C49BFF','anxiety':'#C49BFF',
  '孤独':'#7A8090','loneliness':'#7A8090',
  '希望':'#4DFFA0','hope':'#4DFFA0',
  '疲れ':'#B09070','fatigue':'#B09070',
  '感謝':'#E8C87A','gratitude':'#E8C87A',
  '迷い':'#9A9DB0','confusion':'#9A9DB0',
  '興奮':'#FF9A5A','excitement':'#FF9A5A',
};

const T = {
  ja:{
    title:'内省', subtitle:'毎日の記録が、やがて自分の地図になる',
    tabs:['今日','履歴','パターン'],
    inputLabel:'今日の気持ちや出来事',
    placeholder:'何があったか、どんな気分だったか…思ったこと何でも',
    saveBtn:'記録する', saving:'記録中…', savedMsg:'記録しました',
    emptyHistory:'まだ記録がありません\n今日の気持ちを書いてみましょう',
    patternLock:'あと{n}日分でパターン分析が解放されます',
    patternTitle:'あなたの感情パターン',
    patternBtn:'パターンを分析する', analyzing:'記録を読み解いています…',
    langHint:'EN', todayDone:'今日の記録',
  },
  en:{
    title:'Naïsei', subtitle:'Daily records become a map of yourself',
    tabs:['Today','History','Patterns'],
    inputLabel:"How are you feeling today?",
    placeholder:'What happened, how you felt, what you thought… anything',
    saveBtn:'Record', saving:'Saving…', savedMsg:'Recorded',
    emptyHistory:'No records yet\nWrite about today',
    patternLock:'Pattern analysis unlocks after {n} more days',
    patternTitle:'Your Emotional Patterns',
    patternBtn:'Analyze My Patterns', analyzing:'Reading your records…',
    langHint:'JA', todayDone:"Today's record",
  },
};

const MIN_ENTRIES = 7;
const LOCAL_KEY = 'kokoro_entries';

function loadLocal() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
}
function saveLocal(entry) {
  const prev = loadLocal();
  localStorage.setItem(LOCAL_KEY, JSON.stringify([entry, ...prev].slice(0, 200)));
}
async function saveRemote(userId, entry) {
  if (!supabase) return;
  await supabase.from('daily_entries').insert({
    user_id: userId, entry_date: entry.date,
    mood_text: entry.text, emotion_tags: entry.tags, lang: entry.lang,
  });
}
async function loadRemote(userId) {
  if (!supabase) return [];
  const { data } = await supabase.from('daily_entries').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  return (data || []).map(d => ({
    id: d.id, date: d.entry_date, text: d.mood_text,
    tags: d.emotion_tags || [], lang: d.lang, created_at: d.created_at,
  }));
}
async function extractTags(text, lang) {
  const prompt = lang === 'en'
    ? `Extract 2-4 emotion tags from this journal entry. Output ONLY a JSON array. Example: ["hope","anxiety"]\n\nEntry: "${text}"`
    : `この日記から感情タグを2〜4個抽出。JSON配列のみ出力。例：["希望","不安"]\n\n日記：「${text}」`;
  try {
    const result = await callAI('You extract emotion tags. Output only a JSON array.', prompt, 100);
    const match = result.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch { return []; }
}
async function analyzePatterns(entries, lang) {
  const summary = entries.slice(0, 30).map((e, i) =>
    `${i+1}. [${e.date}] ${e.tags.join(',')} - ${e.text.slice(0, 60)}`).join('\n');
  const prompt = lang === 'en'
    ? `Analyze these journals and find emotional patterns:\n[Pattern 1] ...\n[Pattern 2] ...\n[Insight] ...\n[Message] ...\n\n${summary}`
    : `以下の日記から感情パターンを分析：\n【パターン1】\n【パターン2】\n【洞察】\n【メッセージ】\n\n${summary}`;
  return callAI(
    lang === 'en' ? 'You are a compassionate psychological pattern analyst.' : '共感力の高い心理パターン分析の専門家です。',
    prompt, 800
  );
}

// ── Emotion Tag ──────────────────────────
const EmotionTag = ({ tag, large }) => {
  const color = EMOTION_COLORS[tag] || C.muted;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: large ? '6px 14px' : '4px 10px',
      margin:3, borderRadius:20,
      fontSize: large ? 13 : 11, fontWeight:600,
      background:`${color}18`, color,
      border:`1px solid ${color}40`,
      boxShadow:`0 0 8px ${color}20`,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />
      {tag}
    </span>
  );
};

// ── Entry Card ───────────────────────────
const EntryCard = ({ entry }) => {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background:C.card, border:`1px solid ${C.border}`,
      borderRadius:14, padding:'14px 16px', marginBottom:8,
      cursor:'pointer', transition:'border-color 0.2s',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:C.muted, fontSize:11, letterSpacing:1 }}>
          {entry.date}
        </span>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'flex-end' }}>
          {entry.tags.map(t => <EmotionTag key={t} tag={t} />)}
        </div>
      </div>
      {open && (
        <div style={{ color:C.text, fontSize:13, lineHeight:1.9, marginTop:12,
          paddingTop:12, borderTop:`1px solid ${C.border}` }}>
          {entry.text}
        </div>
      )}
      {!open && (
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.7, marginTop:8 }}>
          {entry.text.slice(0, 80)}{entry.text.length > 80 ? '…' : ''}
        </div>
      )}
    </div>
  );
};

// ── Stats Ring ───────────────────────────
const MiniStat = ({ value, label, color }) => (
  <div style={{ textAlign:'center', flex:1 }}>
    <div style={{ fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    <div style={{ color:C.muted, fontSize:10, marginTop:4 }}>{label}</div>
  </div>
);

// ── Main ─────────────────────────────────
export default function Kokoro() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [tab, setTab] = useState(0);
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newTags, setNewTags] = useState([]);
  const [pattern, setPattern] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [focused, setFocused] = useState(false);
  const t = T[lang];

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

  const today = new Date().toLocaleDateString('en-CA');
  const todayEntry = entries.find(e => e.date === today);
  const remaining = Math.max(0, MIN_ENTRIES - entries.length);
  const canAnalyze = entries.length >= MIN_ENTRIES;
  const streak = entries.length > 0
    ? Math.ceil((new Date() - new Date(entries[entries.length-1]?.date || new Date())) / 86400000) + 1
    : 0;

  const tagCount = {};
  entries.forEach(e => e.tags.forEach(tag => { tagCount[tag] = (tagCount[tag] || 0) + 1; }));
  const topTags = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0,5);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const tags = await extractTags(text, lang);
    const entry = { id:Date.now(), date:today, text, tags, lang, created_at:new Date().toISOString() };
    saveLocal(entry);
    if (auth?.user) await saveRemote(auth.user.id, entry);
    const updated = [entry, ...entries.filter(e => e.date !== today)];
    setEntries(updated);
    setNewTags(tags);
    setText('');
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setNewTags([]); }, 4000);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzePatterns(entries, lang);
    setPattern(result);
    setAnalyzing(false);
  };

  return (
    <div style={{ maxWidth:560, margin:'0 auto', fontFamily:"'Inter', sans-serif", color:C.text }}>

      {/* ヘッダー */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <a href="/" style={{ color:C.muted, fontSize:12, textDecoration:'none', letterSpacing:0.5 }}>← 戻る</a>
        <button onClick={() => { setLang(l => l==='ja'?'en':'ja'); setPattern(''); }} style={{
          padding:'4px 14px', borderRadius:20, cursor:'pointer',
          border:`1px solid ${C.border}`, background:C.card,
          color:C.muted, fontSize:11, fontFamily:'inherit', letterSpacing:1,
        }}>{t.langHint}</button>
      </div>

      {/* ヒーロー */}
      <div style={{
        background:`radial-gradient(ellipse at top, #1A1650 0%, ${C.bg} 70%)`,
        border:`1px solid ${C.border}`,
        borderRadius:20, padding:'28px 24px 24px', marginBottom:20,
      }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🪞</div>
        <h2 style={{ margin:'0 0 4px', fontSize:28, fontWeight:700,
          background:'linear-gradient(135deg, #A89FFF, #E8C87A)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        }}>{t.title}</h2>
        <p style={{ color:C.muted, margin:0, fontSize:13, lineHeight:1.7 }}>{t.subtitle}</p>

        {/* 統計 */}
        {entries.length > 0 && (
          <div style={{
            display:'flex', marginTop:20, padding:'16px 0',
            borderTop:`1px solid ${C.border}`,
          }}>
            <MiniStat value={entries.length} label={lang==='ja'?'記録':'entries'} color={C.accent} />
            <div style={{ width:1, background:C.border }} />
            <MiniStat value={streak} label={lang==='ja'?'日目':'day streak'} color={C.gold} />
            <div style={{ width:1, background:C.border }} />
            <div style={{ flex:2, paddingLeft:16 }}>
              <div style={{ color:C.muted, fontSize:10, marginBottom:6 }}>
                {lang==='ja'?'よく感じること':'Most felt'}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap' }}>
                {topTags.slice(0,3).map(([tag]) => <EmotionTag key={tag} tag={tag} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthBadge />

      {/* タブ */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:C.card,
        borderRadius:14, padding:4, border:`1px solid ${C.border}` }}>
        {t.tabs.map((tb, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex:1, padding:'10px 4px', borderRadius:11,
            background: tab===i ? C.soft : 'transparent',
            border: tab===i ? `1px solid ${C.border}` : '1px solid transparent',
            fontFamily:'inherit', fontSize:12, fontWeight: tab===i ? 700 : 400,
            cursor:'pointer', color: tab===i ? C.text : C.muted,
            transition:'all 0.2s',
          }}>{tb}</button>
        ))}
      </div>

      {/* ── Tab 0: 今日 ── */}
      {tab === 0 && (
        <div>
          {saved ? (
            <div style={{
              padding:'28px 24px', textAlign:'center',
              background:`linear-gradient(135deg, #0A1A18, #0A1220)`,
              border:`1px solid #1A4A30`, borderRadius:16,
            }}>
              <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
              <div style={{ color:C.green, fontSize:16, fontWeight:600, marginBottom:16 }}>
                {t.savedMsg}
              </div>
              {newTags.length > 0 && (
                <div>
                  <div style={{ color:C.muted, fontSize:11, marginBottom:8 }}>
                    {lang==='ja'?'今日の感情':'Today\'s emotions'}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center' }}>
                    {newTags.map(tag => <EmotionTag key={tag} tag={tag} large />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {todayEntry && (
                <div style={{
                  marginBottom:16, padding:'14px 16px',
                  background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:14,
                }}>
                  <div style={{ color:C.muted, fontSize:11, marginBottom:8, letterSpacing:0.5 }}>
                    {t.todayDone}
                  </div>
                  <div style={{ color:C.text, fontSize:13, lineHeight:1.8, marginBottom:10 }}>
                    {todayEntry.text}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap' }}>
                    {todayEntry.tags.map(tag => <EmotionTag key={tag} tag={tag} />)}
                  </div>
                </div>
              )}

              <div style={{
                position:'relative',
                border:`1px solid ${focused ? C.accent : C.border}`,
                borderRadius:16, overflow:'hidden',
                boxShadow: focused ? `0 0 24px ${C.glow}30` : 'none',
                transition:'box-shadow 0.3s, border-color 0.3s',
              }}>
                <div style={{
                  padding:'14px 16px 4px', background:C.card,
                  color:C.muted, fontSize:11, letterSpacing:0.5,
                }}>{t.inputLabel}</div>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={t.placeholder}
                  rows={6}
                  style={{
                    width:'100%', padding:'8px 16px 16px',
                    background:C.card, border:'none',
                    color:C.text, fontSize:14, fontFamily:'inherit',
                    lineHeight:1.9, resize:'vertical', outline:'none',
                    boxSizing:'border-box',
                  }}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                style={{
                  marginTop:12, width:'100%', padding:'15px',
                  background: text.trim() && !saving
                    ? `linear-gradient(135deg, ${C.glow}, #9B8FFF)`
                    : C.card,
                  border: text.trim() && !saving ? 'none' : `1px solid ${C.border}`,
                  borderRadius:14, color: text.trim() && !saving ? '#fff' : C.muted,
                  fontSize:15, fontWeight:700, cursor: text.trim() ? 'pointer' : 'default',
                  fontFamily:'inherit',
                  boxShadow: text.trim() && !saving ? `0 4px 20px ${C.glow}50` : 'none',
                  transition:'all 0.2s',
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
            <div style={{ textAlign:'center', padding:'60px 0', color:C.muted, fontSize:14, whiteSpace:'pre-line', lineHeight:2 }}>
              📝{'\n'}{t.emptyHistory}
            </div>
          ) : (
            <>
              <div style={{ color:C.muted, fontSize:11, marginBottom:14, letterSpacing:0.5 }}>
                {entries.length} {lang==='ja'?'件の記録 · タップで開く':'entries · tap to expand'}
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
            <div style={{ textAlign:'center', padding:'48px 24px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
              <div style={{ color:C.text, fontSize:15, marginBottom:8, lineHeight:1.8 }}>
                {t.patternLock.replace('{n}', remaining)}
              </div>
              <div style={{ color:C.muted, fontSize:12, marginBottom:24 }}>
                {lang==='ja'?'蓄積されるほど、より深いパターンが見えてきます':'More data means deeper patterns'}
              </div>
              <div style={{ background:C.border, borderRadius:8, height:8, maxWidth:240, margin:'0 auto' }}>
                <div style={{
                  width:`${(entries.length/MIN_ENTRIES)*100}%`,
                  background:`linear-gradient(90deg, ${C.glow}, #9B8FFF)`,
                  height:'100%', borderRadius:8, transition:'width 0.5s',
                  boxShadow:`0 0 10px ${C.glow}60`,
                }} />
              </div>
              <div style={{ color:C.muted, fontSize:11, marginTop:8 }}>
                {entries.length} / {MIN_ENTRIES}
              </div>
            </div>
          ) : (
            <div>
              {!pattern && !analyzing && (
                <div style={{ textAlign:'center', padding:'36px 24px' }}>
                  <div style={{
                    width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
                    background:`radial-gradient(circle, ${C.soft}, ${C.card})`,
                    border:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:32,
                  }}>🔍</div>
                  <div style={{ color:C.text, fontSize:14, marginBottom:8, lineHeight:1.8 }}>
                    {lang==='ja' ? `${entries.length}件の記録を分析します` : `Analyzing ${entries.length} journal entries`}
                  </div>
                  <div style={{ color:C.muted, fontSize:12, marginBottom:24 }}>
                    {lang==='ja'?'あなたの感情のパターンを発見します':'Discover your emotional patterns'}
                  </div>
                  <button onClick={handleAnalyze} style={{
                    padding:'14px 36px',
                    background:`linear-gradient(135deg, ${C.glow}, #9B8FFF)`,
                    border:'none', borderRadius:14, color:'#fff',
                    fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    boxShadow:`0 4px 20px ${C.glow}50`,
                  }}>{t.patternBtn}</button>
                </div>
              )}

              {analyzing && (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <div style={{ fontSize:32, marginBottom:16 }}>✨</div>
                  <div style={{ color:C.muted, fontSize:14 }}>{t.analyzing}</div>
                </div>
              )}

              {pattern && !analyzing && (
                <div>
                  <div style={{ color:C.text, fontSize:13, fontWeight:700, marginBottom:12, letterSpacing:0.5 }}>
                    🔍 {t.patternTitle}
                  </div>
                  <div style={{
                    background:C.card, border:`1px solid ${C.border}`,
                    borderRadius:16, padding:20,
                    color:C.text, fontSize:13, lineHeight:2.1,
                    whiteSpace:'pre-wrap',
                  }}>{pattern}</div>
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    <button onClick={handleAnalyze} style={{
                      flex:1, padding:'11px', background:'transparent',
                      border:`1px solid ${C.border}`, borderRadius:10,
                      color:C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                    }}>{lang==='ja'?'再分析':'Re-analyze'}</button>
                    <button onClick={() => share(t.patternTitle, pattern)} style={{
                      flex:1, padding:'11px', background:'transparent',
                      border:`1px solid ${C.border}`, borderRadius:10,
                      color:C.muted, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                    }}>{lang==='ja'?'シェア':'Share'}</button>
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
