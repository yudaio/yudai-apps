'use client';
import { useState, useEffect } from 'react';

const C = { bg:"#07091A", card:"#0C0F22", border:"#182040", text:"#C5D0F0", muted:"#4A5880", accent:"#10B981", danger:"#EF4444" };

const FREE_LIMIT = 3;
const STORAGE_KEY = 'biz_usage';

const DOC_TYPES = [
  { id:'email',    icon:'📧', label:'ビジネスメール',  desc:'社外・社内向け丁寧な文面' },
  { id:'minutes',  icon:'📋', label:'議事録',          desc:'会議内容を簡潔にまとめる' },
  { id:'proposal', icon:'📊', label:'企画提案書',      desc:'説得力ある提案の骨格' },
  { id:'report',   icon:'📝', label:'業務報告書',      desc:'成果・課題を整理して報告' },
  { id:'apology',  icon:'🙏', label:'お詫びメール',    desc:'丁寧かつ誠実な謝罪文' },
  { id:'thanks',   icon:'💌', label:'お礼状',          desc:'感謝の気持ちを格調高く' },
  { id:'contract', icon:'📜', label:'業務委託メール',  desc:'依頼・契約の確認連絡' },
  { id:'inquiry',  icon:'🔍', label:'問い合わせ文',    desc:'取引先への問い合わせ' },
];

const PROMPTS = {
  email:    (f) => `以下の条件でプロフェッショナルなビジネスメールを書いてください。\n宛先: ${f.to}\n件名: ${f.subject}\n内容: ${f.content}\n口調: ${f.tone}`,
  minutes:  (f) => `以下の会議情報をもとに議事録を作成してください。\n会議名: ${f.to}\n参加者: ${f.subject}\n議題・内容: ${f.content}`,
  proposal: (f) => `以下の情報をもとに企画提案書の本文を作成してください。\n企画名: ${f.to}\n対象: ${f.subject}\n内容・目的: ${f.content}`,
  report:   (f) => `以下の情報をもとに業務報告書を作成してください。\n報告者: ${f.to}\n報告期間: ${f.subject}\n内容: ${f.content}`,
  apology:  (f) => `以下の状況に対する丁寧なお詫びメールを書いてください。\n宛先: ${f.to}\n件名: ${f.subject}\n経緯・状況: ${f.content}`,
  thanks:   (f) => `以下の状況に対するお礼状を書いてください。\n宛先: ${f.to}\n感謝の理由: ${f.content}\n口調: ${f.tone}`,
  contract: (f) => `以下の条件で業務委託に関するメールを書いてください。\n宛先: ${f.to}\n件名: ${f.subject}\n業務内容: ${f.content}`,
  inquiry:  (f) => `以下の内容で問い合わせメールを書いてください。\n宛先: ${f.to}\n件名: ${f.subject}\n問い合わせ内容: ${f.content}`,
};

const FIELD_LABELS = {
  email:    { to:'宛先（例：〇〇株式会社 山田様）', subject:'件名', content:'メールの内容・要点', tone:'口調（丁寧/フレンドリー/格式高い）' },
  minutes:  { to:'会議名', subject:'参加者', content:'議題・決定事項・アクションアイテム', tone:null },
  proposal: { to:'企画名', subject:'対象・ターゲット', content:'企画の概要・目的・期待効果', tone:null },
  report:   { to:'報告者名', subject:'報告期間（例：2026年5月）', content:'実績・課題・次のアクション', tone:null },
  apology:  { to:'宛先', subject:'件名（何についてのお詫びか）', content:'トラブルの経緯と状況', tone:'口調（誠実/深刻/軽め）' },
  thanks:   { to:'宛先（例：〇〇部長）', subject:null, content:'感謝の理由・具体的な出来事', tone:'口調（丁寧/格調高い）' },
  contract: { to:'宛先', subject:'件名', content:'業務内容・条件・依頼事項', tone:null },
  inquiry:  { to:'宛先', subject:'件名', content:'問い合わせの詳細', tone:null },
};

function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, month: new Date().getMonth() };
    return JSON.parse(raw);
  } catch { return { count: 0, month: new Date().getMonth() }; }
}

function saveUsage(usage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export default function Biz() {
  const [step, setStep] = useState('select'); // select | form | result | upgrade
  const [docType, setDocType] = useState(null);
  const [fields, setFields] = useState({ to: '', subject: '', content: '', tone: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ count: 0, month: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const u = getUsage();
    const currentMonth = new Date().getMonth();
    if (u.month !== currentMonth) {
      const reset = { count: 0, month: currentMonth };
      saveUsage(reset);
      setUsage(reset);
    } else {
      setUsage(u);
    }
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - usage.count);
  const isLimited = usage.count >= FREE_LIMIT;

  function selectDoc(d) {
    setDocType(d);
    setFields({ to: '', subject: '', content: '', tone: '' });
    setResult('');
    setStep('form');
  }

  async function generate() {
    if (isLimited) { setStep('upgrade'); return; }
    if (!fields.content.trim()) return;
    setLoading(true);
    const prompt = PROMPTS[docType.id](fields);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'あなたはプロの日本語ビジネス文書ライターです。丁寧で格調のある文章を書いてください。余計な説明は不要で、文書本文のみ出力してください。',
          user: prompt,
          max: 1000,
        }),
      });
      const { text } = await r.json();
      setResult(text);
      const newUsage = { count: usage.count + 1, month: usage.month };
      saveUsage(newUsage);
      setUsage(newUsage);
      setStep('result');
    } catch {
      setResult('エラーが発生しました。もう一度お試しください。');
      setStep('result');
    }
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const labels = docType ? FIELD_LABELS[docType.id] : {};

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
        <h1 style={{ color: C.text, fontSize: 22, margin: '0 0 6px', fontWeight: 700 }}>AI ビジネス文書メーカー</h1>
        <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
          プロ品質の文書を10秒で生成 · 今月あと
          <span style={{ color: isLimited ? C.danger : C.accent, fontWeight: 700 }}> {remaining}回 </span>
          無料
        </p>
      </div>

      {/* Upgrade banner */}
      {isLimited && step !== 'upgrade' && (
        <div style={{ background: '#1a0a0a', border: `1px solid ${C.danger}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#FCA5A5', fontSize: 13 }}>今月の無料枠（3回）を使い切りました</span>
          <button onClick={() => setStep('upgrade')} style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
            プランを見る
          </button>
        </div>
      )}

      {/* STEP: Select */}
      {step === 'select' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {DOC_TYPES.map(d => (
            <button key={d.id} onClick={() => selectDoc(d)} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + '66'; e.currentTarget.style.background = '#0E1228'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{d.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* STEP: Form */}
      {step === 'form' && docType && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>{docType.icon}</span>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{docType.label}</div>
              <div style={{ color: C.muted, fontSize: 11 }}>{docType.desc}</div>
            </div>
          </div>

          {[
            { key: 'to', label: labels.to },
            { key: 'subject', label: labels.subject },
            { key: 'content', label: labels.content, multi: true },
            { key: 'tone', label: labels.tone },
          ].filter(f => f.label).map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>{f.label}</label>
              {f.multi ? (
                <textarea
                  value={fields[f.key]}
                  onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                  rows={4}
                  placeholder="詳しく書くほど精度が上がります"
                  style={{ width: '100%', background: '#07091A', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                />
              ) : (
                <input
                  value={fields[f.key]}
                  onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', background: '#07091A', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setStep('select')} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 14 }}>
              戻る
            </button>
            <button onClick={generate} disabled={loading || !fields.content.trim()} style={{
              flex: 2, background: isLimited ? C.danger : C.accent, color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              opacity: loading || !fields.content.trim() ? 0.6 : 1,
            }}>
              {loading ? '生成中...' : isLimited ? 'プランを確認する' : '✨ 文書を生成する'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Result */}
      {step === 'result' && (
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.accent}33`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>✅ 生成完了</span>
              <button onClick={copy} style={{ background: copied ? '#065F46' : '#1a2a1a', color: copied ? '#6EE7B7' : C.accent, border: `1px solid ${C.accent}44`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {copied ? 'コピー済み ✓' : 'コピー'}
              </button>
            </div>
            <div style={{ color: C.text, fontSize: 14, lineHeight: 1.9, whiteSpace: 'pre-wrap', background: '#07091A', borderRadius: 8, padding: '16px' }}>
              {result}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('form'); setResult(''); }} style={{ flex: 1, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 13 }}>
              もう一度作る
            </button>
            <button onClick={() => setStep('select')} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '12px', cursor: 'pointer', fontSize: 13 }}>
              別の文書を作る
            </button>
          </div>

          {remaining <= 1 && (
            <div style={{ marginTop: 16, background: '#0D1F15', border: `1px solid ${C.accent}44`, borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                今月あと <span style={{ color: C.accent }}>{remaining}回</span> 無料で使えます
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>
                無制限プランで毎日使い放題 · ¥980/月（税込）
              </div>
              <button onClick={() => setStep('upgrade')} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                プランを見る →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP: Upgrade */}
      {step === 'upgrade' && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <h2 style={{ color: C.text, fontSize: 20, margin: '0 0 8px', fontWeight: 700 }}>無制限プランにアップグレード</h2>
          <p style={{ color: C.muted, fontSize: 13, margin: '0 0 24px', lineHeight: 1.7 }}>
            毎日何度でも使い放題。<br />
            ビジネスメール・議事録・提案書を瞬時に作成。
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✅ 月間無制限利用', '✅ 全8種類の文書', '✅ 優先サポート', '✅ 新機能を先行利用'].map(f => (
              <span key={f} style={{ color: C.text, fontSize: 12, background: '#0D1F15', border: `1px solid ${C.accent}33`, borderRadius: 20, padding: '6px 14px' }}>{f}</span>
            ))}
          </div>

          <div style={{ background: '#07091A', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>月額プラン</div>
            <div style={{ color: C.text, fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
              ¥980<span style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}>/月</span>
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>いつでもキャンセル可能</div>
          </div>

          <a
            href="https://buy.stripe.com/REPLACE_WITH_YOUR_STRIPE_LINK"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', background: C.accent, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, marginBottom: 12 }}
          >
            今すぐ始める → ¥980/月
          </a>

          <button onClick={() => setStep('select')} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: '8px' }}>
            無料プランに戻る（月3回まで）
          </button>
        </div>
      )}
    </div>
  );
}
