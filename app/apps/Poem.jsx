'use client';
import { useState } from 'react';
import { callAI } from './shared';

const STYLES = [
  { id:'haiku',  label:'俳句',   en:'Haiku (5-7-5)',  emoji:'🌸', hint:'5・7・5音の詩' },
  { id:'tanka',  label:'短歌',   en:'Tanka (31音)',   emoji:'🌙', hint:'5・7・5・7・7音の詩' },
  { id:'free',   label:'自由詩', en:'Free Verse',     emoji:'🌊', hint:'形式にとらわれない詩' },
  { id:'love',   label:'恋詩',   en:'Love Poem',      emoji:'💕', hint:'感情を込めたラブポエム' },
  { id:'inspire',label:'励まし', en:'Inspirational',  emoji:'⚡', hint:'前向きになれる言葉の詩' },
];

const THEMES = ['失恋', '新しい朝', '夕暮れ', '雨', '桜', '旅立ち', '孤独', '希望', '夢', '海', '別れ', '出会い'];

export default function Poem() {
  const [theme,   setTheme]   = useState('');
  const [style,   setStyle]   = useState(null);
  const [poem,    setPoem]    = useState('');
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('create');
  const [saved,   setSaved]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('poem-v1') || '[]'); } catch { return []; }
  });

  const generate = async () => {
    if (!theme.trim() || !style || loading) return;
    setLoading(true);
    try {
      const s = STYLES.find(s => s.id === style);
      const prompts = {
        haiku:   `「${theme}」をテーマに俳句（5・7・5音）を一首詠んでください。改行で3行、季語を含め日本語の美しさを大切に。`,
        tanka:   `「${theme}」をテーマに短歌（5・7・5・7・7音）を一首詠んでください。改行で5行、万葉調でも現代調でも。`,
        free:    `「${theme}」をテーマに自由詩を書いてください。4〜8行、情景描写と感情が融合した詩的な表現で。`,
        love:    `「${theme}」をテーマに恋の詩を書いてください。4〜6行、繊細で美しい日本語で、読む人の心に響く恋愛詩を。`,
        inspire: `「${theme}」をテーマに読む人を前向きにさせる励ましの詩を書いてください。4〜6行、力強くも温かい言葉で。`,
      };
      const res = await callAI(
        'あなたは現代日本の詩人です。美しく感情豊かな詩を書いてください。詩のみを返し、前置きや説明は一切不要です。',
        prompts[style] || prompts.free
      );
      setPoem(res.trim());
    } catch {
      setPoem('言葉が空に\n還っていく瞬間\n静寂だけが残る');
    }
    setLoading(false);
  };

  const savePoem = () => {
    if (!poem) return;
    const s = STYLES.find(s => s.id === style);
    const entry = {
      date: new Date().toLocaleDateString('ja-JP'),
      theme, style: s?.label, emoji: s?.emoji, poem,
    };
    setSaved(prev => {
      const h = [entry, ...prev].slice(0, 30);
      localStorage.setItem('poem-v1', JSON.stringify(h));
      return h;
    });
  };

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>✍️</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AIポエム</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>テーマを入力するだけで、AIが詩を詠む</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['create','✍️ 作る'],['saved','📚 保存済み']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'create' && (
        <>
          {/* Theme input */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>テーマを入力</div>
            <input
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="例：失恋、朝の光、旅立ちの朝..."
              style={{
                width:'100%', boxSizing:'border-box',
                padding:'12px 16px', background:'rgba(12,10,30,0.6)',
                border:'1px solid rgba(99,102,241,0.2)', borderRadius:12,
                color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit',
              }}
            />
            {/* Quick themes */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {THEMES.map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  padding:'4px 10px', fontSize:11, background: theme===t ? 'rgba(99,102,241,0.22)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${theme===t ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:20, color: theme===t ? '#A78BFA' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>詩のスタイルを選ぶ</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={{
                  padding:'12px 14px', textAlign:'left',
                  background: style===s.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${style===s.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:16 }}>{s.emoji}</span>
                    <span style={{ fontSize:13, fontWeight:700, color: style===s.id ? '#A78BFA' : '#E2E8FF' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#4A5880' }}>{s.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={!theme.trim() || !style || loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: !theme.trim() || !style || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              border:'none', borderRadius:12,
              color: !theme.trim() || !style || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !theme.trim() || !style || loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: !theme.trim() || !style || loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            {loading ? '✍️ 詩を詠んでいます...' : '✍️ 詩を生成する'}
          </button>

          {/* Poem result */}
          {poem && !loading && (
            <div style={{ padding:'24px 22px', background:'linear-gradient(145deg,rgba(79,70,229,0.08),rgba(124,92,252,0.04))', borderRadius:16, border:'1px solid rgba(124,92,252,0.2)', marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#7C5CFC', marginBottom:14, fontWeight:700, letterSpacing:1 }}>
                {STYLES.find(s=>s.id===style)?.emoji} {theme} / {STYLES.find(s=>s.id===style)?.label}
              </div>
              <pre style={{ fontSize:16, color:'#E2E8FF', lineHeight:2.1, margin:0, fontFamily:'serif', whiteSpace:'pre-wrap', letterSpacing:'0.05em' }}>
                {poem}
              </pre>
            </div>
          )}

          {poem && !loading && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={generate} style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, color:'#7C5CFC', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                🔄 別の詩を生成
              </button>
              <button onClick={savePoem} style={{ flex:1, padding:'12px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:12, color:'#34D399', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                💾 保存する
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✍️</div>
              <div style={{ fontSize:14 }}>まだ保存された詩がありません</div>
              <div style={{ fontSize:12, marginTop:8, color:'#2A3460' }}>「作る」タブで詩を生成して保存しましょう</div>
            </div>
          ) : saved.map((p, i) => (
            <div key={i} style={{ padding:'16px 18px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, color:'#7C5CFC', fontWeight:600 }}>{p.emoji} {p.theme} / {p.style}</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{p.date}</span>
              </div>
              <pre style={{ fontSize:13, color:'#C0C8E0', lineHeight:1.9, margin:0, fontFamily:'serif', whiteSpace:'pre-wrap' }}>{p.poem}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
