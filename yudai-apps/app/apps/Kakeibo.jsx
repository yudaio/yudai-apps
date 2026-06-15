'use client';
import { useState, useMemo } from 'react';
import { callAI } from './shared';

const CATEGORIES = [
  { id:'food',      label:'食費',       emoji:'🍚', color:'#FB923C' },
  { id:'transport', label:'交通費',     emoji:'🚃', color:'#38BDF8' },
  { id:'utility',   label:'光熱費',     emoji:'💡', color:'#FBBF24' },
  { id:'entertain', label:'娯楽',       emoji:'🎮', color:'#A78BFA' },
  { id:'health',    label:'医療・健康', emoji:'💊', color:'#34D399' },
  { id:'clothes',   label:'衣類',       emoji:'👗', color:'#F472B6' },
  { id:'social',    label:'交際費',     emoji:'🍻', color:'#C8A84B' },
  { id:'other',     label:'その他',     emoji:'📦', color:'#94A3B8' },
];

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function Kakeibo() {
  const now = new Date();
  const [tab,      setTab]      = useState('input');
  const [amount,   setAmount]   = useState('');
  const [catId,    setCatId]    = useState('food');
  const [memo,     setMemo]     = useState('');
  const [records,  setRecords]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('kakeibo-v1') || '[]'); } catch { return []; }
  });
  const [budget,   setBudget]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('kakeibo-budget') || '{}'); } catch { return {}; }
  });
  const [budgetInput, setBudgetInput] = useState('');
  const [advice,   setAdvice]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [viewMonth, setViewMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);

  const save = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ja-JP'),
      dateKey: viewMonth,
      amount: Number(amount),
      catId,
      memo: memo.trim(),
    };
    setRecords(prev => {
      const next = [entry, ...prev];
      localStorage.setItem('kakeibo-v1', JSON.stringify(next));
      return next;
    });
    setAmount('');
    setMemo('');
  };

  const remove = (id) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      localStorage.setItem('kakeibo-v1', JSON.stringify(next));
      return next;
    });
  };

  const monthRecords = useMemo(() =>
    records.filter(r => r.dateKey === viewMonth),
  [records, viewMonth]);

  const total = useMemo(() => monthRecords.reduce((s, r) => s + r.amount, 0), [monthRecords]);

  const byCategory = useMemo(() => {
    const map = {};
    monthRecords.forEach(r => {
      map[r.catId] = (map[r.catId] || 0) + r.amount;
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [monthRecords]);

  const saveBudget = () => {
    if (!budgetInput || isNaN(Number(budgetInput))) return;
    setBudget(prev => {
      const next = { ...prev, [viewMonth]: Number(budgetInput) };
      localStorage.setItem('kakeibo-budget', JSON.stringify(next));
      return next;
    });
    setBudgetInput('');
  };

  const monthBudget = budget[viewMonth] || 0;
  const budgetPct = monthBudget > 0 ? Math.min(100, Math.round((total / monthBudget) * 100)) : 0;
  const budgetColor = budgetPct >= 100 ? '#F87171' : budgetPct >= 80 ? '#FBBF24' : '#34D399';

  const getAdvice = async () => {
    if (loading || monthRecords.length === 0) return;
    setLoading(true);
    try {
      const catBreakdown = byCategory.map(([cid, amt]) => {
        const cat = CATEGORIES.find(c => c.id === cid);
        return `${cat?.label}: ¥${amt.toLocaleString()}`;
      }).join('\n');
      const prompt =
        `${viewMonth}の家計データ:\n合計支出: ¥${total.toLocaleString()}\n` +
        (monthBudget ? `予算: ¥${monthBudget.toLocaleString()} (使用率${budgetPct}%)\n` : '') +
        `\nカテゴリ別:\n${catBreakdown}\n\n` +
        `上記の家計データを分析して以下の形式でアドバイスをください：\n` +
        `【支出パターン分析】2文で現状の傾向\n` +
        `【削減できそうな支出】2つの具体的な提案\n` +
        `【今月のアドバイス】実践的な節約アクション1つ\n` +
        `【来月の目標】具体的な数値目標`;
      const res = await callAI(
        'あなたはファイナンシャルプランナーのAIです。家計データを分析して、具体的で実践的な節約・改善アドバイスを提供します。',
        prompt
      );
      setAdvice(res);
    } catch {
      setAdvice(`【支出パターン分析】\n今月の支出データを記録できました。毎月続けることでより精度の高い分析が可能になります。\n\n【削減できそうな支出】\n1. 娯楽費を少し見直してみましょう\n2. 食費は週単位で予算を立てると管理しやすくなります\n\n【今月のアドバイス】\n固定費（光熱費・交通費）を一度確認して見直しましょう\n\n【来月の目標】\n今月の支出より5〜10%削減を目指しましょう`);
    }
    setLoading(false);
  };

  const ym = viewMonth.split('-');
  const displayMonth = `${ym[0]}年${parseInt(ym[1])}月`;

  return (
    <div style={{ maxWidth:480, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>💴</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI家計簿</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>支出を記録してAIが節約アドバイスを生成</p>
      </div>

      {/* Month selector */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:16 }}>
        <button onClick={() => {
          const d = new Date(viewMonth + '-01');
          d.setMonth(d.getMonth() - 1);
          setViewMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
        }} style={{ padding:'6px 12px', background:'rgba(12,10,30,0.5)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, color:'#A78BFA', fontSize:16, cursor:'pointer', fontFamily:'inherit' }}>‹</button>
        <span style={{ fontSize:15, fontWeight:700, color:'#E2E8FF', minWidth:90, textAlign:'center' }}>{displayMonth}</span>
        <button onClick={() => {
          const d = new Date(viewMonth + '-01');
          d.setMonth(d.getMonth() + 1);
          setViewMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
        }} style={{ padding:'6px 12px', background:'rgba(12,10,30,0.5)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, color:'#A78BFA', fontSize:16, cursor:'pointer', fontFamily:'inherit' }}>›</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['input','💴 記録'],['list','📋 一覧'],['analysis','📊 分析']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 記録タブ */}
      {tab === 'input' && (
        <>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>金額</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:18, color:'#5A6890' }}>¥</span>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0"
                style={{
                  flex:1, padding:'12px 14px',
                  background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.2)',
                  borderRadius:10, color:'#E2E8FF', fontSize:20, fontWeight:700,
                  outline:'none', fontFamily:'inherit',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>カテゴリ</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
                  padding:'10px 6px', textAlign:'center',
                  background: catId===cat.id ? `${cat.color}20` : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${catId===cat.id ? cat.color+'55' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{cat.emoji}</div>
                  <div style={{ fontSize:9, color: catId===cat.id ? cat.color : '#8A9CC0', fontWeight:600 }}>{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:8 }}>メモ（任意）</div>
            <input
              value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="例: ランチ代、スーパー"
              style={{
                width:'100%', boxSizing:'border-box', padding:'10px 14px',
                background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.15)',
                borderRadius:10, color:'#E2E8FF', fontSize:13, outline:'none', fontFamily:'inherit',
              }}
            />
          </div>

          <button onClick={save} disabled={!amount || Number(amount) <= 0} style={{
            width:'100%', padding:'14px',
            background: !amount || Number(amount) <= 0 ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            border:'none', borderRadius:12,
            color: !amount || Number(amount) <= 0 ? '#3A4870' : '#fff',
            fontSize:15, fontWeight:700, cursor: !amount || Number(amount) <= 0 ? 'default' : 'pointer',
            fontFamily:'inherit', boxShadow: amount && Number(amount) > 0 ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
          }}>
            💴 記録する
          </button>

          {/* Budget */}
          <div style={{ marginTop:20, padding:'16px', background:'rgba(12,10,30,0.4)', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ fontSize:12, color:'#5A6890', marginBottom:10 }}>📊 {displayMonth}の予算</div>
            {monthBudget > 0 ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#C0C8E0', marginBottom:6 }}>
                  <span>¥{total.toLocaleString()} / ¥{monthBudget.toLocaleString()}</span>
                  <span style={{ color:budgetColor, fontWeight:700 }}>{budgetPct}%</span>
                </div>
                <div style={{ height:6, background:'#1A2040', borderRadius:4 }}>
                  <div style={{ height:'100%', borderRadius:4, background:budgetColor, width:`${budgetPct}%`, transition:'width 0.4s' }}/>
                </div>
                {budgetPct >= 90 && <div style={{ fontSize:11, color:'#F87171', marginTop:6 }}>⚠️ 予算の{budgetPct}%を使用しています</div>}
              </>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input
                  type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
                  placeholder="予算を設定 (例: 150000)"
                  style={{
                    flex:1, padding:'9px 12px',
                    background:'rgba(12,10,30,0.5)', border:'1px solid rgba(99,102,241,0.15)',
                    borderRadius:9, color:'#E2E8FF', fontSize:12, outline:'none', fontFamily:'inherit',
                  }}
                />
                <button onClick={saveBudget} style={{
                  padding:'9px 14px', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)',
                  borderRadius:9, color:'#A78BFA', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                }}>設定</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 一覧タブ */}
      {tab === 'list' && (
        <div>
          <div style={{ padding:'12px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:'1px solid rgba(99,102,241,0.1)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#5A6890' }}>今月の合計</span>
            <span style={{ fontSize:22, fontWeight:900, color:'#A78BFA' }}>¥{total.toLocaleString()}</span>
          </div>
          {monthRecords.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💴</div>
              <div style={{ fontSize:13 }}>まだ記録がありません</div>
            </div>
          ) : monthRecords.map(r => {
            const cat = CATEGORIES.find(c => c.id === r.catId);
            return (
              <div key={r.id} style={{ padding:'11px 14px', background:'rgba(12,10,30,0.5)', borderRadius:11, border:'1px solid rgba(99,102,241,0.1)', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:`${cat?.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{cat?.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'#E2E8FF', fontWeight:600 }}>{cat?.label}{r.memo ? ` · ${r.memo}` : ''}</div>
                  <div style={{ fontSize:10, color:'#3A4870', marginTop:1 }}>{r.date}</div>
                </div>
                <span style={{ fontSize:15, fontWeight:800, color: cat?.color || '#A78BFA', flexShrink:0 }}>¥{r.amount.toLocaleString()}</span>
                <button onClick={() => remove(r.id)} style={{ padding:'3px 7px', background:'transparent', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, color:'#F87171', fontSize:10, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 分析タブ */}
      {tab === 'analysis' && (
        <div>
          {monthRecords.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
              <div style={{ fontSize:13 }}>記録を追加すると分析できます</div>
            </div>
          ) : (
            <>
              {/* Category breakdown */}
              <div style={{ padding:'16px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', marginBottom:14 }}>
                <div style={{ fontSize:11, color:'#5A6890', marginBottom:12 }}>カテゴリ別支出</div>
                {byCategory.map(([cid, amt]) => {
                  const cat = CATEGORIES.find(c => c.id === cid);
                  const pct = Math.round((amt / total) * 100);
                  return (
                    <div key={cid} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#C0C8E0', marginBottom:4 }}>
                        <span>{cat?.emoji} {cat?.label}</span>
                        <span style={{ color: cat?.color, fontWeight:700 }}>¥{amt.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div style={{ height:5, background:'#1A2040', borderRadius:4 }}>
                        <div style={{ height:'100%', borderRadius:4, background: cat?.color || '#A78BFA', width:`${pct}%`, transition:'width 0.4s' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={getAdvice} disabled={loading} style={{
                width:'100%', padding:'13px', marginBottom:16,
                background: loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                border:'none', borderRadius:12,
                color: loading ? '#3A4870' : '#fff',
                fontSize:14, fontWeight:700, cursor: loading ? 'default' : 'pointer',
                fontFamily:'inherit', boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
              }}>
                {loading ? '📊 分析中...' : '🤖 AIアドバイスをもらう'}
              </button>

              {advice && !loading && (
                <div style={{ padding:'16px 20px', background:'rgba(12,10,30,0.6)', borderRadius:14, border:'1px solid rgba(99,102,241,0.15)' }}>
                  {advice.split('\n').filter(l => l.trim()).map((line, i) => (
                    <p key={i} style={{
                      margin:'0 0 8px',
                      fontSize: line.startsWith('【') ? 11 : 13,
                      fontWeight: line.startsWith('【') ? 700 : 400,
                      color: line.startsWith('【') ? '#A78BFA' : '#C0C8E0',
                      lineHeight: 1.8,
                    }}>{line}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
