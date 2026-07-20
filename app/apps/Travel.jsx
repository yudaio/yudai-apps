'use client';
import { useState } from 'react';
import { callAI } from './shared';

const THEMES = [
  { id:'sightseeing', label:'観光',   emoji:'🏛️' },
  { id:'gourmet',     label:'グルメ', emoji:'🍜' },
  { id:'nature',      label:'自然',   emoji:'🏔️' },
  { id:'history',     label:'歴史',   emoji:'⛩️' },
  { id:'relax',       label:'癒し',   emoji:'♨️' },
  { id:'adventure',   label:'冒険',   emoji:'🎯' },
];

const POPULAR = ['東京', '京都', '大阪', '沖縄', '北海道', '箱根', '鎌倉', '奈良', 'ニューヨーク', 'パリ', 'バリ島', 'ソウル'];

export default function Travel() {
  const [dest,    setDest]    = useState('');
  const [days,    setDays]    = useState('2');
  const [people,  setPeople]  = useState('2');
  const [theme,   setTheme]   = useState('sightseeing');
  const [budget,  setBudget]  = useState('normal');
  const [plan,    setPlan]    = useState('');
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('plan');
  const [saved,   setSaved]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('travel-v1') || '[]'); } catch { return []; }
  });

  const generate = async () => {
    if (!dest.trim() || loading) return;
    setLoading(true);
    setPlan('');
    try {
      const th = THEMES.find(t => t.id === theme);
      const bdg = budget === 'low' ? '節約重視（なるべく安く）' : budget === 'high' ? '贅沢（予算を気にしない）' : '一般的な予算';
      const prompt =
        `【目的地】${dest.trim()}\n` +
        `【日数】${days}日間\n` +
        `【人数】${people}人\n` +
        `【旅行スタイル】${th?.label}（${th?.emoji}）重視\n` +
        `【予算感】${bdg}\n\n` +
        `上記の条件で旅行プランを作成してください。\n\n` +
        `各日について「午前・午後・夜」の3区分で具体的な観光地・レストラン・アクティビティを提案し、\n` +
        `簡潔な説明を添えてください。フォーマット:\n\n` +
        `【1日目】\n☀️ 午前: ...\n🌤 午後: ...\n🌙 夜: ...\n\n【2日目】...\n\n` +
        `最後に「💡 旅のヒント」として2〜3個の実用的なアドバイスを追加してください。`;
      const res = await callAI(
        'あなたは経験豊富な旅行プランナーです。現地の穴場情報も含む魅力的な旅行プランを作成します。',
        prompt
      );
      setPlan(res.trim());
      const entry = { date: new Date().toLocaleDateString('ja-JP'), dest: dest.trim(), days, people, theme: th?.label, plan: res.trim() };
      setSaved(prev => {
        const h = [entry, ...prev].slice(0, 10);
        localStorage.setItem('travel-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setPlan('【1日目】\n☀️ 午前: 定番観光スポットを巡る\n🌤 午後: ランチ後に地元市場を散策\n🌙 夜: 地元料理でディナー');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>✈️</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI旅行プランナー</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>目的地と日数を入力するだけで旅程を自動生成</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['plan','✈️ プランを作る'],['saved','📋 保存済み']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(56,189,248,0.2)' : 'transparent',
            color: tab===id ? '#38BDF8' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'plan' && (
        <>
          {/* Destination */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>🗺️ 目的地</div>
            <input
              value={dest}
              onChange={e => setDest(e.target.value)}
              placeholder="例：京都、バリ島、ニューヨーク..."
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:12, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit' }}
            />
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
              {POPULAR.map(d => (
                <button key={d} onClick={() => setDest(d)} style={{
                  padding:'4px 10px', fontSize:11,
                  background: dest===d ? 'rgba(56,189,248,0.2)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${dest===d ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius:20, color: dest===d ? '#38BDF8' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{d}</button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>旅行スタイル</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} style={{
                  padding:'9px 6px',
                  background: theme===t.id ? 'rgba(56,189,248,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${theme===t.id ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{t.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: theme===t.id ? '#38BDF8' : '#5A6890' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Days, People, Budget */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>📅 日数</div>
              {['1','2','3','4','5','7'].map(n => (
                <button key={n} onClick={() => setDays(n)} style={{
                  width:'100%', marginBottom:4, padding:'6px', fontSize:11,
                  background: days===n ? 'rgba(56,189,248,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${days===n ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius:8, color: days===n ? '#38BDF8' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{n}日</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>👥 人数</div>
              {['1','2','3','4'].map(n => (
                <button key={n} onClick={() => setPeople(n)} style={{
                  width:'100%', marginBottom:4, padding:'6px', fontSize:11,
                  background: people===n ? 'rgba(56,189,248,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${people===n ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius:8, color: people===n ? '#38BDF8' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{n}人</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, color:'#5A6890', marginBottom:6 }}>💰 予算感</div>
              {[['low','節約'],['normal','普通'],['high','贅沢']].map(([v,l]) => (
                <button key={v} onClick={() => setBudget(v)} style={{
                  width:'100%', marginBottom:4, padding:'6px', fontSize:11,
                  background: budget===v ? 'rgba(56,189,248,0.15)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${budget===v ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.1)'}`,
                  borderRadius:8, color: budget===v ? '#38BDF8' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{l}</button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!dest.trim() || loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: !dest.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
              border:'none', borderRadius:12,
              color: !dest.trim() || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !dest.trim() || loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: !dest.trim() || loading ? 'none' : '0 4px 20px rgba(56,189,248,0.3)',
            }}
          >
            {loading ? '✈️ プランを作成中...' : '✈️ 旅行プランを生成する'}
          </button>

          {/* Plan result */}
          {plan && !loading && (
            <>
              <div style={{ background:'rgba(12,10,30,0.6)', borderRadius:16, border:'1px solid rgba(56,189,248,0.25)', overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:'14px 18px', background:'linear-gradient(135deg,rgba(14,165,233,0.12),rgba(56,189,248,0.06))', borderBottom:'1px solid rgba(56,189,248,0.15)', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>✈️</span>
                  <span style={{ color:'#38BDF8', fontSize:15, fontWeight:800 }}>{dest} · {days}日間 · {people}人</span>
                </div>
                <div style={{ padding:'18px', fontSize:13, color:'#C8D0E8', lineHeight:1.95, whiteSpace:'pre-wrap' }}>{plan}</div>
              </div>
              <button onClick={generate} style={{ width:'100%', padding:'12px', background:'transparent', border:'1px solid rgba(56,189,248,0.2)', borderRadius:12, color:'#38BDF8', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 別のプランを提案</button>
            </>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✈️</div>
              <div style={{ fontSize:14 }}>まだ保存された旅行プランがありません</div>
            </div>
          ) : saved.map((s, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(56,189,248,0.1)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'#38BDF8', fontWeight:700 }}>✈️ {s.dest} · {s.days}日</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{s.date}</span>
              </div>
              <div style={{ fontSize:11, color:'#4A5880' }}>{s.people}人 · {s.theme}</div>
              <div style={{ fontSize:11, color:'#3A4870', marginTop:6, lineHeight:1.6 }}>{s.plan.slice(0,120)}...</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
