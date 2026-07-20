'use client';
import { useState } from 'react';
import { callAI } from './shared';

const SIGNS = ['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];
const EMOJIS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const GAUGE_COLORS = [
  [0,30,'#EF4444'],
  [30,50,'#F97316'],
  [50,70,'#EAB308'],
  [70,85,'#22C55E'],
  [85,101,'#7C5CFC'],
];

function getColor(score) {
  const c = GAUGE_COLORS.find(([a,b]) => score >= a && score < b);
  return c ? c[2] : '#7C5CFC';
}

function getLabel(score) {
  if (score < 30) return ['💔 縁なし', 'この組み合わせは難しいかも…'];
  if (score < 50) return ['🌧 波乱万丈', '努力次第でうまくいく可能性あり'];
  if (score < 70) return ['💛 そこそこ', 'お互いを理解すれば良い関係に'];
  if (score < 85) return ['💕 相性良好', '自然と引き合う縁がある'];
  return ['💜 運命の相手', 'この組み合わせは奇跡的な相性！'];
}

export default function Aiai() {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [sign1, setSign1] = useState(null);
  const [sign2, setSign2] = useState(null);
  const [score, setScore]  = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab,   setTab]   = useState('check');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aiai-v1') || '[]'); } catch { return []; }
  });

  const check = async () => {
    if (!name1.trim() || !name2.trim() || loading) return;
    setLoading(true);
    setScore(null);
    setResult('');
    try {
      const s1 = sign1 ? `${EMOJIS[sign1]}${SIGNS[sign1]}` : '不明';
      const s2 = sign2 ? `${EMOJIS[sign2]}${SIGNS[sign2]}` : '不明';
      const seed = [...(name1+name2)].reduce((a,c)=>a+c.charCodeAt(0),0);
      const base  = 40 + (seed % 51);
      const bonus = sign1 !== null && sign2 !== null ? ((sign1 + sign2) % 15) - 7 : 0;
      const raw   = Math.min(99, Math.max(20, base + bonus));
      setScore(raw);
      const res = await callAI(
        'あなたは面白くて洞察力のある占い師です。相性診断を行います。',
        `「${name1}（${s1}）」と「${name2}（${s2}）」の相性診断。相性スコアは${raw}点です。\n` +
        `以下の4項目を各1〜2文で日本語でコメントしてください：\n` +
        `①ふたりの相性の特徴 ②恋愛での注意点 ③友情・仕事での関係 ④総評・アドバイス\n` +
        `項目ごとに改行して、絵文字を適度に使ってテンポよく。300字以内。`
      );
      setResult(res.trim());
      const entry = { date: new Date().toLocaleDateString('ja-JP'), name1, name2, s1, s2, score: raw, result: res.trim() };
      setHistory(prev => {
        const h = [entry, ...prev].slice(0, 10);
        localStorage.setItem('aiai-v1', JSON.stringify(h));
        return h;
      });
    } catch {
      setResult('AIが占い師の眠りについています。もう一度試してください。');
    }
    setLoading(false);
  };

  const color = score !== null ? getColor(score) : '#6366F1';
  const [label, sub] = score !== null ? getLabel(score) : ['', ''];

  return (
    <div style={{ maxWidth:460, margin:'0 auto', paddingBottom:48 }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:8 }}>💕</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#E2E8FF', margin:'0 0 8px', letterSpacing:'-0.02em' }}>AI相性診断</h1>
        <p style={{ fontSize:13, color:'#5A6890', margin:0 }}>2人の名前と星座を入力してAIが相性を診断</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, background:'rgba(12,10,30,0.5)', borderRadius:12, padding:4 }}>
        {[['check','💕 診断する'],['history','📜 履歴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:1, padding:'9px', border:'none', borderRadius:9,
            background: tab===id ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: tab===id ? '#A78BFA' : '#5A6890',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'check' && (
        <>
          {/* Person 1 */}
          <div style={{ marginBottom:16, padding:'16px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize:11, color:'#7C5CFC', fontWeight:700, marginBottom:10 }}>👤 ひとりめ</div>
            <input
              value={name1}
              onChange={e => setName1(e.target.value)}
              placeholder="名前を入力（例: ゆだい）"
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10 }}
            />
            <div style={{ fontSize:11, color:'#3A4870', marginBottom:7 }}>星座（任意）</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
              {SIGNS.map((s,i) => (
                <button key={i} onClick={() => setSign1(sign1===i ? null : i)} style={{
                  padding:'6px 4px', fontSize:10, background: sign1===i ? 'rgba(99,102,241,0.22)' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${sign1===i ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.1)'}`,
                  borderRadius:8, color: sign1===i ? '#A78BFA' : '#3A4870', cursor:'pointer', fontFamily:'inherit',
                }}>{EMOJIS[i]}{s.replace('座','')}</button>
              ))}
            </div>
          </div>

          {/* Person 2 */}
          <div style={{ marginBottom:20, padding:'16px', background:'rgba(12,10,30,0.5)', borderRadius:14, border:'1px solid rgba(251,113,133,0.15)' }}>
            <div style={{ fontSize:11, color:'#FB7185', fontWeight:700, marginBottom:10 }}>👤 ふたりめ</div>
            <input
              value={name2}
              onChange={e => setName2(e.target.value)}
              placeholder="名前を入力（例: あい）"
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:'rgba(12,10,30,0.6)', border:'1px solid rgba(251,113,133,0.2)', borderRadius:10, color:'#E2E8FF', fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10 }}
            />
            <div style={{ fontSize:11, color:'#3A4870', marginBottom:7 }}>星座（任意）</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
              {SIGNS.map((s,i) => (
                <button key={i} onClick={() => setSign2(sign2===i ? null : i)} style={{
                  padding:'6px 4px', fontSize:10, background: sign2===i ? 'rgba(251,113,133,0.22)' : 'rgba(12,10,30,0.5)',
                  border:`1px solid ${sign2===i ? 'rgba(251,113,133,0.5)' : 'rgba(251,113,133,0.1)'}`,
                  borderRadius:8, color: sign2===i ? '#FB7185' : '#3A4870', cursor:'pointer', fontFamily:'inherit',
                }}>{EMOJIS[i]}{s.replace('座','')}</button>
              ))}
            </div>
          </div>

          <button
            onClick={check}
            disabled={!name1.trim() || !name2.trim() || loading}
            style={{
              width:'100%', padding:'14px', marginBottom:20,
              background: !name1.trim() || !name2.trim() || loading ? 'rgba(30,30,60,0.4)' : 'linear-gradient(135deg,#EC4899,#7C5CFC)',
              border:'none', borderRadius:12,
              color: !name1.trim() || !name2.trim() || loading ? '#3A4870' : '#fff',
              fontSize:15, fontWeight:700, cursor: !name1.trim() || !name2.trim() || loading ? 'default' : 'pointer',
              fontFamily:'inherit', boxShadow: !name1.trim() || !name2.trim() || loading ? 'none' : '0 4px 20px rgba(236,72,153,0.3)',
            }}
          >
            {loading ? '💕 診断中...' : '💕 相性を診断する'}
          </button>

          {/* Result */}
          {score !== null && !loading && (
            <div style={{ background:'rgba(12,10,30,0.6)', borderRadius:16, border:`1px solid ${color}40`, overflow:'hidden', marginBottom:16 }}>
              <div style={{ padding:'24px 22px', textAlign:'center', borderBottom:`1px solid ${color}20` }}>
                <div style={{ fontSize:12, color:'#5A6890', marginBottom:6 }}>{name1} × {name2}</div>
                {/* Score gauge */}
                <div style={{ position:'relative', margin:'16px auto', width:140, height:70 }}>
                  <svg viewBox="0 0 140 70" width="140" height="70">
                    <path d="M10,70 A60,60 0 0,1 130,70" fill="none" stroke="#1A2040" strokeWidth="12" strokeLinecap="round"/>
                    <path d="M10,70 A60,60 0 0,1 130,70" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${(score/100)*188} 188`}/>
                  </svg>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center' }}>
                    <div style={{ fontSize:34, fontWeight:900, color }}>{score}</div>
                    <div style={{ fontSize:10, color:'#3A4870', marginTop:-2 }}>/ 100</div>
                  </div>
                </div>
                <div style={{ fontSize:18, fontWeight:800, color, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:12, color:'#5A6890' }}>{sub}</div>
              </div>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ fontSize:13, color:'#C0C8E0', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{result}</div>
              </div>
            </div>
          )}

          {score !== null && !loading && (
            <button onClick={() => { setScore(null); setResult(''); setName1(''); setName2(''); setSign1(null); setSign2(null); }} style={{
              width:'100%', padding:'12px', background:'transparent', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, color:'#7C5CFC', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>🔄 別の組み合わせを試す</button>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'52px 20px', color:'#3A4870' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💕</div>
              <div style={{ fontSize:14 }}>まだ診断履歴がありません</div>
            </div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(12,10,30,0.5)', borderRadius:12, border:`1px solid ${getColor(h.score)}30`, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:700, color:getColor(h.score) }}>{h.name1} × {h.name2} — {h.score}点</span>
                <span style={{ fontSize:10, color:'#2A3460' }}>{h.date}</span>
              </div>
              <div style={{ fontSize:11, color:'#4A5880' }}>{h.s1} × {h.s2}</div>
              <div style={{ fontSize:11, color:'#3A4870', marginTop:4, lineHeight:1.6 }}>{getLabel(h.score)[0]} {getLabel(h.score)[1]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
