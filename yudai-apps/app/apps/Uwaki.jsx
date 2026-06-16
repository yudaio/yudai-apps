'use client';
import { useState } from 'react';
import { callAI } from './shared';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const C = { bg:'#050812', card:'#0C0E22', border:'#1A2040', text:'#E2E8FF', muted:'#5A6890', red:'#EF4444' };

const SIGNS = [
  { id:'phone',    label:'スマホを隠す・すぐ伏せる',           weight:3 },
  { id:'late',     label:'帰宅が遅くなった・外出が増えた',     weight:3 },
  { id:'look',     label:'急に外見に気を使うようになった',      weight:2 },
  { id:'cold',     label:'スキンシップが減った・冷たくなった',  weight:3 },
  { id:'lie',      label:'言い訳・嘘が増えた気がする',         weight:3 },
  { id:'money',    label:'お金の使い方が不透明になった',        weight:2 },
  { id:'sns',      label:'SNSのパスワードを変えた',            weight:2 },
  { id:'irritate', label:'些細なことで怒るようになった',        weight:2 },
  { id:'work',     label:'「仕事」と言って連絡がとれない時間が増えた', weight:3 },
  { id:'bath',     label:'帰宅後すぐ風呂に入るようになった',   weight:2 },
];

const LEVELS = [
  { min:0,  max:20,  label:'白に近い',   color:'#34D399', icon:'💚', desc:'今のところ浮気の兆候はほとんど見当たりません。' },
  { min:20, max:40,  label:'グレーゾーン', color:'#FBBF24', icon:'💛', desc:'気になる点はありますが、他の原因も考えられます。' },
  { min:40, max:60,  label:'要注意',     color:'#FB923C', icon:'🧡', desc:'複数の警戒サインが重なっています。冷静に確認を。' },
  { min:60, max:80,  label:'高リスク',   color:'#F87171', icon:'❤️', desc:'浮気の可能性が高い状況です。記録を始めましょう。' },
  { min:80, max:101, label:'限りなく黒', color:'#DC2626', icon:'🚨', desc:'深刻な状況です。一人で抱え込まず、信頼できる人に相談を。' },
];

function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score < l.max) || LEVELS[2];
}

function parseSection(text, key) {
  const m = text?.match(new RegExp(`【${key}】([\\s\\S]*?)(?=【|$)`));
  return m ? m[1].trim() : '';
}

export default function Uwaki() {
  const [checked, setChecked]   = useState({});
  const [memo, setMemo]         = useState('');
  const [period, setPeriod]     = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const { premium, remaining, blocked, check, increment, dismiss } = useGate('uwaki');

  const toggle = id => setChecked(p => ({ ...p, [id]: !p[id] }));
  const selected = SIGNS.filter(s => checked[s.id]);
  const rawScore = selected.reduce((sum, s) => sum + s.weight * 10, 0);
  const previewScore = Math.min(100, rawScore);
  const valid = selected.length > 0 || memo.trim();

  async function analyze() {
    if (!valid || loading || !check()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await callAI(
        `あなたは恋愛・夫婦問題の専門カウンセラーです。以下の情報をもとに、浮気リスクを客観的に診断してください。

【チェックした行動変化】
${selected.length > 0 ? selected.map(s => `・${s.label}`).join('\n') : '特になし'}

【気になる出来事・状況】
${memo || 'なし'}

【変化が始まった時期】
${period || '不明'}

以下の形式で診断してください：

【浮気リスクスコア】0〜100の整数のみ（0=可能性なし、100=ほぼ確実）
【リスクレベル】白に近い・グレーゾーン・要注意・高リスク・限りなく黒 のいずれか
【主な警戒サイン】チェックした項目の中で特に重要なもの（2〜3点、箇条書き）
【他の可能性】浮気以外に考えられる原因（1〜2点）
【取るべき行動】今すぐできる冷静な対処法（3点、箇条書き）
【心のケア】あなた自身へのメッセージ（2〜3行）

感情的にならず、客観的かつ温かく診断してください。`
      );
      const scoreMatch = res.match(/【浮気リスクスコア】\s*(\d+)/);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : previewScore;
      const level = getLevel(score);
      setResult({ score, level, res });
      increment();
    } catch { setResult({ error: true }); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:42, marginBottom:8 }}>💔</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:'0 0 8px' }}>AI浮気チェッカー</h1>
        <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.75 }}>
          パートナーの行動変化を選ぶだけでAIが浮気リスクを診断します。<br/>
          <span style={{ fontSize:11 }}>※本診断はAIによる参考情報です。断定するものではありません。</span>
        </p>
      </div>

      <UsageBadge remaining={remaining} premium={premium} />

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
        <div style={{ color:C.text, fontSize:14, fontWeight:700, marginBottom:14 }}>最近のパートナーの変化（当てはまるものを選択）</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {SIGNS.map(s => (
            <label key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`1px solid ${checked[s.id]?C.red+'60':'#1A2040'}`, background:checked[s.id]?C.red+'10':'transparent', cursor:'pointer', transition:'all 0.15s' }}>
              <input type="checkbox" checked={!!checked[s.id]} onChange={()=>toggle(s.id)} style={{ display:'none' }}/>
              <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked[s.id]?C.red:'#2A3460'}`, background:checked[s.id]?C.red:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                {checked[s.id] && <span style={{ color:'#fff', fontSize:11, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ color:checked[s.id]?C.text:C.muted, fontSize:13, lineHeight:1.4 }}>{s.label}</span>
            </label>
          ))}
        </div>

        {selected.length > 0 && (
          <div style={{ marginTop:14, padding:'10px 14px', background:'#0A0D20', borderRadius:10, border:`1px solid ${C.red}30` }}>
            <div style={{ color:C.muted, fontSize:12 }}>
              選択数: <span style={{ color:C.red, fontWeight:700 }}>{selected.length}個</span>
              　予測スコア: <span style={{ color:previewScore >= 60 ? C.red : previewScore >= 40 ? '#FB923C' : '#FBBF24', fontWeight:700 }}>{Math.min(100, previewScore)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'20px', marginBottom:14 }}>
        <div style={{ color:C.text, fontSize:13, fontWeight:700, marginBottom:10 }}>気になる出来事（任意）</div>
        <textarea
          value={memo} onChange={e=>setMemo(e.target.value)}
          placeholder={'例：最近よく夜遅くまでスマホを見て笑っている。\n先月から毎週末「友人と飲み会」と言って出かける。\n以前はなかったのに香水をつけて外出するようになった。'}
          style={{ width:'100%', minHeight:100, background:'#070918', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', color:C.text, fontSize:13, lineHeight:1.75, fontFamily:'inherit', resize:'vertical', outline:'none' }}
        />
        <div style={{ marginTop:12 }}>
          <label style={{ color:C.muted, fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>変化が始まったのはいつ頃？</label>
          <input type="text" value={period} onChange={e=>setPeriod(e.target.value)} placeholder="例: 1ヶ月前・3ヶ月前・半年前"
            style={{ width:'100%', background:'#070918', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}
          />
        </div>
      </div>

      <button onClick={analyze} disabled={!valid||loading}
        style={{ width:'100%', padding:'15px', background:!valid||loading?'#1A2040':'linear-gradient(135deg,#EF4444,#B91C1C)', border:'none', borderRadius:14, color:!valid||loading?C.muted:'#fff', fontSize:16, fontWeight:800, cursor:!valid||loading?'not-allowed':'pointer', fontFamily:'inherit', marginBottom:20, transition:'all 0.2s' }}>
        {loading ? '診断中…' : '💔 AIに浮気リスクを診断してもらう'}
      </button>

      {result && !result.error && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease' }}>
          <div style={{ background:C.card, border:`1px solid ${result.level.color}44`, borderRadius:16, overflow:'hidden' }}>
            <div style={{ padding:'20px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:28 }}>{result.level.icon}</span>
                  <div>
                    <div style={{ color:result.level.color, fontSize:18, fontWeight:900 }}>{result.level.label}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>浮気リスクスコア</div>
                  </div>
                </div>
                <div style={{ color:result.level.color, fontSize:42, fontWeight:900, lineHeight:1 }}>{result.score}</div>
              </div>
              <div style={{ height:8, background:'#1A2040', borderRadius:4, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', width:`${result.score}%`, background:`linear-gradient(90deg,#34D399,${result.level.color})`, borderRadius:4, transition:'width 1.2s ease' }}/>
              </div>
              <div style={{ color:C.muted, fontSize:13, lineHeight:1.7 }}>{result.level.desc}</div>
            </div>
            <div style={{ padding:'18px 20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
              {['主な警戒サイン','他の可能性','取るべき行動','心のケア'].map(key => {
                const val = parseSection(result.res, key);
                if (!val) return null;
                const colors = { '主な警戒サイン':'#F87171', '他の可能性':'#60A5FA', '取るべき行動':'#34D399', '心のケア':'#C084FC' };
                return (
                  <div key={key}>
                    <div style={{ color:colors[key], fontSize:11, fontWeight:700, marginBottom:5, letterSpacing:'0.05em' }}>{key}</div>
                    <div style={{ color:C.text, fontSize:13, lineHeight:1.85, whiteSpace:'pre-wrap' }}>{val}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding:'10px 14px', background:'#0A0A1A', border:'1px solid #1A2040', borderRadius:10, color:C.muted, fontSize:11, lineHeight:1.7 }}>
            ※本診断はAIによる参考情報です。感情的な行動の前に、冷静な確認と信頼できる人への相談をおすすめします。
          </div>
        </div>
      )}
      {result?.error && <div style={{ padding:16, background:'#1A0820', border:'1px solid #F8718040', borderRadius:12, color:'#F87180', fontSize:13 }}>エラーが発生しました。もう一度お試しください。</div>}

      <div style={{ marginTop:28, padding:'22px 20px', background:'linear-gradient(135deg,#1A0808,#0D1235)', border:'1px solid #EF444440', borderRadius:16, textAlign:'center' }}>
        <div style={{ color:'#FCA5A5', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:8 }}>✨ PREMIUM</div>
        <div style={{ color:C.text, fontSize:16, fontWeight:800, marginBottom:6 }}>診断し放題＋証拠保全アドバイス</div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.8, marginBottom:18 }}>
          毎日使い放題・履歴保存・証拠の集め方ガイド・法的手続きの相談窓口案内
        </div>
        <button style={{ padding:'12px 28px', background:'linear-gradient(135deg,#EF4444,#B91C1C)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
          ¥1,480/月 で始める
        </button>
        <div style={{ color:'#3A4870', fontSize:11, marginTop:10 }}>7日間無料 · いつでもキャンセル可</div>
      </div>

      {blocked && <PaywallModal onClose={dismiss} />}
    </div>
  );
}
