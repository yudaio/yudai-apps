'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function RedFlag() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const EXAMPLES = ['格安スマホケース', 'ノーブランドのUSBハブ', '激安サプリメント', '中古家電', 'AliExpress商品']

  const run = async (q = query) => {
    if (!q.trim()) return
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `Amazon「${q}」の危険な商品・詐欺的商品の見分け方を教えてください。\n\nJSONのみ返答:\n{"danger_score":0〜100,"red_flags":["危険サイン5つ"],"safe_signs":["安全なサイン3つ"],"checklist":["購入前チェック項目4つ"],"verdict":"一言警告または推奨20字"}` }])
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ danger_score: 50, red_flags: [], safe_signs: [], checklist: [], verdict: text.slice(0, 50) }) }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Label>カテゴリ / 商品名</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {EXAMPLES.map((e, i) => (
            <button key={i} onClick={() => { setQuery(e); run(e) }}
              style={{ fontSize: 12, background: '#1a0a0a', border: '1px solid #5a1a1a', color: '#f44336', padding: '4px 10px', cursor: 'pointer', borderRadius: 20 }}>{e}</button>
          ))}
        </div>
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="例：格安ワイヤレスイヤホン" />
      </div>
      <Btn onClick={() => run()} disabled={loading || !query.trim()} color="#b71c1c">
        {loading ? '分析中...' : '🚩 危険サインを検出'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: result.danger_score >= 60 ? '#f44336' : '#ff9800' }}>{result.danger_score}<span style={{ fontSize: 24 }}>%</span></div>
            <div style={{ fontSize: 14, color: '#f44336' }}>危険度スコア</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>「{result.verdict}」</div>
          </div>
          <Card style={{ marginBottom: 12, borderColor: '#5a1a1a', background: '#0f0808' }}>
            <Label>🚩 危険サイン</Label>
            {result.red_flags?.map((f, i) => <div key={i} style={{ fontSize: 13, color: '#f44336', marginBottom: 4 }}>✗ {f}</div>)}
          </Card>
          <Card style={{ marginBottom: 12, borderColor: '#1a3a1a', background: '#080f08' }}>
            <Label>✅ 安全なサイン</Label>
            {result.safe_signs?.map((s, i) => <div key={i} style={{ fontSize: 13, color: '#4caf50', marginBottom: 4 }}>✓ {s}</div>)}
          </Card>
          <Card>
            <Label>購入前チェックリスト</Label>
            {result.checklist?.map((c, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>☐ {c}</div>)}
          </Card>
        </div>
      )}
    </div>
  )
}
