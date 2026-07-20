'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', pink:'#F472B6' };

const LEVELS = [
  { min:0,  max:20,  label:'問題なし',    color:'#34D399', icon:'✅', desc:'今のところモラハラの兆候は見られません。' },
  { min:20, max:40,  label:'グレーゾーン', color:'#FBBF24', icon:'⚠️', desc:'一部気になる言動がありますが、まだグレーゾーンです。観察を続けましょう。' },
  { min:40, max:60,  label:'要注意',      color:'#FB923C', icon:'🔶', desc:'モラハラの可能性があります。記録をつけることをすすめます。' },
  { min:60, max:80,  label:'モラハラ',    color:'#F87171', icon:'🚨', desc:'モラハラと判断できる行為が見られます。一人で抱え込まず専門家に相談を。' },
  { min:80, max:101, label:'危険・DV',    color:'#DC2626', icon:'🆘', desc:'深刻な状況です。安全確保を最優先に、今すぐ専門機関へ連絡してください。' },
];

function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score < l.max) || LEVELS[2];
}

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

export default function Morahara() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('check');
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('morahara');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('morahara-v1') || '[]'); } catch { return []; }
  });

  async function analyze() {
    if (!text.trim() || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたはDV・モラハラ専門のカウンセラーです。以下の出来事・言動を客観的に分析し、モラハラ（モラルハラスメント）に該当するか判定してください。

相談内容：
${text}

以下の形式で厳密に回答してください：
【モラハラスコア】0〜100の整数のみ（0=全く問題なし、100=極めて深刻なDV）
【判定タイプ】精神的暴力・言語的暴力・経済的DV・社会的隔離・性的強要・身体的暴力 の中から該当するもの（なければ「該当なし」）
【問題点】何が問題か具体的に2〜3点（箇条書き）
【対処法】今すぐできる具体的なアドバイス2〜3点（箇条書き）
【緊急度】低・中・高・緊急 のいずれか一語

相談者の気持ちに寄り添い、専門的かつ明確に判定してください。`
      );
      const scoreMatch = res.match(/【モラハラスコア】\s*(\d+)/);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
      const level = getLevel(score);
      const entry = { id: Date.now(), preview: text.slice(0, 40) + (text.length > 40 ? '…' : ''), score, levelLabel: level.label, levelColor: level.color, levelIcon: level.icon, res, date: new Date().toLocaleDateString('ja-JP') };
      const next = [entry, ...history].slice(0, 15);
      setHistory(next);
      localStorage.setItem('morahara-v1', JSON.stringify(next));
      setResult({ score, level, res });
      increment();
    } catch { setResult({ error: true }); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:42, marginBottom:8 }}>🔍</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AIモラハラ診断</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          「これってモラハラ？」と思ったら、出来事を入力してAIに判定してもらいましょう。<br/>
          <span style={{ fontSize:11 }}>※本診断はAIによる参考情報です。専門家の判断に代わるものではありません。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ display:'flex', gap:4, marginBottom:20, background:C.card, borderRadius:12, padding:4, border:`1px solid ${C.border}` }}>
        {[['check','🔍 診断する'],['history','📋 履歴']].map(([t,label]) => (
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:tab===t?C.pink:'transparent', color:tab===t?'#fff':C.muted, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab==='check' && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
            <label style={{ color:C.text, fontSize:13, fontWeight:700, display:'block', marginBottom:10 }}>
              パートナーや身近な人の言動・出来事を教えてください
            </label>
            <textarea
              value={text} onChange={e=>setText(e.target.value)}
              placeholder={'例：「お前のせいで俺の人生が台無しだ」と言われた。\n友人との外出を毎回反対・監視される。\nお金の管理を全て相手に握られ、必要なものも買えない…'}
              style={{ width:'100%', minHeight:140, background:'#070918', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px', color:C.text, fontSize:14, lineHeight:1.75, fontFamily:'inherit', resize:'vertical' }}
            />
            <div style={{ color:C.muted, fontSize:11, marginTop:6 }}>具体的な言葉・状況を書くほど正確に診断できます</div>
          </div>

          <button onClick={analyze} disabled={!text.trim()||loading}
            style={{ width:'100%', padding:'15px', background:!text.trim()||loading?'#1A2040':'linear-gradient(135deg,#F472B6,#A855F7)', border:'none', borderRadius:14, color:!text.trim()||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!text.trim()||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
            {loading?'診断中…':'🔍 AIに診断してもらう'}
          </button>

          {result&&!result.error&&(
            <div style={{ background:C.card, border:`1px solid ${result.level.color}44`, borderRadius:16, overflow:'hidden', animation:'fadeUp 0.4s ease' }}>
              <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:24 }}>{result.level.icon}</span>
                    <div>
                      <div style={{ color:result.level.color, fontSize:18, fontWeight:900 }}>{result.level.label}</div>
                      <div style={{ color:C.muted, fontSize:11 }}>モラハラスコア</div>
                    </div>
                  </div>
                  <div style={{ color:result.level.color, fontSize:40, fontWeight:900, lineHeight:1 }}>{result.score}</div>
                </div>
                <div style={{ height:8, background:'#1A2040', borderRadius:4, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ height:'100%', width:`${result.score}%`, background:`linear-gradient(90deg,#34D399,${result.level.color})`, borderRadius:4, transition:'width 1s ease' }}/>
                </div>
                <div style={{ color:C.muted, fontSize:13, lineHeight:1.7 }}>{result.level.desc}</div>
              </div>
              <div style={{ padding:'18px 20px 22px' }}>
                {['判定タイプ','問題点','対処法'].map(key=>{
                  const val=parseSection(result.res,key);
                  if(!val) return null;
                  return (
                    <div key={key} style={{ marginBottom:16 }}>
                      <div style={{ color:C.pink, fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.05em' }}>{key}</div>
                      <div style={{ color:C.text, fontSize:13, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{val}</div>
                    </div>
                  );
                })}
                {result.score>=60&&(
                  <div style={{ marginTop:8, padding:'14px 16px', background:'#DC262618', border:'1px solid #DC262640', borderRadius:12 }}>
                    <div style={{ color:'#FCA5A5', fontSize:12, fontWeight:700, marginBottom:8 }}>🆘 緊急相談窓口（無料・24時間）</div>
                    <div style={{ color:'#FCA5A5', fontSize:12, lineHeight:2 }}>
                      DVホットライン: <strong>#8008</strong>（無料）<br/>
                      よりそいホットライン: <strong>0120-279-338</strong><br/>
                      配偶者暴力支援センター: 各都道府県に設置
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {result?.error&&<div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}
        </>
      )}

      {tab==='history'&&(
        <div>
          {history.length===0?(
            <div style={{ textAlign:'center', padding:'48px 20px', color:C.muted }}>まだ診断履歴がありません</div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {history.map(h=>(
                <div key={h.id} style={{ background:C.card, border:`1px solid ${h.levelColor}30`, borderRadius:14, padding:'14px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span>{h.levelIcon}</span>
                      <span style={{ color:h.levelColor, fontSize:13, fontWeight:700 }}>{h.levelLabel}</span>
                      <span style={{ color:h.levelColor, fontSize:16, fontWeight:900 }}>{h.score}</span>
                    </div>
                    <span style={{ color:C.muted, fontSize:11 }}>{h.date}</span>
                  </div>
                  <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>{h.preview}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#1A0A40,#0D1235)', border:'1px solid #7C3AED40', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#C084FC', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>診断し放題＋詳細レポート保存</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          毎月3回→無制限・PDF保存・弁護士・カウンセラー紹介
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#F472B6,#A855F7)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥980/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
