'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', gold:'#F59E0B' };

const NUM_FIELDS = [
  { id:'assets_real',  label:'不動産の評価額（相続税評価額）', placeholder:'5000', unit:'万円', note:'固定資産税通知書の評価額が目安' },
  { id:'assets_cash',  label:'預金・現金・有価証券',           placeholder:'3000', unit:'万円', note:'銀行預金・証券・現金など' },
  { id:'assets_other', label:'その他の財産',                   placeholder:'500',  unit:'万円', note:'生命保険金（非課税枠除く）・車など' },
  { id:'heirs',        label:'法定相続人の人数',               placeholder:'3',    unit:'人',   note:'配偶者・子供・両親など法律上の相続人数' },
  { id:'debts',        label:'被相続人の負債',                 placeholder:'0',    unit:'万円', note:'住宅ローン残高・借金など（控除可能）' },
];
const PARENT_AGES = ['60代', '70代', '80代', '90代以上'];
const RELATIONS   = ['子供として相続する', '配偶者として相続する', '孫として相続する', '兄弟姉妹として相続する'];

const SECTIONS = [
  { key:'相続財産の合計',  icon:'💰', color:'#F59E0B' },
  { key:'基礎控除額',      icon:'📋', color:'#60A5FA' },
  { key:'概算相続税額',    icon:'🧮', color:'#F87171' },
  { key:'節税対策TOP3',    icon:'💡', color:'#34D399' },
  { key:'今すぐやること',  icon:'✅', color:'#A78BFA' },
  { key:'注意事項',        icon:'⚠️', color:'#FB923C' },
];

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

export default function Souzoku() {
  const [vals, setVals]       = useState({ assets_real:'', assets_cash:'', assets_other:'', heirs:'', debts:'' });
  const [parentAge, setParentAge] = useState('');
  const [relation, setRelation]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('souzoku');

  const numValid = NUM_FIELDS.every(f => vals[f.id] !== '' && !isNaN(Number(vals[f.id])));
  const valid = numValid && parentAge && relation;

  const totalAssets   = numValid ? Number(vals.assets_real) + Number(vals.assets_cash) + Number(vals.assets_other) - Number(vals.debts) : null;
  const basicDeduct   = vals.heirs ? 3000 + 600 * Number(vals.heirs) : null;
  const taxableBase   = totalAssets !== null && basicDeduct !== null ? Math.max(0, totalAssets - basicDeduct) : null;

  async function analyze() {
    if (!valid || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたは相続税に詳しいファイナンシャルプランナーです。以下の情報をもとに、相続税の概算と節税対策をアドバイスしてください。

【相続人の状況】
- 立場: ${relation}
- 被相続人（親）の年齢: ${parentAge}
- 法定相続人の数: ${vals.heirs}人

【財産内訳】
- 不動産評価額: ${vals.assets_real}万円
- 預金・現金・証券: ${vals.assets_cash}万円
- その他: ${vals.assets_other}万円
- 負債: ${vals.debts}万円
- 正味財産合計: ${totalAssets}万円

【計算条件】
- 基礎控除: 3,000万円 + 600万円 × ${vals.heirs}人 = ${basicDeduct}万円
- 課税対象額: ${taxableBase}万円

以下の形式で具体的にアドバイスしてください：

【相続財産の合計】財産の内訳と正味財産合計（確認）
【基礎控除額】基礎控除の計算と課税対象財産額
【概算相続税額】相続税速算表に基づいた概算税額（各相続人の取り分と合計税額）
【節税対策TOP3】この状況で最も効果的な節税対策を3つ（暦年贈与・小規模宅地特例・生命保険非課税枠など具体的に）
【今すぐやること】親が元気なうちに今すぐできる対策3〜5点
【注意事項】この状況特有のリスク・注意点（1〜2点）

金額は万円単位で具体的に示してください。`
      );
      setResult(res);
      increment();
    } catch { setResult('error'); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:42, marginBottom:8 }}>🏦</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AI相続税対策</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          親の財産と相続人数を入力するだけで、相続税の概算と節税対策をAIが試算します。<br/>
          <span style={{ fontSize:11 }}>※本ツールは参考情報です。確定前は税理士にご確認ください。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:16 }}>相続情報を入力</div>

        <div style={{ marginBottom:16 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>あなたの立場</label>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {RELATIONS.map(opt => (
              <button key={opt} onClick={()=>setRelation(opt)}
                style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${relation===opt?C.gold:'#1A2040'}`, background:relation===opt?C.gold+'20':'transparent', color:relation===opt?C.gold:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>親（被相続人）の年齢</label>
          <div style={{ display:'flex', gap:6 }}>
            {PARENT_AGES.map(opt => (
              <button key={opt} onClick={()=>setParentAge(opt)}
                style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${parentAge===opt?C.gold:'#1A2040'}`, background:parentAge===opt?C.gold+'20':'transparent', color:parentAge===opt?C.gold:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {NUM_FIELDS.map(f => (
            <div key={f.id}>
              <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:5 }}>{f.label}</label>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="number" value={vals[f.id]} onChange={e=>setVals(v=>({...v,[f.id]:e.target.value}))} placeholder={f.placeholder}
                  style={{ flex:1, background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:16, fontFamily:'inherit', fontWeight:700, outline:'none' }}/>
                <span style={{ color:C.muted, fontSize:13, whiteSpace:'nowrap' }}>{f.unit}</span>
              </div>
              <div style={{ color:'#3A4870', fontSize:11, marginTop:3 }}>{f.note}</div>
            </div>
          ))}
        </div>

        {taxableBase !== null && (
          <div style={{ marginTop:16, padding:'12px 14px', background:'#0A1020', border:'1px solid #1E2A40', borderRadius:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:C.muted, fontSize:12 }}>正味財産合計</span>
              <span style={{ color:C.gold, fontWeight:700, fontSize:12 }}>{totalAssets.toLocaleString()}万円</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:C.muted, fontSize:12 }}>基礎控除</span>
              <span style={{ color:'#34D399', fontWeight:700, fontSize:12 }}>▲{basicDeduct.toLocaleString()}万円</span>
            </div>
            <div style={{ height:1, background:'#1A2040', margin:'8px 0' }}/>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:C.muted, fontSize:12 }}>課税対象額（概算）</span>
              <span style={{ color:taxableBase>0?'#F87171':'#34D399', fontWeight:900, fontSize:13 }}>
                {taxableBase > 0 ? `${taxableBase.toLocaleString()}万円` : '課税なし'}
              </span>
            </div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={!valid||loading}
        style={{ width:'100%', padding:'15px', background:!valid||loading?'#1A2040':'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:14, color:!valid||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!valid||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
        {loading?'試算中…':'🏦 相続税と節税対策を試算する'}
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
                  <span style={{ color, fontSize:12, fontWeight:700 }}>{key}</span>
                </div>
                <div style={{ color:C.text, fontSize:13, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{val}</div>
              </div>
            );
          })}
        </div>
      )}
      {result==='error'&&<div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#1A1000,#0D1235)', border:'1px solid #F59E0B40', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#FDE68A', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>詳細試算＋節税シナリオ比較</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          複数の節税対策シナリオを比較・税理士紹介・毎年の贈与計画を自動生成
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥1,980/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
