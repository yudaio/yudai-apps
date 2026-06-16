'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', blue:'#0EA5E9' };

const AREAS   = ['東京23区', '東京郊外・横浜', '大阪・京都・神戸', '名古屋', '福岡・札幌', '地方都市', '過疎地域'];
const TYPES   = ['区分マンション（ワンルーム）', '区分マンション（1LDK〜）', '一戸建て', '一棟アパート', '一棟マンション', '商業・テナント'];
const PURPOSES = ['長期家賃収入', '短期売買（転売）', '相続対策・資産保全', '節税目的'];

const SECTIONS = [
  { key:'総合評価',     icon:'🎯', color:'#0EA5E9' },
  { key:'実質利回り試算', icon:'💹', color:'#34D399' },
  { key:'リスク要因',   icon:'⚠️', color:'#F87171' },
  { key:'キャッシュフロー', icon:'💰', color:'#FBBF24' },
  { key:'確認すべきポイント', icon:'✅', color:'#A78BFA' },
  { key:'投資判断',     icon:'📋', color:'#60A5FA' },
];

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

const VERDICT_COLORS = { '◎': '#34D399', '△': '#FBBF24', '✕': '#F87171' };

export default function Fudosan() {
  const [vals, setVals]   = useState({ price:'', yield:'', age:'', mgmt:'' });
  const [area, setArea]   = useState('');
  const [type, setType]   = useState('');
  const [purpose, setPurpose] = useState('');
  const [loan, setLoan]   = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('fudosan');

  const numValid = ['price','yield','age','mgmt'].every(k => vals[k] !== '' && !isNaN(Number(vals[k])));
  const valid = numValid && area && type && purpose;

  const grossYield   = numValid && vals.price > 0 ? (Number(vals.price) * Number(vals.yield) / 100 / 10000) : null;
  const netYieldEst  = grossYield !== null ? (grossYield - Number(vals.mgmt) * 12 / 10000) : null;
  const netYieldPct  = netYieldEst !== null && Number(vals.price) > 0
    ? (netYieldEst / (Number(vals.price) / 10000) * 100).toFixed(2) : null;

  async function analyze() {
    if (!valid || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたは不動産投資の専門家です。以下の物件情報をもとに、投資リスクと収益性を客観的に診断してください。

【物件情報】
- 物件価格: ${vals.price}万円
- 表面利回り: ${vals.yield}%
- 築年数: ${vals.age}年
- 所在エリア: ${area}
- 物件タイプ: ${type}
- 月額管理費・修繕積立金: ${vals.mgmt}万円
- ローン活用: ${loan || '未定'}
- 投資目的: ${purpose}
- 概算実質利回り: 約${netYieldPct}%（管理費控除後）

以下の形式で診断してください：

【総合評価】◎推奨 / △要検討 / ✕見送り のいずれか＋一言理由
【実質利回り試算】管理費・空室リスク・修繕積立を考慮した実質利回りの詳細計算
【リスク要因】この物件特有のリスク3点（築年数・エリア・タイプ別に具体的に）
【キャッシュフロー】月次・年次のキャッシュフロー試算（ローンありの場合は含めて）
【確認すべきポイント】内見・書類確認で必ずチェックすべき事項3〜5点
【投資判断】この投資が向いている人・向いていない人（各2点）

金額は万円単位で具体的に記載してください。`
      );
      setResult(res);
      increment();
    } catch { setResult('error'); }
    setLoading(false);
  }

  const verdict = result && result !== 'error' ? parseSection(result, '総合評価').charAt(0) : null;
  const verdictColor = verdict ? (VERDICT_COLORS[verdict] || C.blue) : C.blue;

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:42, marginBottom:8 }}>🏢</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AI不動産投資診断</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          物件情報を入力するだけでリスクスコア・実質利回り・投資判断をAIが試算します。<br/>
          <span style={{ fontSize:11 }}>※本ツールは参考情報です。最終判断は専門家にご確認ください。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:16 }}>物件情報を入力</div>

        {[
          { id:'price', label:'物件価格',              placeholder:'3500', unit:'万円', note:'税込みの購入価格' },
          { id:'yield', label:'表面利回り（満室想定）', placeholder:'7.2',  unit:'%',   note:'年間賃料収入 ÷ 物件価格 × 100' },
          { id:'age',   label:'築年数',                placeholder:'15',   unit:'年',   note:'1981年以降なら新耐震基準' },
          { id:'mgmt',  label:'月額管理費・修繕積立金', placeholder:'2',    unit:'万円', note:'マンションの場合は管理費＋修繕積立金' },
        ].map(f => (
          <div key={f.id} style={{ marginBottom:14 }}>
            <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:5 }}>{f.label}</label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="number" value={vals[f.id]} onChange={e=>setVals(v=>({...v,[f.id]:e.target.value}))} placeholder={f.placeholder}
                style={{ flex:1, background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:16, fontFamily:'inherit', fontWeight:700, outline:'none' }}/>
              <span style={{ color:C.muted, fontSize:13, whiteSpace:'nowrap' }}>{f.unit}</span>
            </div>
            <div style={{ color:'#3A4870', fontSize:11, marginTop:3 }}>{f.note}</div>
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>所在エリア</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {AREAS.map(a => (
              <button key={a} onClick={()=>setArea(a)}
                style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${area===a?C.blue:'#1A2040'}`, background:area===a?C.blue+'20':'transparent', color:area===a?C.blue:C.muted, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>物件タイプ</label>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {TYPES.map(t => (
              <button key={t} onClick={()=>setType(t)}
                style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${type===t?C.blue:'#1A2040'}`, background:type===t?C.blue+'20':'transparent', color:type===t?C.blue:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>投資目的</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {PURPOSES.map(p => (
              <button key={p} onClick={()=>setPurpose(p)}
                style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${purpose===p?C.blue:'#1A2040'}`, background:purpose===p?C.blue+'20':'transparent', color:purpose===p?C.blue:C.muted, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>ローンの活用（任意）</label>
          <input type="text" value={loan} onChange={e=>setLoan(e.target.value)} placeholder="例: 2800万円・金利1.5%・35年"
            style={{ width:'100%', background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}/>
        </div>

        {netYieldPct && (
          <div style={{ marginTop:14, padding:'12px 14px', background:'#0A1020', border:'1px solid #1E2A40', borderRadius:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:C.muted, fontSize:12 }}>表面利回り</span>
              <span style={{ color:C.blue, fontWeight:700, fontSize:12 }}>{vals.yield}%</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:C.muted, fontSize:12 }}>概算実質利回り（管理費控除後）</span>
              <span style={{ color:Number(netYieldPct)>=5?'#34D399':Number(netYieldPct)>=3?'#FBBF24':'#F87171', fontWeight:900, fontSize:13 }}>{netYieldPct}%</span>
            </div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={!valid||loading}
        style={{ width:'100%', padding:'15px', background:!valid||loading?'#1A2040':'linear-gradient(135deg,#0EA5E9,#3B82F6)', border:'none', borderRadius:14, color:!valid||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!valid||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
        {loading ? '診断中…' : '🏢 投資リスクをAI診断する'}
      </button>

      {result && result !== 'error' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease' }}>
          {verdict && (
            <div style={{ padding:'14px 18px', background:verdictColor+'15', border:`2px solid ${verdictColor}50`, borderRadius:14, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:36, fontWeight:900, color:verdictColor }}>{verdict}</span>
              <div>
                <div style={{ color:verdictColor, fontSize:14, fontWeight:800 }}>
                  {verdict==='◎'?'投資推奨':verdict==='△'?'要検討':'見送り推奨'}
                </div>
                <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>AI総合評価</div>
              </div>
            </div>
          )}
          {SECTIONS.map(({ key, icon, color }) => {
            const val = parseSection(result, key);
            if (!val || key === '総合評価') return null;
            return (
              <div key={key} style={{ background:C.card, border:`1px solid ${color}30`, borderRadius:14, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ color, fontSize:12, fontWeight:700 }}>{key}</span>
                </div>
                <div style={{ color:C.text, fontSize:13, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{val}</div>
              </div>
            );
          })}
        </div>
      )}
      {result === 'error' && <div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#050E1A,#0D1235)', border:'1px solid #0EA5E940', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#7DD3FC', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>複数物件比較＋エリア分析レポート</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          複数物件を並べて比較・将来の人口動態リスク分析・物件管理会社の評判チェック
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#0EA5E9,#3B82F6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥1,980/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
