'use client';
import { useState, useEffect } from 'react';

/* ─────────────── デザイントークン ─────────────── */
const T = {
  bg:       '#FDF6F9',
  bgCard:   '#FFFFFF',
  rose:     '#BE185D',
  roseSoft: '#F472B6',
  rosePale: '#FCE7F3',
  gold:     '#D97706',
  goldSoft: '#FDE68A',
  text:     '#1F1235',
  muted:    '#9D8BA5',
  border:   '#F3D8E8',
  green:    '#059669',
  shadow:   '0 4px 24px rgba(190,24,93,0.10)',
  shadowLg: '0 12px 48px rgba(190,24,93,0.16)',
};

const FREE_KEY  = 'marry_usage';
const FREE_LIMIT = 1;

function getUsage() {
  try { return JSON.parse(localStorage.getItem(FREE_KEY) || '{"count":0}'); }
  catch { return { count: 0 }; }
}
function bumpUsage() {
  const u = getUsage();
  localStorage.setItem(FREE_KEY, JSON.stringify({ count: u.count + 1 }));
}

/* ─────────────── フォームステップ定義 ─────────────── */
const STEPS = [
  {
    icon: '🌸', title: 'あなたのこと',
    fields: [
      { key: 'age',    label: '年齢',        placeholder: '例：30歳' },
      { key: 'job',    label: '職業・業種',   placeholder: '例：看護師、会社員（営業）、フリーランスデザイナー' },
      { key: 'income', label: '年収（任意）', placeholder: '例：350万円、400〜500万円' },
    ],
  },
  {
    icon: '💄', title: '自己イメージ',
    fields: [
      { key: 'looks',     label: '外見の自己評価',       placeholder: '例：普通くらい、清潔感はある、スタイルに自信あり' },
      { key: 'character', label: '性格・強み',           placeholder: '例：明るくて話しやすい、落ち着いている、料理が得意' },
      { key: 'weakness',  label: '弱み・コンプレックス（任意）', placeholder: '例：人見知り、初対面が苦手、過去の婚活がうまくいかなかった' },
    ],
  },
  {
    icon: '💍', title: '理想と状況',
    fields: [
      { key: 'ideal',    label: '理想の相手（条件）',     placeholder: '例：年収500万以上、優しい、同い年〜5歳上くらい' },
      { key: 'apps',     label: '使っているアプリ・サービス（任意）', placeholder: '例：ペアーズ使用中、婚活パーティー経験あり、まだ何もしていない' },
      { key: 'timeline', label: '結婚希望時期',           placeholder: '例：1〜2年以内、できるだけ早く、まずは良い人に出会いたい' },
    ],
  },
];

/* ─────────────── メインコンポーネント ─────────────── */
export default function Marry() {
  const [step,    setStep]   = useState(0);
  const [fields,  setFields] = useState({});
  const [report,  setReport] = useState('');
  const [loading, setLoading]= useState(false);
  const [usage,   setUsage]  = useState({ count: 0 });
  const [copied,  setCopied] = useState(false);

  useEffect(() => setUsage(getUsage()), []);

  const isFree = usage.count < FREE_LIMIT;

  function setF(k, v) { setFields(p => ({ ...p, [k]: v })); }

  function canNext() {
    const required = STEPS[step].fields.filter(f => !f.label.includes('任意'));
    return required.every(f => (fields[f.key] || '').trim().length > 1);
  }

  async function generate() {
    if (!isFree) { setStep(99); return; }
    setStep(10); setLoading(true); setReport('');

    const prompt = `
あなたは婚活市場のプロコンサルタントです。
以下のプロフィールを分析し、専用の婚活戦略レポートを作成してください。

【プロフィール】
年齢：${fields.age}
職業：${fields.job}
年収：${fields.income || '未回答'}
外見自己評価：${fields.looks}
性格・強み：${fields.character}
弱み：${fields.weakness || 'なし'}
理想の相手：${fields.ideal}
使用中サービス：${fields.apps || 'なし'}
希望時期：${fields.timeline}

【必ず以下の構成で出力してください】

## 💎 あなたの婚活市場価値スコア

総合スコア：★★★★☆（100点中◯◯点）
スコアの根拠を3〜4文で具体的に。強みと伸びしろを正直に。

## 🎯 狙うべき相手のスペック帯

あなたのプロフィールをもとに、現実的かつ幸せになれる相手像を具体的に。
「夢を壊すようですが…」という正直なアドバイスも含める。

## 📱 今すぐ使うべき婚活サービスTOP3

各サービスについて：
- サービス名と特徴
- このプロフィールに向いている理由
- 注意点

## ✍️ プロフィール文改善案

現状の自己紹介で犯しがちなミス → 改善後のサンプル文（具体的に）

## 💡 あなた専用の攻略戦略3つ

このプロフィールの人が${fields.timeline}以内に結婚するための具体的行動。

## ⚠️ やってはいけないNG行動

このタイプがはまりやすい失敗パターンを3つ。なぜNGなのかも説明。
`.trim();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'あなたは婚活市場の辛口プロコンサルタントです。耳障りの良いことだけでなく、本当に役立つ現実的なアドバイスを提供してください。具体的なサービス名・数字・事例を必ず含めてください。',
          user: prompt,
          max: 2000,
        }),
      });
      const { text } = await res.json();
      setReport(text);
      bumpUsage();
      setUsage(getUsage());
    } catch {
      setReport('エラーが発生しました。もう一度お試しください。');
    }
    setLoading(false);
  }

  /* ── ペイウォール ── */
  if (step === 99) return <Upgrade onBack={() => setStep(2)} />;

  /* ── 生成中 / 結果 ── */
  if (step === 10) return (
    <ResultScreen
      loading={loading}
      report={report}
      copied={copied}
      onCopy={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      onUpgrade={() => setStep(99)}
      onReset={() => { setStep(0); setReport(''); setFields({}); }}
    />
  );

  /* ── フォーム ── */
  const def = STEPS[step];
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #FDF2F8 0%, #FFF7ED 50%, #F0FDF4 100%)`, padding: '0 0 40px' }}>

      {/* ヒーロー */}
      <div style={{ background: `linear-gradient(135deg, #831843 0%, #BE185D 50%, #DB2777 100%)`, padding: '36px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>💍</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            婚活市場価値診断
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.7 }}>
            あなたのスペックを分析し<br />
            <span style={{ color: T.goldSoft, fontWeight: 700 }}>結婚までの最短ルート</span>を提案します
          </p>
          {/* ハートプログレス */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: i <= step ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  border: i <= step ? '2px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, transition: 'all 0.3s',
                  boxShadow: i === step ? '0 0 16px rgba(255,255,255,0.3)' : 'none',
                }}>
                  {i < step ? '✓' : s.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 24, height: 2, background: i < step ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', borderRadius: 1, transition: 'all 0.3s' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* フォームカード */}
      <div style={{ maxWidth: 520, margin: '-24px auto 0', padding: '0 16px' }}>
        <div style={{ background: T.bgCard, borderRadius: 20, padding: '28px 24px', boxShadow: T.shadowLg, border: `1px solid ${T.border}` }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.rosePale, borderRadius: 20, padding: '4px 14px', marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{def.icon}</span>
              <span style={{ color: T.rose, fontSize: 12, fontWeight: 700 }}>STEP {step + 1} / {STEPS.length}</span>
            </div>
            <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, margin: 0 }}>{def.title}</h2>
          </div>

          {def.fields.map(f => (
            <div key={f.key} style={{ marginBottom: 18 }}>
              <label style={{ color: T.text, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {f.label}
                {f.label.includes('任意') && (
                  <span style={{ color: T.muted, fontSize: 11, fontWeight: 400, marginLeft: 6 }}>（スキップ可）</span>
                )}
              </label>
              <input
                value={fields[f.key] || ''}
                onChange={e => setF(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#FAFAFA', border: `1.5px solid ${fields[f.key] ? T.roseSoft : '#E5D5DC'}`,
                  borderRadius: 12, color: T.text, padding: '12px 14px', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: 'system-ui, sans-serif',
                }}
                onFocus={e => e.target.style.borderColor = T.rose}
                onBlur={e => e.target.style.borderColor = fields[f.key] ? T.roseSoft : '#E5D5DC'}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {step > 0 && (
              <button onClick={() => setStep(p => p - 1)} style={{
                flex: 1, background: 'transparent', border: `1.5px solid ${T.border}`,
                color: T.muted, borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>
                ← 戻る
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(p => p + 1)} disabled={!canNext()} style={{
                flex: 3,
                background: canNext()
                  ? 'linear-gradient(135deg, #BE185D, #DB2777)'
                  : '#F3D8E8',
                color: canNext() ? '#fff' : T.muted,
                border: 'none', borderRadius: 12, padding: '14px',
                cursor: canNext() ? 'pointer' : 'default',
                fontSize: 15, fontWeight: 800,
                boxShadow: canNext() ? '0 4px 16px rgba(190,24,93,0.35)' : 'none',
                transition: 'all 0.2s',
              }}>
                次へ →
              </button>
            ) : (
              <button onClick={generate} disabled={!canNext()} style={{
                flex: 3,
                background: canNext()
                  ? 'linear-gradient(135deg, #92400E, #D97706)'
                  : '#F3D8E8',
                color: canNext() ? '#fff' : T.muted,
                border: 'none', borderRadius: 12, padding: '14px',
                cursor: canNext() ? 'pointer' : 'default',
                fontSize: 15, fontWeight: 800,
                boxShadow: canNext() ? '0 4px 16px rgba(217,119,6,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>
                {isFree ? '✨ 無料で診断する' : '🔒 診断する（¥1,980）'}
              </button>
            )}
          </div>

          {isFree && step === STEPS.length - 1 && (
            <p style={{ color: T.muted, fontSize: 11, textAlign: 'center', marginTop: 14 }}>
              🎁 初回1回無料 · 次回から¥1,980（買い切り）
            </p>
          )}
        </div>

        {/* 安心感バッジ */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
          {['🔒 個人情報不要', '⚡ 即時生成', '💬 AI辛口分析'].map(b => (
            <span key={b} style={{ color: T.muted, fontSize: 12 }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── 結果画面 ─────────────── */
function ResultScreen({ loading, report, copied, onCopy, onUpgrade, onReset }) {
  if (loading) return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #FDF2F8, #FFF7ED)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>💕</div>
        <div style={{ color: T.rose, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>分析中...</div>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
          あなたのスペックを婚活市場で<br />リサーチしています
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: T.roseSoft, animation: `bounce${i} 1.2s ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  const lines = report.split('\n');
  const cutAt  = lines.findIndex((l, i) => i > 8 && l.startsWith('## ') && !l.includes('スコア'));
  const preview = cutAt > 0 ? lines.slice(0, cutAt).join('\n') : report;
  const rest    = cutAt > 0 ? lines.slice(cutAt).join('\n') : '';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #FDF2F8, #FFF7ED)`, paddingBottom: 40 }}>
      {/* 結果ヘッダー */}
      <div style={{ background: 'linear-gradient(135deg, #831843, #BE185D)', padding: '28px 20px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💎</div>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>診断完了！</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>あなた専用の婚活戦略レポート</div>
      </div>

      <div style={{ maxWidth: 520, margin: '-20px auto 0', padding: '0 16px' }}>
        {/* レポート本体 */}
        <div style={{ background: T.bgCard, borderRadius: 20, padding: '28px 24px', boxShadow: T.shadowLg, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={onCopy} style={{ background: copied ? '#D1FAE5' : T.rosePale, color: copied ? T.green : T.rose, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {copied ? '✓ コピー済み' : '📋 コピー'}
            </button>
          </div>

          <ReportRenderer text={preview} />

          {rest && (
            <div style={{ position: 'relative', marginTop: 24 }}>
              <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.5 }}>
                <ReportRenderer text={rest.slice(0, 500)} />
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.95) 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: T.bgCard, border: `2px solid ${T.roseSoft}`, borderRadius: 16, padding: '24px 28px', textAlign: 'center', boxShadow: T.shadowLg, maxWidth: 280 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💍</div>
                  <div style={{ color: T.text, fontSize: 15, fontWeight: 800, marginBottom: 8 }}>続きを読む</div>
                  <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
                    ・狙うべき相手のスペック帯<br />
                    ・プロフィール文 改善サンプル<br />
                    ・あなた専用の攻略戦略3つ<br />
                    ・NG行動リスト
                  </div>
                  <button onClick={onUpgrade} style={{ background: 'linear-gradient(135deg, #BE185D, #DB2777)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 16px rgba(190,24,93,0.35)', width: '100%' }}>
                    ¥1,980 でフル診断を見る
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onReset} style={{ flex: 1, background: T.bgCard, border: `1.5px solid ${T.border}`, color: T.muted, borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            もう一度診断
          </button>
          {rest && (
            <button onClick={onUpgrade} style={{ flex: 2, background: 'linear-gradient(135deg, #BE185D, #DB2777)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 12px rgba(190,24,93,0.3)' }}>
              フル診断を見る →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── アップグレード画面 ─────────────── */
function Upgrade({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #FDF2F8, #FFF7ED)`, padding: '32px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* ヒーロー */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>💎</div>
          <h2 style={{ color: T.text, fontSize: 24, fontWeight: 800, margin: '0 0 10px' }}>
            フル診断レポートを受け取る
          </h2>
          <p style={{ color: T.muted, fontSize: 14, margin: 0, lineHeight: 1.8 }}>
            婚活市場でのリアルな立ち位置と<br />今日から動ける戦略をすべて開示
          </p>
        </div>

        {/* 含まれる内容 */}
        <div style={{ background: T.bgCard, borderRadius: 20, padding: '24px', marginBottom: 20, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.rose, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>フルレポートに含まれるもの</div>
          {[
            ['💎', '婚活市場価値スコア（100点満点）'],
            ['🎯', '狙うべき相手のリアルなスペック帯'],
            ['📱', '今すぐ使うべき婚活サービスTOP3'],
            ['✍️', 'プロフィール文の改善サンプル（すぐ使える）'],
            ['💡', 'あなた専用の攻略戦略3つ'],
            ['⚠️', 'やってはいけないNG行動リスト'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ color: T.text, fontSize: 14 }}>{text}</span>
              <span style={{ marginLeft: 'auto', color: T.green, fontSize: 16 }}>✓</span>
            </div>
          ))}
        </div>

        {/* 価格 */}
        <div style={{ background: 'linear-gradient(135deg, #831843, #BE185D)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', marginBottom: 20, boxShadow: '0 8px 32px rgba(190,24,93,0.35)' }}>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 }}>買い切り・一度の支払いで完結</div>
          <div style={{ color: '#fff', fontSize: 48, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
            ¥1,980
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8 }}>
            税込 · 返金不可（情報提供サービスのため）
          </div>
          <a
            href="https://buy.stripe.com/REPLACE_WITH_STRIPE_LINK"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 20, background: '#FDE68A', color: '#92400E', textDecoration: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            今すぐ購入してレポートを見る →
          </a>
        </div>

        {/* 購買心理サポート */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['🔒 SSL暗号化決済', '⚡ 購入後即表示', '🎁 友人にシェアOK'].map(b => (
            <span key={b} style={{ color: T.muted, fontSize: 12, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px' }}>{b}</span>
          ))}
        </div>

        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13, width: '100%', textAlign: 'center' }}>
          ← 無料版に戻る
        </button>
      </div>
    </div>
  );
}

/* ─────────────── マークダウンレンダラー ─────────────── */
function ReportRenderer({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return (
          <h2 key={i} style={{ color: T.rose, fontSize: 16, fontWeight: 800, margin: '22px 0 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `2px solid ${T.rosePale}`, paddingBottom: 8 }}>
            {line.replace('## ', '')}
          </h2>
        );
        if (line.startsWith('### ')) return (
          <h3 key={i} style={{ color: T.gold, fontSize: 14, fontWeight: 700, margin: '14px 0 6px' }}>
            {line.replace('### ', '')}
          </h3>
        );
        if (line.startsWith('- ') || line.startsWith('・')) return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', color: '#4B3D5A', fontSize: 13, lineHeight: 1.7 }}>
            <span style={{ color: T.roseSoft, flexShrink: 0 }}>♦</span>
            <span>{line.replace(/^[-・]\s*/, '')}</span>
          </div>
        );
        if (line.match(/^\d+\./)) return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0 4px 4px', color: T.text, fontSize: 13, lineHeight: 1.7, borderLeft: `3px solid ${T.rosePale}`, paddingLeft: 12, marginBottom: 6 }}>
            {line}
          </div>
        );
        if (line.includes('★')) return (
          <div key={i} style={{ background: T.rosePale, borderRadius: 8, padding: '8px 12px', color: T.rose, fontSize: 14, fontWeight: 700, margin: '6px 0' }}>
            {line}
          </div>
        );
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        return <div key={i} style={{ color: '#4B3D5A', fontSize: 14, lineHeight: 1.8, margin: '2px 0' }}>{line}</div>;
      })}
    </div>
  );
}
