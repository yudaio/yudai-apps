'use client';
import { useState } from 'react';
import { callAI } from './shared';

const TYPES = [
  { id:'birthday',  label:'誕生日',   emoji:'🎂', color:'#F59E0B', hint:'相手の誕生日を祝うメッセージ' },
  { id:'thanks',    label:'感謝',     emoji:'🙏', color:'#34D399', hint:'感謝の気持ちを伝えるメッセージ' },
  { id:'apology',   label:'謝罪',     emoji:'🥺', color:'#60A5FA', hint:'誠実に謝るメッセージ' },
  { id:'love',      label:'告白',     emoji:'💕', color:'#F472B6', hint:'気持ちを伝える恋愛メッセージ' },
  { id:'goodbye',   label:'お別れ',   emoji:'👋', color:'#A78BFA', hint:'別れを惜しむ送別メッセージ' },
  { id:'congrats',  label:'祝い事',   emoji:'🎉', color:'#FBBF24', hint:'合格・昇進・結婚などお祝いの言葉' },
  { id:'cheer',     label:'励まし',   emoji:'⚡', color:'#38BDF8', hint:'落ち込んだ相手を元気づける言葉' },
  { id:'morning',   label:'おはよう', emoji:'🌅', color:'#FB923C', hint:'特別な朝の挨拶メッセージ' },
];

const TONES = [
  { id:'warm',   label:'温かく',  desc:'やさしく寄り添う' },
  { id:'formal', label:'丁寧に',  desc:'礼儀正しく' },
  { id:'casual', label:'気軽に',  desc:'フレンドリーに' },
  { id:'poetic', label:'詩的に',  desc:'美しい言葉で' },
];

export default function Message() {
  const [type,    setType]    = useState(null);
  const [tone,    setTone]    = useState('warm');
  const [to,      setTo]      = useState('');
  const [context, setContext] = useState('');
  const [msg,     setMsg]     = useState('');
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('create');
  const [saved,   setSaved]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('msg-v1') || '[]'); } catch { return []; }
  });
  const [copied,  setCopied]  = useState(false);

  const generate = async () => {
    if (!type || loading) return;
    setLoading(true);
    try {
      const t  = TYPES.find(t => t.id === type);
      const tn = TONES.find(t => t.id === tone);
      const prompt =
        `「${t.label}」のメッセージを${tn.label}書いてください。\n` +
        (to ? `宛先: ${to}\n` : '') +
        (context ? `状況・補足: ${context}\n` : '') +
        `トーン: ${tn.desc}\n` +
        `100〜200字程度の日本語メッセージのみ返してください。説明不要。`;
      const res = await callAI(
        'あなたは心のこもった言葉を書くプロのライターです。状況に合わせた感動的なメッセージを書いてください。',
        prompt
      );
      setMsg(res.trim());
    } catch {
      setMsg('今、心に浮かぶ言葉を直接伝えてみてください。あなたの言葉が一番です。');
    }
    setLoading(false);
  };

  const copy = () => {
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const save = () => {
    if (!msg || !type) return;
    const t = TYPES.find(t => t.id === type);
    const entry = { date: new Date().toLocaleDateString('ja-JP'), type: t.label, emoji: t.emoji, to, msg };
    setSaved(prev => {
      const h = [entry, ...prev].slice(0, 20);
      localStorage.setItem('msg-v1', JSON.stringify(h));
      return h;
    });
  };

  const activeType = TYPES.find(t => t.id === type);

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>💌</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AIメッセージ</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>シーンを選んでAIが心のこもった一言を生成</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['create','💌 作る'],['saved','📁 保存済み']].map(([id, label]) => (
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
          {/* Type selector */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>シーンを選ぶ</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding:'10px 6px', textAlign:'center',
                  background: type===t.id ? t.color+'22' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${type===t.id ? t.color+'66' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:12, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:20, marginBottom:3 }}>{t.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: type===t.id ? t.color : '#5A6890' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>トーン</div>
            <div style={{ display:'flex', gap:6 }}>
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  flex:1, padding:'8px 4px', textAlign:'center',
                  background: tone===t.id ? 'rgba(99,102,241,0.2)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${tone===t.id ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color: tone===t.id ? '#A78BFA' : '#E2E8FF' }}>{t.label}</div>
                  <div style={{ fontSize:9, color:'#3A4870', marginTop:2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div style={{ marginBottom:16 }}>
            <input
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="宛先の名前（任意）例：田中さん、お母さん"
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:10, color:'#E2E8FF', fontSize:13, outline:'none', fontFamily:'inherit', marginBottom:8 }}
            />
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="補足・状況（任意）例：10年来の友達で、来月海外に引っ越す"
              rows={2}
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:10, color:'#E2E8FF', fontSize:13, outline:'none', fontFamily:'inherit', resize:'none' }}
            />
          </div>

          <button
            onClick={generate}
            disabled={!type || loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: !type || loading ? 'rgba(30,30,60,0.4)' : (activeType ? `linear-gradient(135deg, ${activeType.color}99, ${activeType.color}cc)` : 'linear-gradient(135deg,#4F46E5,#7C3AED)'),
              border:'none', borderRadius:12,
              color: !type || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !type || loading ? 'default' : 'pointer',
              fontFamily:'inherit',
            }}
          >
            {loading ? '✍️ 生成中...' : '💌 メッセージを生成する'}
          </button>

          {/* Result */}
          {msg && !loading && (
            <>
              <div style={{ padding:'22px', background:'rgba(12,10,30,0.6)', borderRadius:16, border:`1px solid ${activeType?.color || '#6366F1'}40`, marginBottom:12 }}>
                <div style={{ fontSize:11, color: activeType?.color || '#7C5CFC', fontWeight:700, marginBottom:12 }}>
                  {activeType?.emoji} {activeType?.label} {to ? `→ ${to}` : ''} / {TONES.find(t=>t.id===tone)?.label}
                </div>
                <div style={{ fontSize:15, color:'#E2E8FF', lineHeight:1.95, whiteSpace:'pre-wrap' }}>{msg}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7 }}>
                <button onClick={generate} style={{ padding:'11px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, color:'#7C5CFC', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 再生成</button>
                <button onClick={copy} style={{ padding:'11px', background: copied ? 'rgba(52,211,153,0.15)' : 'transparent', border:`1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(52,211,153,0.2)'}`, borderRadius:10, color:'#34D399', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {copied ? '✅ コピー済み' : '📋 コピー'}
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
              <div style={{ fontSize:32, marginBottom:12 }}>💌</div>
              <div style={{ fontSize:14 }}>まだ保存されたメッセージがありません</div>
            </div>
          ) : saved.map((m, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'#A78BFA', fontWeight:700 }}>{m.emoji} {m.type}{m.to ? ` → ${m.to}` : ''}</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{m.date}</span>
              </div>
              <div style={{ fontSize:12, color:'#C0C8E0', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{m.msg}</div>
              <button onClick={() => { navigator.clipboard.writeText(m.msg); }} style={{ marginTop:8, padding:'5px 12px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, color:'#7C5CFC', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>📋 コピー</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
