'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', purple:'#8B5CF6' };

const NUM_FIELDS = [
  { id:'duration',       label:'婚姻期間',             placeholder:'10',   unit:'年',   note:'入籍から現在まで' },
  { id:'myIncome',       label:'自分の年収（概算）',    placeholder:'300',  unit:'万円', note:'給与・パート含む' },
  { id:'partnerIncome',  label:'相手の年収（概算）',    placeholder:'500',  unit:'万円', note:'0なら0と入力' },
  { id:'assets',         label:'夫婦の共有財産合計',    placeholder:'2000', unit:'万円', note:'預金・不動産・投資など' },
];
const CHILD_OPTIONS = ['なし', '1人', '2人', '3人以上'];
const HOME_OPTIONS  = ['持ち家あり（ローン残あり）', '持ち家あり（ローン完済）', '賃貸'];
const REASON_OPTIONS = ['協議離婚（話し合い）', '性格の不一致', '不倫・浮気（相手が有責）', 'DV・モラハラ（相手が有責）', '不倫・浮気（自分が有責）'];

const SECTIONS = [
  { key:'財産分与',        icon:'💰', color:'#60A5FA' },
  { key:'養育費',          icon:'👶', color:'#34D399' },
  { key:'慰謝料',          icon:'⚖️', color:'#F87171' },
  { key:'離婚後の生活費',  icon:'🏠', color:'#FBBF24' },
  { key:'手順・優先アクション', icon:'✅', color:'#8B5CF6' },
  { key:'注意点',          icon:'⚠️', color:'#FB923C' },
];

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {options.map(opt => (
        <button key={opt} onClick={()=>onChange(opt)}
          style={{ padding:'8px 12px', borderRadius:8, border:`1px solid ${value===opt?C.purple:'#1A2040'}`, background:value===opt?C.purple+'20':'transparent', color:value===opt?C.purple:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Rikon() {
  const [vals, setVals]       = useState({ duration:'', myIncome:'', partnerIncome:'', assets:'' });
  const [children, setChildren] = useState('');
  const [childAge, setChildAge] = useState('');
  const [home, setHome]       = useState('');
  const [reason, setReason]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('rikon');

  const numValid = NUM_FIELDS.every(f => vals[f.id] !== '' && !isNaN(Number(vals[f.id])));
  const valid = numValid && children && home && reason;

  async function analyze() {
    if (!valid || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたは離婚問題に詳しいファイナンシャルプランナーです。以下の情報をもとに、離婚した場合の財務シミュレーションをしてください。

【状況】
- 婚姻期間: ${vals.duration}年
- 自分の年収: ${vals.myIncome}万円
- 相手の年収: ${vals.partnerIncome}万円
- 共有財産: ${vals.assets}万円
- 子供: ${children}${children !== 'なし' && childAge ? `（年齢: ${childAge}）` : ''}
- 住居: ${home}
- 離婚理由: ${reason}

以下の形式で具体的に試算してください：

【財産分与】財産分与の金額（概算・根拠付きで）
【養育費】養育費の月額試算（子供がいる場合。相場と計算根拠）
【慰謝料】慰謝料の有無と概算（有責がある場合は金額目安）
【離婚後の生活費】離婚後の月々の生活費シミュレーション（手取り概算）
【手順・優先アクション】今すぐやるべきこと3〜5点
【注意点】この状況特有のリスク・注意事項（1〜2点）

金額は万円単位で具体的に書いてください。`
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
        <div style={{ fontSize:42, marginBottom:8 }}>⚖️</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AI離婚シミュレーター</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          離婚した場合の財産分与・養育費・生活費をAIが試算します。<br/>
          <span style={{ fontSize:11 }}>※本ツールは参考情報です。重要な判断前に弁護士にご相談ください。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:16 }}>基本情報を入力</div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
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

          <div>
            <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>子供</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CHILD_OPTIONS.map(opt => (
                <button key={opt} onClick={()=>setChildren(opt)}
                  style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${children===opt?C.purple:'#1A2040'}`, background:children===opt?C.purple+'20':'transparent', color:children===opt?C.purple:C.muted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {opt}
                </button>
              ))}
            </div>
            {children && children !== 'なし' && (
              <input type="text" value={childAge} onChange={e=>setChildAge(e.target.value)} placeholder="子供の年齢（例: 3歳・6歳）"
                style={{ width:'100%', background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none', marginTop:8 }}/>
            )}
          </div>

          <div>
            <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>住居</label>
            <ChipGroup options={HOME_OPTIONS} value={home} onChange={setHome} />
          </div>

          <div>
            <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:8 }}>離婚理由</label>
            <ChipGroup options={REASON_OPTIONS} value={reason} onChange={setReason} />
          </div>
        </div>
      </div>

      <button onClick={analyze} disabled={!valid||loading}
        style={{ width:'100%', padding:'15px', background:!valid||loading?'#1A2040':'linear-gradient(135deg,#8B5CF6,#6366F1)', border:'none', borderRadius:14, color:!valid||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!valid||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
        {loading?'試算中…':'⚖️ 離婚した場合をシミュレーション'}
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
          <div style={{ padding:'10px 14px', background:'#0A0A1A', border:'1px solid #1A2040', borderRadius:10, color:C.muted, fontSize:11, lineHeight:1.7 }}>
            ※本試算はAIによる参考値です。実際の金額は裁判所の算定表・個別事情により異なります。
          </div>
        </div>
      )}
      {result==='error'&&<div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#150A30,#0D1235)', border:'1px solid #8B5CF640', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#C4B5FD', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>試算し放題＋弁護士費用シミュレーション</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          毎月3回→無制限・PDF保存・弁護士紹介・法テラス情報
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#8B5CF6,#6366F1)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥1,480/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
