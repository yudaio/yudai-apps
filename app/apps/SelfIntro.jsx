'use client';
import { useState } from 'react';
import { callAI } from './shared';

const PURPOSES = [
  { id:'sns',      label:'SNS/プロフィール', emoji:'📱', hint:'Twitter・Instagram・TikTok' },
  { id:'business', label:'ビジネス名刺',     emoji:'💼', hint:'初対面・商談・名刺交換時' },
  { id:'marriage', label:'婚活・出会い',     emoji:'💕', hint:'マッチングアプリ・お見合い' },
  { id:'team',     label:'チーム自己紹介',   emoji:'🏢', hint:'入社・チームビルディング' },
  { id:'speech',   label:'スピーチ/登壇',    emoji:'🎤', hint:'セミナー・発表・挨拶' },
  { id:'resume',   label:'職務経歴書',       emoji:'📄', hint:'転職・求職活動' },
];

const LENGTHS = [
  { id:'short',  label:'短め',   words:'50〜80字' },
  { id:'medium', label:'標準',   words:'100〜150字' },
  { id:'long',   label:'詳しく', words:'200〜300字' },
];

const TONES = [
  { id:'friendly', label:'親しみやすく' },
  { id:'pro',      label:'プロフェッショナル' },
  { id:'casual',   label:'カジュアル' },
  { id:'humble',   label:'謙虚・丁寧' },
];

export default function SelfIntro() {
  const [purpose,  setPurpose]  = useState('sns');
  const [name,     setName]     = useState('');
  const [job,      setJob]      = useState('');
  const [hobbies,  setHobbies]  = useState('');
  const [strength, setStrength] = useState('');
  const [extra,    setExtra]    = useState('');
  const [length,   setLength]   = useState('medium');
  const [tone,     setTone]     = useState('friendly');
  const [result,   setResult]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('create');
  const [saved,    setSaved]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('selfintro-v1') || '[]'); } catch { return []; }
  });
  const [copied,   setCopied]   = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const p  = PURPOSES.find(p => p.id === purpose);
      const ln = LENGTHS.find(l => l.id === length);
      const tn = TONES.find(t => t.id === tone);
      const prompt =
        `【用途】${p.label}（${p.hint}）\n` +
        (name     ? `【名前/ハンドル】${name}\n` : '') +
        (job      ? `【職業/肩書き】${job}\n` : '') +
        (hobbies  ? `【趣味・好きなこと】${hobbies}\n` : '') +
        (strength ? `【強み・得意なこと】${strength}\n` : '') +
        (extra    ? `【その他伝えたいこと】${extra}\n` : '') +
        `【文字数目安】${ln.words}\n` +
        `【トーン】${tn.label}\n\n` +
        `上記の情報をもとに魅力的な自己紹介文を日本語で書いてください。\n` +
        `自己紹介文のみを返してください。前置きや説明は不要です。`;
      const res = await callAI(
        'あなたは自己紹介文の専門ライターです。相手に好印象を与える魅力的な自己紹介文を書きます。',
        prompt
      );
      setResult(res.trim());
    } catch {
      setResult('はじめまして！AIが作成した自己紹介です。ご自身の情報を入力して、オリジナルの自己紹介文を生成してください。');
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const save = () => {
    if (!result) return;
    const p = PURPOSES.find(p => p.id === purpose);
    const entry = { date: new Date().toLocaleDateString('ja-JP'), purpose: p.label, emoji: p.emoji, name, result };
    setSaved(prev => {
      const h = [entry, ...prev].slice(0, 15);
      localStorage.setItem('selfintro-v1', JSON.stringify(h));
      return h;
    });
  };

  const activePurpose = PURPOSES.find(p => p.id === purpose);

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🪪</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI自己紹介文</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>用途・情報を入力するだけで魅力的な自己紹介を生成</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['create','🪪 作る'],['saved','📁 保存済み']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'create' && (
        <>
          {/* Purpose */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>用途を選ぶ</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              {PURPOSES.map(p => (
                <button key={p.id} onClick={() => setPurpose(p.id)} style={{
                  padding:'10px 12px', textAlign:'left',
                  background: purpose===p.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${purpose===p.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <span style={{ fontSize:14, marginRight:6 }}>{p.emoji}</span>
                  <span style={{ fontSize:11, fontWeight:700, color: purpose===p.id ? '#A78BFA' : '#E2E8FF' }}>{p.label}</span>
                  <div style={{ fontSize:9, color:'#3A4870', marginTop:2 }}>{p.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Info fields */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>あなたの情報（任意）</div>
            {[
              [name, setName, '名前・ハンドルネーム（例: ゆだい / @yudai）'],
              [job, setJob, '職業・肩書き（例: エンジニア、フリーランスデザイナー）'],
              [hobbies, setHobbies, '趣味・好きなこと（例: 旅行、カフェ巡り、読書）'],
              [strength, setStrength, '強み・得意なこと（例: 傾聴力、問題解決、コミュ力）'],
              [extra, setExtra, 'その他（例: 最近ハマっていること、一言メッセージ）'],
            ].map(([val, setter, ph], i) => (
              <input
                key={i}
                value={val}
                onChange={e => setter(e.target.value)}
                placeholder={ph}
                style={{
                  width:'100%', boxSizing:'border-box',
                  padding:'10px 14px', marginBottom:7,
                  background:'rgba(12,10,30,0.6)',
                  border:'1px solid rgba(99,102,241,0.15)', borderRadius:10,
                  color:'#E2E8FF', fontSize:12, outline:'none', fontFamily:'inherit',
                }}
              />
            ))}
          </div>

          {/* Length + Tone */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>文字数</div>
              {LENGTHS.map(l => (
                <button key={l.id} onClick={() => setLength(l.id)} style={{
                  width:'100%', marginBottom:5, padding:'8px 10px', textAlign:'left',
                  background: length===l.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${length===l.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:9, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color: length===l.id ? '#A78BFA' : '#E2E8FF' }}>{l.label}</div>
                  <div style={{ fontSize:9, color:'#3A4870' }}>{l.words}</div>
                </button>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>トーン</div>
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  width:'100%', marginBottom:5, padding:'8px 10px', textAlign:'left',
                  background: tone===t.id ? 'rgba(99,102,241,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${tone===t.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:9, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color: tone===t.id ? '#A78BFA' : '#E2E8FF' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              border:'none', borderRadius:12,
              color: loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700, cursor: loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            {loading ? '🪪 生成中...' : '🪪 自己紹介文を生成する'}
          </button>

          {/* Result */}
          {result && !loading && (
            <>
              <div style={{ padding:'20px', background:'rgba(12,10,30,0.6)', borderRadius:16, border:`1px solid ${activePurpose?.color || 'rgba(99,102,241,0.25)'}`, marginBottom:12 }}>
                <div style={{ fontSize:10, color:'#7C5CFC', fontWeight:700, marginBottom:10 }}>
                  {activePurpose?.emoji} {activePurpose?.label} / {TONES.find(t=>t.id===tone)?.label}
                </div>
                <div style={{ fontSize:14, color:'#E2E8FF', lineHeight:1.95 }}>{result}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7 }}>
                <button onClick={generate} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, color:'#7C5CFC', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 再生成</button>
                <button onClick={copy} style={{ padding:'11px', background: copied ? 'rgba(52,211,153,0.15)' : 'transparent', border:`1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(52,211,153,0.2)'}`, borderRadius:10, color:'#34D399', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied ? '✅ コピー済' : '📋 コピー'}
                </button>
                <button onClick={save} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, color:'#FBBF24', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>💾 保存</button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🪪</div>
              <div style={{ fontSize:14 }}>まだ保存された自己紹介文がありません</div>
            </div>
          ) : saved.map((s, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'#A78BFA', fontWeight:700 }}>{s.emoji} {s.purpose}{s.name ? ` / ${s.name}` : ''}</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{s.date}</span>
              </div>
              <div style={{ fontSize:12, color:'#C0C8E0', lineHeight:1.75 }}>{s.result}</div>
              <button onClick={() => navigator.clipboard.writeText(s.result)} style={{ marginTop:8, padding:'5px 12px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, color:'#7C5CFC', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>📋 コピー</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
