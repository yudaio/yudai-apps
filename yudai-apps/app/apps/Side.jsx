'use client';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg: "#07091A", card: "#0C0F22", border: "#182040",
  text: "#C5D0F0", muted: "#4A5880", accent: "#F59E0B",
  green: "#10B981", danger: "#EF4444",
};

const FREE_KEY = 'side_usage';
const FREE_LIMIT = 1; // 1回無料、2回目から有料

// ---- 入力フォームの定義 ----
const STEPS = [
  {
    id: 'job',
    title: '今の仕事・スキル',
    subtitle: 'あなたのバックグラウンドを教えてください',
    fields: [
      { key: 'job',    label: '職種・業種',             placeholder: '例：営業職・IT企業勤務、看護師、エンジニアなど', multi: false },
      { key: 'skills', label: '得意なこと・スキル・資格', placeholder: '例：Excel、Photoshop、英語、文章を書くのが得意、簿記2級など', multi: true },
      { key: 'sns',    label: 'SNS・PC経験（任意）',    placeholder: '例：Instagramを日常的に使う、プログラミング経験あり、YouTubeを見るだけなど', multi: false },
    ],
  },
  {
    id: 'condition',
    title: '条件・目標',
    subtitle: 'リアルな条件を入力するほど精度が上がります',
    fields: [
      { key: 'time',   label: '副業に使える時間',  placeholder: '例：平日夜2時間＋休日4時間、週末のみ6時間など', multi: false },
      { key: 'goal',   label: '月収目標',          placeholder: '例：まず月3万円、半年で月10万円など', multi: false },
      { key: 'ngList', label: '避けたいこと（任意）', placeholder: '例：顔出し不要、在庫を持ちたくない、人と話すのが苦手など', multi: false },
    ],
  },
];

function getUsage() {
  try {
    const raw = localStorage.getItem(FREE_KEY);
    if (!raw) return { count: 0 };
    return JSON.parse(raw);
  } catch { return { count: 0 }; }
}
function bumpUsage() {
  const u = getUsage();
  localStorage.setItem(FREE_KEY, JSON.stringify({ count: u.count + 1 }));
}

// プレビュー用：最初のセクションだけ表示してあとは隠す
function splitPreview(text) {
  const lines = text.split('\n');
  const cutIdx = Math.min(lines.findIndex((l, i) => i > 5 && l.startsWith('##')), 18);
  if (cutIdx <= 0) return { preview: text, rest: '' };
  return {
    preview: lines.slice(0, cutIdx).join('\n'),
    rest: lines.slice(cutIdx).join('\n'),
  };
}

export default function Side() {
  const [step, setStep]     = useState(0);         // 0,1 = フォーム, 2 = 生成中/結果, 3 = アップグレード
  const [fields, setFields] = useState({ job:'', skills:'', sns:'', time:'', goal:'', ngList:'' });
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage]   = useState({ count: 0 });
  const [copied, setCopied] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => { setUsage(getUsage()); }, []);

  const isPaid = usage.count < FREE_LIMIT;
  const currentStepDef = STEPS[step];

  function setField(key, val) {
    setFields(p => ({ ...p, [key]: val }));
  }

  function canNext() {
    const required = STEPS[step].fields.filter(f => !f.key.includes('sns') && !f.key.includes('ngList'));
    return required.every(f => fields[f.key].trim().length > 2);
  }

  async function generate() {
    if (usage.count >= FREE_LIMIT) { setStep(3); return; }
    setStep(2);
    setLoading(true);
    setReport('');

    const prompt = `
あなたは副業・キャリア戦略の専門コンサルタントです。
以下のプロフィールに基づき、その人専用の「副業収益化ロードマップ」を作成してください。

【プロフィール】
職種・業種：${fields.job}
スキル・得意：${fields.skills}
SNS・PCスキル：${fields.sns || '特になし'}
使える時間：${fields.time}
月収目標：${fields.goal}
避けたいこと：${fields.ngList || '特になし'}

【出力フォーマット（必ず守ること）】
## 診断サマリー
あなたのスペック分析を3〜4文で。強みと市場価値を具体的に。

## あなたに最適な副業TOP3

### 1位：[副業名]
**なぜこの人に向いているか**（スキルとの紐付けを明確に）
**想定収入**：最初の3ヶ月 / 6ヶ月後 / 1年後
**具体的な始め方**：最初の3アクション（番号付きリスト）
**主な収益プラットフォーム**

### 2位：[副業名]
（同上）

### 3位：[副業名]
（同上）

## 最初の1週間でやること
番号付きリストで7つ。今日・明日・今週でできる具体的行動のみ。

## やってはいけない落とし穴
このプロフィールの人が陥りやすい失敗3つ。

## ${fields.goal}達成のリアルなタイムライン
月ごとのマイルストーンを箇条書きで。
`.trim();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'あなたは副業・フリーランス戦略の専門コンサルタントです。具体的・実践的なアドバイスを提供してください。曖昧な表現は避け、固有名詞・数字・具体的サービス名を必ず含めてください。',
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

  const { preview, rest } = report ? splitPreview(report) : { preview: '', rest: '' };
  const hasRest = rest.length > 0;

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '16px', fontFamily: 'system-ui,sans-serif' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>💰</div>
        <h1 style={{ color: C.text, fontSize: 22, margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          副業スキル診断
        </h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          あなたのスキル × 時間 × 目標から<br />
          <span style={{ color: C.accent, fontWeight: 700 }}>専用の収益化ロードマップ</span>を即時生成
        </p>
      </div>

      {/* STEP: フォーム (0, 1) */}
      {step <= 1 && (
        <div>
          {/* プログレスバー */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{
                flex: 1, height: 4, borderRadius: 4,
                background: i <= step ? C.accent : C.border,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '1px', marginBottom: 4 }}>
                STEP {step + 1} / {STEPS.length}
              </div>
              <div style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>{currentStepDef.title}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{currentStepDef.subtitle}</div>
            </div>

            {currentStepDef.fields.map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  {f.label}
                </label>
                {f.multi ? (
                  <textarea
                    value={fields[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6 }}
                  />
                ) : (
                  <input
                    value={fields[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(p => p - 1)} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 14 }}>
                  戻る
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(p => p + 1)} disabled={!canNext()} style={{ flex: 3, background: canNext() ? C.accent : C.border, color: canNext() ? '#000' : C.muted, border: 'none', borderRadius: 8, padding: '12px', cursor: canNext() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}>
                  次へ →
                </button>
              ) : (
                <button onClick={generate} disabled={!canNext()} style={{ flex: 3, background: canNext() ? C.accent : C.border, color: canNext() ? '#000' : C.muted, border: 'none', borderRadius: 8, padding: '12px', cursor: canNext() ? 'pointer' : 'default', fontSize: 15, fontWeight: 800, transition: 'all 0.2s' }}>
                  {isPaid ? '✨ 無料で診断する' : '🔒 診断する（¥2,480）'}
                </button>
              )}
            </div>

            {isPaid && (
              <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 12, margin: '12px 0 0' }}>
                初回1回無料 · 次回から¥2,480
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP: 生成中 / 結果 */}
      {step === 2 && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>⚙️</div>
              <div style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                あなた専用のロードマップを生成中...
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>スキルと目標を分析しています</div>
            </div>
          ) : (
            <div>
              {/* 結果ヘッダー */}
              <div style={{ background: `linear-gradient(135deg, #1a1200, #0C0F22)`, border: `1px solid ${C.accent}44`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>✅ 診断完了</div>
                  <div style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>あなた専用の収益化ロードマップ</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ background: copied ? '#065F46' : '#1a2a1a', color: copied ? '#6EE7B7' : C.accent, border: `1px solid ${C.accent}44`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {copied ? '✓ コピー済み' : 'コピー'}
                </button>
              </div>

              {/* レポート本文（プレビュー） */}
              <div ref={reportRef} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px', marginBottom: 16, position: 'relative' }}>
                <ReportRenderer text={preview} />

                {/* ぼかしで隠す（無料版） */}
                {hasRest && (
                  <div style={{ position: 'relative', marginTop: 16 }}>
                    <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.6 }}>
                      <ReportRenderer text={rest.slice(0, 600) + '...'} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, transparent, #0C0F22 40%)' }}>
                      <div style={{ background: C.card, border: `1px solid ${C.accent}66`, borderRadius: 12, padding: '20px 28px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                        <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                          続きを見る
                        </div>
                        <div style={{ color: C.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
                          副業TOP3の詳細・最初の1週間・<br />落とし穴・タイムライン
                        </div>
                        <button onClick={() => setStep(3)} style={{ background: C.accent, color: '#000', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                          ¥2,480 でフルレポートを見る
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep(0); setReport(''); }} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '11px', cursor: 'pointer', fontSize: 13 }}>
                  もう一度診断
                </button>
                {hasRest && (
                  <button onClick={() => setStep(3)} style={{ flex: 2, background: C.accent, color: '#000', border: 'none', borderRadius: 8, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                    フルレポートを見る →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP: アップグレード */}
      {step === 3 && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: C.text, fontSize: 22, margin: '0 0 10px', fontWeight: 800 }}>
            フルレポートを受け取る
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.8 }}>
            あなた専用の収益化戦略をすべて開示。<br />
            今日から動けるアクションプラン付き。
          </p>

          {/* 含まれる内容 */}
          <div style={{ background: C.bg, borderRadius: 10, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
            {[
              '📊 診断サマリー（スペック分析）',
              '🏆 あなたに最適な副業TOP3（詳細版）',
              '💡 各副業の始め方・収入目安・プラットフォーム',
              '📅 最初の1週間でやること（7アクション）',
              '⚠️ 陥りやすい失敗パターン3つ',
              '📈 月収目標達成のリアルなタイムライン',
            ].map(item => (
              <div key={item} style={{ color: C.text, fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>買い切り・一度の支払いで完結</div>
            <div style={{ color: C.text, fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>
              ¥2,480
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>税込・返金不可（情報提供サービスのため）</div>
          </div>

          <a
            href="https://buy.stripe.com/REPLACE_WITH_STRIPE_LINK"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', background: C.accent, color: '#000', textDecoration: 'none', borderRadius: 10, padding: '16px', fontSize: 16, fontWeight: 800, marginBottom: 14 }}
          >
            今すぐ購入して診断を見る →
          </a>

          <button onClick={() => setStep(report ? 2 : 0)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>
            ← 戻る
          </button>
        </div>
      )}
    </div>
  );
}

// マークダウン風レンダラー（簡易）
function ReportRenderer({ text }) {
  if (!text) return null;
  return (
    <div style={{ color: C.text, fontSize: 14, lineHeight: 1.9 }}>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return (
          <h2 key={i} style={{ color: C.accent, fontSize: 16, fontWeight: 800, margin: '20px 0 8px', borderBottom: `1px solid ${C.accent}33`, paddingBottom: 6 }}>
            {line.replace('## ', '')}
          </h2>
        );
        if (line.startsWith('### ')) return (
          <h3 key={i} style={{ color: C.green, fontSize: 14, fontWeight: 700, margin: '14px 0 6px' }}>
            {line.replace('### ', '')}
          </h3>
        );
        if (line.startsWith('**') && line.endsWith('**')) return (
          <div key={i} style={{ color: '#93C5FD', fontWeight: 700, margin: '6px 0 2px', fontSize: 13 }}>
            {line.replace(/\*\*/g, '')}
          </div>
        );
        if (line.match(/^\*\*(.+)\*\*(.+)/)) {
          return (
            <div key={i} style={{ margin: '3px 0' }}>
              <span style={{ color: '#93C5FD', fontWeight: 700 }}>{line.match(/^\*\*(.+?)\*\*/)?.[1]}</span>
              <span style={{ color: C.text }}>{line.replace(/^\*\*(.+?)\*\*/, '')}</span>
            </div>
          );
        }
        if (line.match(/^[\d]+\./)) return (
          <div key={i} style={{ padding: '3px 0 3px 16px', color: C.text, borderLeft: `2px solid ${C.accent}44`, marginLeft: 4, marginBottom: 4 }}>
            {line}
          </div>
        );
        if (line.startsWith('- ') || line.startsWith('・')) return (
          <div key={i} style={{ padding: '2px 0 2px 12px', color: C.muted, fontSize: 13 }}>
            {line}
          </div>
        );
        if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
        return <div key={i} style={{ margin: '2px 0' }}>{line}</div>;
      })}
    </div>
  );
}
