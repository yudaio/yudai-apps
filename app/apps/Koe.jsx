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
  accent:   '#C8A84B',
  accentDim:'#4A3A1A',
  text:     '#E8DDD0',
  muted:    '#6B5E4E',
  mutedLight:'#9A8E7E',
  warm:     '#F5EDD8',
  warmDark: '#D4C49A',
  green:    '#3AFF8A',
  red:      '#FF5A5A',
};

const T = {
  ja: {
    title: '声の遺産',
    subtitle: 'あの人の言葉を、永遠に',
    tabs: ['👤 人を登録', '💬 話しかける', '📜 記録'],
    profileLabel: 'この人は誰ですか？',
    namePlaceholder: '例：父、祖母、田中さん',
    relPlaceholder: '例：父親、恩師、親友',
    echoLabel: 'この人の言葉・口癖・思い出を追加',
    echoPlaceholder: '例：「失敗してもええ、また立ち上がれ」が口癖だった。\n朝は必ずコーヒーを飲みながら新聞を読んでいた。\nいつも「ありがとう」を忘れない人だった。',
    addEcho: '追加する',
    talkLabel: 'この人に話しかけてみてください',
    talkPlaceholder: '例：最近仕事で失敗して落ち込んでいるんだけど、どう思う？',
    askBtn: '話しかける',
    asking: '…',
    echoCount: (n) => `${n}件の言葉が記録されています`,
    echoEmpty: 'まだ言葉が記録されていません。\nこの人の口癖や思い出を追加してください。',
    profileEmpty: 'まだ誰も登録されていません。\n大切な人を登録してください。',
    selectPerson: 'この人に話しかける',
    addPerson: '+ 新しい人を登録',
    saved: '保存しました ✓',
    langBtn: 'EN',
    conversationEmpty: 'まだ会話がありません',
    youLabel: 'あなた',
  },
  en: {
    title: 'Voice Legacy',
    subtitle: 'Keep their words alive, forever',
    tabs: ['👤 Register', '💬 Talk', '📜 History'],
    profileLabel: 'Who is this person?',
    namePlaceholder: 'e.g. Dad, Grandma, Mr. Tanaka',
    relPlaceholder: 'e.g. Father, Mentor, Best friend',
    echoLabel: 'Add their words, phrases, memories',
    echoPlaceholder: 'e.g. He always said "Try again" when I failed.\nShe started every morning with coffee and the newspaper.\nThey never forgot to say thank you.',
    addEcho: 'Add',
    talkLabel: 'Talk to them',
    talkPlaceholder: 'e.g. I failed at work today and I\'m feeling down. What do you think?',
    askBtn: 'Talk',
    asking: '…',
    echoCount: (n) => `${n} memories recorded`,
    echoEmpty: 'No memories recorded yet.\nAdd their phrases and stories.',
    profileEmpty: 'No one registered yet.\nAdd someone important to you.',
    selectPerson: 'Talk to this person',
    addPerson: '+ Register someone',
    saved: 'Saved ✓',
    langBtn: 'JA',
    conversationEmpty: 'No conversation yet',
    youLabel: 'You',
  },
};

const PROFILES_KEY = 'koe_profiles';
const CONVOS_KEY   = 'koe_convos';

function loadProfiles() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
}
function saveProfiles(p) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(p));
}
function loadConvos(profileId) {
  if (typeof window === 'undefined') return [];
  const all = JSON.parse(localStorage.getItem(CONVOS_KEY) || '{}');
  return all[profileId] || [];
}
function saveConvo(profileId, convo) {
  const all = JSON.parse(localStorage.getItem(CONVOS_KEY) || '{}');
  all[profileId] = [convo, ...(all[profileId] || [])].slice(0, 50);
  localStorage.setItem(CONVOS_KEY, JSON.stringify(all));
}

// ── AIとして話す ──────────────────────────────────
async function talkAs(person, echoes, question, lang) {
  const echoText = echoes.map((e, i) => `${i + 1}. ${e.text}`).join('\n');
  const system = lang === 'en'
    ? `You ARE ${person.name} (${person.rel}). Speak in first person as them.
Respond based on their personality shown in these memories:
${echoText}

Rules:
- Speak as ${person.name}, not about them
- Use their speech patterns from the memories
- Be warm and authentic
- Keep response under 150 words
- If you don't have enough information, respond gently based on their personality`
    : `あなたは${person.name}（${person.rel}）本人です。一人称で話してください。
以下の思い出・言葉からその人の人柄を読み取って応答してください：
${echoText}

ルール：
- ${person.name}として話す（「〜についての〜さんは」ではなく「私は〜」）
- 思い出から読み取れる口癖・話し方を使う
- 温かく、自然に
- 150字以内
- 情報が少なければ人柄から想像して優しく応答`;

  return callAI(system, question, 300);
}

export default function Koe() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [tab, setTab] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);  // 選択中の人
  const [convos, setConvos] = useState([]);

  // 登録フォーム
  const [name, setName] = useState('');
  const [rel, setRel] = useState('');
  const [echoText, setEchoText] = useState('');
  const [saved, setSaved] = useState(false);

  // 会話
  const [question, setQuestion] = useState('');
  const [talking, setTalking] = useState(false);

  const t = T[lang];

  useEffect(() => {
    const p = loadProfiles();
    setProfiles(p);
    if (p.length > 0 && !selected) setSelected(p[0]);
  }, []);

  useEffect(() => {
    if (selected) setConvos(loadConvos(selected.id));
  }, [selected]);

  // 新しい人を登録
  const handleAddProfile = () => {
    if (!name.trim()) return;
    const profile = {
      id: Date.now(),
      name: name.trim(),
      rel: rel.trim(),
      echoes: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...profiles, profile];
    saveProfiles(updated);
    setProfiles(updated);
    setSelected(profile);
    setName(''); setRel('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTab(1);
  };

  // 言葉・思い出を追加
  const handleAddEcho = () => {
    if (!echoText.trim() || !selected) return;
    const echo = { id: Date.now(), text: echoText.trim() };
    const updated = profiles.map(p =>
      p.id === selected.id
        ? { ...p, echoes: [...p.echoes, echo] }
        : p
    );
    saveProfiles(updated);
    setProfiles(updated);
    setSelected(updated.find(p => p.id === selected.id));
    setEchoText('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 話しかける
  const handleTalk = async () => {
    if (!question.trim() || !selected || talking) return;
    if ((selected.echoes || []).length === 0) return;
    setTalking(true);
    const response = await talkAs(selected, selected.echoes, question, lang);
    const convo = {
      id: Date.now(),
      question,
      response,
      date: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US'),
    };
    saveConvo(selected.id, convo);
    setConvos(prev => [convo, ...prev]);
    setQuestion('');
    setTalking(false);
  };

  const currentProfile = selected || (profiles.length > 0 ? profiles[0] : null);
  const echoes = currentProfile?.echoes || [];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <a href="/" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>← 一覧に戻る</a>
        <button onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')} style={{
          padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
          border: `1px solid ${C.border}`, background: 'transparent',
          color: C.muted, fontSize: 11, fontFamily: 'inherit',
        }}>{t.langBtn}</button>
      </div>

      {/* タイトル */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>🕯️</div>
        <h2 style={{ color: C.accent, margin: '0 0 4px', fontSize: 26,
          fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
          {t.title}
        </h2>
        <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>{t.subtitle}</p>
      </div>

      {/* 人物選択 */}
      {profiles.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {profiles.map(p => (
            <button key={p.id} onClick={() => { setSelected(p); setConvos(loadConvos(p.id)); }} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12,
              border: `1px solid ${selected?.id === p.id ? C.accent : C.border}`,
              background: selected?.id === p.id ? C.accentDim : 'transparent',
              color: selected?.id === p.id ? C.accent : C.muted,
            }}>
              {p.name}（{p.rel || '—'}）
            </button>
          ))}
          <button onClick={() => setTab(0)} style={{
            padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12,
            border: `1px solid ${C.border}`, background: 'transparent', color: C.muted,
          }}>{t.addPerson}</button>
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

      {/* ── Tab 0: 人を登録 ── */}
      {tab === 0 && (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{t.profileLabel}</div>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            style={{
              width: '100%', padding: '12px', background: '#0A0D20',
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.text, fontSize: 14, fontFamily: 'inherit',
              boxSizing: 'border-box', outline: 'none', marginBottom: 10,
            }} />
          <input value={rel} onChange={e => setRel(e.target.value)}
            placeholder={t.relPlaceholder}
            style={{
              width: '100%', padding: '12px', background: '#0A0D20',
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.text, fontSize: 14, fontFamily: 'inherit',
              boxSizing: 'border-box', outline: 'none', marginBottom: 16,
            }} />
          <button onClick={handleAddProfile} disabled={!name.trim()} style={{
            width: '100%', padding: '13px',
            background: name.trim() ? C.accentDim : '#1A1E38',
            border: `1px solid ${name.trim() ? C.accent : C.border}`,
            borderRadius: 10, color: name.trim() ? C.accent : C.muted,
            fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>
            {lang === 'ja' ? '登録して言葉を追加する →' : 'Register & add memories →'}
          </button>

          {/* 言葉の追加（登録済みの人が選択されている場合） */}
          {currentProfile && (
            <div style={{ marginTop: 24 }}>
              <div style={{ color: C.accent, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {lang === 'ja' ? `${currentProfile.name}の言葉を追加` : `Add ${currentProfile.name}'s memories`}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{t.echoLabel}</div>
              <textarea value={echoText} onChange={e => setEchoText(e.target.value)}
                placeholder={t.echoPlaceholder} rows={5}
                style={{
                  width: '100%', padding: '12px', background: '#0A0D20',
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.text, fontSize: 13, fontFamily: 'inherit',
                  lineHeight: 1.8, resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box',
                }} />
              <button onClick={handleAddEcho} disabled={!echoText.trim()} style={{
                marginTop: 10, width: '100%', padding: '12px',
                background: echoText.trim() ? C.accentDim : '#1A1E38',
                border: `1px solid ${echoText.trim() ? C.accent : C.border}`,
                borderRadius: 10, color: echoText.trim() ? C.accent : C.muted,
                fontSize: 14, fontWeight: 600,
                cursor: echoText.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
              }}>{t.addEcho}</button>

              {saved && (
                <div style={{ marginTop: 8, color: C.green, fontSize: 13, textAlign: 'center' }}>
                  {t.saved}
                </div>
              )}

              {/* 登録済みの言葉一覧 */}
              {echoes.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
                    {t.echoCount(echoes.length)}
                  </div>
                  {echoes.map(e => (
                    <div key={e.id} style={{
                      padding: '10px 14px', background: C.card,
                      border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6,
                      color: C.text, fontSize: 13, lineHeight: 1.7,
                      borderLeft: `3px solid ${C.accent}`,
                    }}>
                      "{e.text}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 1: 話しかける ── */}
      {tab === 1 && (
        <div>
          {!currentProfile ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14, whiteSpace: 'pre-line' }}>
              👤{'\n'}{t.profileEmpty}
            </div>
          ) : echoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ color: C.text, fontSize: 14, marginBottom: 8 }}>
                {lang === 'ja'
                  ? `${currentProfile.name}の言葉をまだ登録していません`
                  : `No memories for ${currentProfile.name} yet`}
              </div>
              <button onClick={() => setTab(0)} style={{
                padding: '10px 20px', background: C.accentDim,
                border: `1px solid ${C.accent}`, borderRadius: 8,
                color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {lang === 'ja' ? '言葉を追加する' : 'Add memories'}
              </button>
            </div>
          ) : (
            <>
              {/* 最新の会話 */}
              {convos.slice(0, 3).map(c => (
                <div key={c.id} style={{ marginBottom: 16 }}>
                  {/* あなたの質問 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      background: '#1A2060', border: `1px solid #2A3080`,
                      borderRadius: '12px 12px 2px 12px',
                      color: '#C5D0F0', fontSize: 13, lineHeight: 1.7,
                    }}>
                      <div style={{ color: '#4A5880', fontSize: 10, marginBottom: 4 }}>{t.youLabel}</div>
                      {c.question}
                    </div>
                  </div>
                  {/* 返答 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: C.accentDim, border: `1px solid ${C.accent}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>🕯️</div>
                    <div style={{
                      flex: 1, padding: '10px 14px',
                      background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: '2px 12px 12px 12px',
                      color: C.text, fontSize: 13, lineHeight: 1.8,
                    }}>
                      <div style={{ color: C.accent, fontSize: 10, marginBottom: 4 }}>
                        {currentProfile.name}
                      </div>
                      {c.response}
                    </div>
                  </div>
                </div>
              ))}

              {/* 入力 */}
              <div style={{ marginTop: 16 }}>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder={t.talkPlaceholder} rows={4}
                  style={{
                    width: '100%', padding: '12px', background: '#0A0D20',
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    color: C.text, fontSize: 14, fontFamily: 'inherit',
                    lineHeight: 1.8, resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }} />
                <button onClick={handleTalk}
                  disabled={!question.trim() || talking} style={{
                    marginTop: 10, width: '100%', padding: '13px',
                    background: question.trim() && !talking ? C.accentDim : '#1A1E38',
                    border: `1px solid ${question.trim() && !talking ? C.accent : C.border}`,
                    borderRadius: 10,
                    color: question.trim() && !talking ? C.accent : C.muted,
                    fontSize: 14, fontWeight: 600,
                    cursor: question.trim() && !talking ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                  }}>
                  {talking ? t.asking : `${currentProfile.name}に話しかける`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 2: 記録 ── */}
      {tab === 2 && (
        <div>
          {convos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14 }}>
              💬{'\n'}{t.conversationEmpty}
            </div>
          ) : (
            <>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
                {lang === 'ja' ? `${convos.length}件の会話` : `${convos.length} conversations`}
              </div>
              {convos.map(c => (
                <div key={c.id} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 14, marginBottom: 10,
                }}>
                  <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>{c.date}</div>
                  <div style={{ color: '#4A5880', fontSize: 12, marginBottom: 4 }}>
                    {lang === 'ja' ? 'あなた：' : 'You:'} {c.question.slice(0, 60)}…
                  </div>
                  <div style={{ color: C.accent, fontSize: 12, marginBottom: 4 }}>
                    {currentProfile?.name}：
                  </div>
                  <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7,
                    borderLeft: `2px solid ${C.accent}`, paddingLeft: 10 }}>
                    {c.response}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
