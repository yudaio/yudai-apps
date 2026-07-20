'use client';
import { useState } from 'react';
import { callAI } from './shared';

const CUISINES = [
  { id:'jp', label:'和食', emoji:'🍱' },
  { id:'it', label:'イタリアン', emoji:'🍝' },
  { id:'cn', label:'中華', emoji:'🥡' },
  { id:'kr', label:'韓国料理', emoji:'🌶️' },
  { id:'fr', label:'洋食', emoji:'🥩' },
  { id:'any',label:'おまかせ', emoji:'✨' },
];

const TIMES = [
  { id:'15', label:'15分以内' },
  { id:'30', label:'30分以内' },
  { id:'60', label:'60分以内' },
  { id:'any',label:'時間制限なし' },
];

const QUICK_INGREDIENTS = [
  '鶏肉', '豚肉', '牛肉', '卵', 'トマト', '玉ねぎ', 'じゃがいも', 'キャベツ',
  '豆腐', 'にんじん', 'ほうれん草', 'しめじ', 'ちくわ', 'ツナ缶', 'うどん', 'ご飯',
];

export default function Recipe() {
  const [input,    setInput]    = useState('');
  const [cuisine,  setCuisine]  = useState('any');
  const [time,     setTime]     = useState('any');
  const [serves,   setServes]   = useState('2');
  const [recipe,   setRecipe]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('make');
  const [history,  setHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('recipe-v1') || '[]'); } catch { return []; }
  });

  const addIngredient = (ing) => {
    const current = input.trim();
    if (current.includes(ing)) return;
    setInput(current ? `${current}、${ing}` : ing);
  };

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setRecipe('');
    try {
      const c = CUISINES.find(c => c.id === cuisine);
      const t = TIMES.find(t => t.id === time);
      const prompt =
        `【食材】${input.trim()}\n` +
        `【ジャンル】${cuisine === 'any' ? 'なんでもOK（最適なもの）' : c.label}\n` +
        `【調理時間】${time === 'any' ? '制限なし' : t.label}\n` +
        `【人数】${serves}人分\n\n` +
        `上記の食材で作れる美味しいレシピを1品考えてください。\n` +
        `以下のフォーマットで返してください:\n\n` +
        `【料理名】(料理名)\n` +
        `【調理時間】約〇分\n` +
        `【材料（${serves}人分）】\n・(材料1): (分量)\n・(材料2): (分量)\n...\n\n` +
        `【手順】\n1. (手順1)\n2. (手順2)\n...\n\n` +
        `【ポイント】(美味しく作るコツを1〜2文で)`;
      const res = await callAI(
        'あなたは家庭料理のプロシェフです。手に入りやすい食材で美味しいレシピを考えます。',
        prompt
      );
      setRecipe(res.trim());
      const entry = { date: new Date().toLocaleDateString('ja-JP'), ingredients: input.trim(), cuisine: c.label, time: t.label, recipe: res.trim() };
      setHistory(prev => {
        const h = [entry, ...prev].slice(0, 10);
        localStorage.setItem('recipe-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setRecipe('【料理名】シンプル炒め\n材料を高温でさっと炒め、塩コショウで味を整えれば完成です。');
    }
    setLoading(false);
  };

  const recipeName = recipe.match(/【料理名】(.+)/)?.[1]?.trim() || '';

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🍳</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AIレシピ</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>冷蔵庫の食材を入力するだけでAIがレシピを提案</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['make','🍳 作る'],['history','📖 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(251,146,60,0.25)' : 'transparent',
            color: tab===id ? '#FB923C' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'make' && (
        <>
          {/* Ingredient input */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>食材を入力（読点区切りでOK）</div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="例：鶏肉、玉ねぎ、にんにく、トマト缶..."
              rows={3}
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:12, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit', resize:'none' }}
            />
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
              {QUICK_INGREDIENTS.map(ing => (
                <button key={ing} onClick={() => addIngredient(ing)} style={{
                  padding:'4px 10px', fontSize:11,
                  background: input.includes(ing) ? 'rgba(251,146,60,0.2)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${input.includes(ing) ? 'rgba(251,146,60,0.4)' : 'rgba(251,146,60,0.1)'}`,
                  borderRadius:20, color: input.includes(ing) ? '#FB923C' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                }}>{ing}</button>
              ))}
            </div>
          </div>

          {/* Cuisine */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>ジャンル</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
              {CUISINES.map(c => (
                <button key={c.id} onClick={() => setCuisine(c.id)} style={{
                  padding:'9px 6px',
                  background: cuisine===c.id ? 'rgba(251,146,60,0.18)' : 'rgba(12,10,30,0.4)',
                  border:`1px solid ${cuisine===c.id ? 'rgba(251,146,60,0.45)' : 'rgba(251,146,60,0.1)'}`,
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{c.emoji}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: cuisine===c.id ? '#FB923C' : '#5A6890' }}>{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time + Serves */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            <div>
              <div style={{ fontSize:12, color:'#5A6890', marginBottom:7 }}>⏱ 調理時間</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {TIMES.map(t => (
                  <button key={t.id} onClick={() => setTime(t.id)} style={{
                    padding:'7px 10px', textAlign:'left', fontSize:11,
                    background: time===t.id ? 'rgba(251,146,60,0.15)' : 'rgba(12,10,30,0.4)',
                    border:`1px solid ${time===t.id ? 'rgba(251,146,60,0.4)' : 'rgba(251,146,60,0.1)'}`,
                    borderRadius:9, color: time===t.id ? '#FB923C' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#5A6890', marginBottom:7 }}>👥 人数</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {['1','2','3','4'].map(n => (
                  <button key={n} onClick={() => setServes(n)} style={{
                    padding:'7px 10px', textAlign:'left', fontSize:11,
                    background: serves===n ? 'rgba(251,146,60,0.15)' : 'rgba(12,10,30,0.4)',
                    border:`1px solid ${serves===n ? 'rgba(251,146,60,0.4)' : 'rgba(251,146,60,0.1)'}`,
                    borderRadius:9, color: serves===n ? '#FB923C' : '#5A6890', cursor:'pointer', fontFamily:'inherit',
                  }}>{n}人分</button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!input.trim() || loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: !input.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#F97316,#FB923C)',
              border:'none', borderRadius:12,
              color: !input.trim() || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700,
              cursor: !input.trim() || loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: !input.trim() || loading ? 'none' : '0 4px 20px rgba(249,115,22,0.3)',
            }}
          >
            {loading ? '🍳 レシピを考え中...' : '🍳 レシピを生成する'}
          </button>

          {/* Result */}
          {recipe && !loading && (
            <div style={{ background:'rgba(12,10,30,0.6)', borderRadius:16, border:'1px solid rgba(251,146,60,0.25)', overflow:'hidden' }}>
              {recipeName && (
                <div style={{ padding:'14px 18px', background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(251,146,60,0.06))', borderBottom:'1px solid rgba(251,146,60,0.15)', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>🍽️</span>
                  <span style={{ color:'#FB923C', fontSize:16, fontWeight:800 }}>{recipeName}</span>
                </div>
              )}
              <div style={{ padding:'18px' }}>
                <div style={{ fontSize:13, color:'#C8D0E8', lineHeight:2, whiteSpace:'pre-wrap' }}>
                  {recipe.replace(/【料理名】.+\n?/, '')}
                </div>
              </div>
              <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(251,146,60,0.1)', display:'flex', gap:8 }}>
                <button onClick={generate} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid rgba(251,146,60,0.2)', borderRadius:10, color:'#FB923C', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>🔄 別のレシピ</button>
                <button onClick={() => { setRecipe(''); setInput(''); }} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, color:'#7C5CFC', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>➕ 新しく作る</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🍳</div>
              <div style={{ fontSize:14 }}>まだレシピ履歴がありません</div>
            </div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(251,146,60,0.1)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:12, color:'#FB923C', fontWeight:700 }}>🍽️ {h.recipe.match(/【料理名】(.+)/)?.[1]?.trim() || 'レシピ'}</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{h.date}</span>
              </div>
              <div style={{ fontSize:11, color:'#4A5880' }}>食材: {h.ingredients}</div>
              <div style={{ fontSize:11, color:'#3A4870', marginTop:2 }}>{h.cuisine} · {h.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
