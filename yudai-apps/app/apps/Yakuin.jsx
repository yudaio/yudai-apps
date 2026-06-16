'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', green:'#10B981' };

const FIELDS = [
  { id:'sales',    label:'法人の年間売上（概算）', placeholder:'5000', unit:'万円', note:'税込みでOK' },
  { id:'expenses', label:'役員報酬以外の年間経費',  placeholder:'2000', unit:'万円', note:'人件費・賃料・仕入れなど' },
  { id:'salary',   label:'現在の役員報酬（月額）',  placeholder:'80',   unit:'万円', note:'設定していない場合は0' },
  { id:'other',    label:'法人以外の年間収入',      placeholder:'0',    unit:'万円', note:'副業・不動産収入など' },
];

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

const SECTIONS = [
  { key:'現状分析',      icon:'📊', color:'#60A5FA' },
  { key:'最適役員報酬額',icon:'💡', color:'#10B981' },
  { key:'推定節税効果',  icon:'💰', color:'#FBBF24' },
  { key:'配当活用',      icon:'📈', color:'#A78BFA' },
  { key:'優先アクション',icon:'✅', color:'#10B981' },
  { key:'注意事項',      icon:'⚠️', color:'#FB923C' },
];

export default function Yakuin() {
  const [vals, setVals] = useState({ sales:'', expenses:'', salary:'', other:'' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('yakuin');

  const valid = FIELDS.every(f => vals[f.id] !== '' && !isNaN(Number(vals[f.id])));
  const profit = valid ? Number(vals.sales) - Number(vals.expenses) - Number(vals.salary) * 12 : null;

  async function analyze() {
    if (!valid || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたは法人税・所得税・社会保険を熟知した税務コンサルタントです。以下の情報をもとに、役員報酬の最適化をアドバイスしてください。

【現状】
- 法人年間売上: ${vals.sales}万円
- 役員報酬以外の経費: ${vals.expenses}万円
- 現在の役員報酬: 月${vals.salary}万円（年${Number(vals.salary)*12}万円）
- 法人以外の年間収入: ${vals.other}万円
- 現在の税引前法人利益（概算）: ${profit}万円

以下の形式で具体的にアドバイスしてください：

【現状分析】現在の役員報酬設定の問題点またはメリット（2〜3点）
【最適役員報酬額】月額XXX万円が最適（理由も1行で）
【推定節税効果】現状と最適化後の税負担差額の概算（万円単位で）
【配当活用】役員報酬と配当のベストな組み合わせ（あれば）
【優先アクション】今すぐやるべきこと3点（箇条書き）
【注意事項】適用条件・注意点（1〜2点）

金額は万円単位で具体的に書いてください。曖昧な回答は避け、数値を明示してください。`
      );
      setResult(res);
      increment();
    } catch { setResult('error'); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:42, marginBottom:8 }}>💼</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AI役員報酬最適化</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          法人オーナー・経営者向け。役員報酬の最適額をAIが試算し、節税効果を最大化します。<br/>
          <span style={{ fontSize:11 }}>※本ツールは参考情報です。確定前は税理士にご確認ください。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'22px 20px', marginBottom:16 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:16 }}>法人の財務情報を入力</div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {FIELDS.map(f => (
            <div key={f.id}>
              <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:5 }}>{f.label}</label>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  type="number" value={vals[f.id]}
                  onChange={e => setVals(v=>({...v,[f.id]:e.target.value}))}
                  placeholder={f.placeholder}
                  style={{ flex:1, background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:16, fontFamily:'inherit', fontWeight:700, outline:'none' }}
                />
                <span style={{ color:C.muted, fontSize:13, whiteSpace:'nowrap' }}>{f.unit}</span>
              </div>
              <div style={{ color:'#3A4870', fontSize:11, marginTop:3 }}>{f.note}</div>
            </div>
          ))}
        </div>
        {profit !== null && (
          <div style={{ marginTop:16, padding:'10px 14px', background:'#0A1428', border:'1px solid #1E2A50', borderRadius:10 }}>
            <div style={{ color:C.muted, fontSize:12 }}>
              概算税引前利益:&nbsp;
              <span style={{ color:profit>=0?C.green:'#F87171', fontWeight:700 }}>{profit.toLocaleString()}万円</span>
            </div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={!valid||loading}
        style={{ width:'100%', padding:'15px', background:!valid||loading?'#1A2040':'linear-gradient(135deg,#10B981,#3B82F6)', border:'none', borderRadius:14, color:!valid||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!valid||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
        {loading?'分析中…':'💡 最適役員報酬を分析する'}
      </button>

      {result&&result!=='error'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease' }}>
          {SECTIONS.map(({ key, icon, color }) => {
            const val = parseSection(result, key);
            if (!val) return null;
            return (
              <div key={key} style={{ background:C.card, border:`1px solid ${color}30`, borderRadius:14, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ color, fontSize:12, fontWeight:700, letterSpacing:'0.05em' }}>{key}</span>
                </div>
                <div style={{ color:C.text, fontSize:13, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{val}</div>
              </div>
            );
          })}
        </div>
      )}
      {result==='error'&&<div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#0A1A10,#0D1235)', border:'1px solid #10B98140', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#6EE7B7', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>詳細シミュレーション＋毎月更新</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          役員報酬・配当・法人税・所得税・社会保険を完全試算<br/>
          税制改正の影響を毎月自動チェック
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#10B981,#3B82F6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥2,980/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
