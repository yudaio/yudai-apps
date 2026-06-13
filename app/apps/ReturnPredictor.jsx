'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function ReturnPredictor() {
  const [form, setForm] = useState({ product: '', price: '', reviews: '', reason: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `Amazon購入の返品リスクを予測してください。\n商品: ${form.product}\n価格: ${form.price}円\nレビュー概要: ${form.reviews}\n購入理由: ${form.reason}\n\nJSONのみ返答:\n{"return_risk":0〜100,"risk_level":"低/中/高","factors":["リスク要因3つ"],"advice":"購入アドバイス150字","verdict":"一言判定20字"}` }])
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ return_risk: 50, risk_level: '中', factors: [], advice: text, verdict: '要検討' }) }
    setLoading(false)
  }

  const riskColor = { '低': '#4caf50', '中': '#ff9800', '高': '#f44336' }

  return (
    <div>
      {[['product', '商品名', '例：Anker充電器 65W'], ['price', '価格（円）', '例：3980'], ['reviews', 'レビューの印象', '例：★4.2、サイズが思ったより小さいという声あり'], ['reason', '購入を考えている理由', '例：テレワーク用に持ち運びしたい']].map(([k, label, ph]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <Label>{label}</Label>
          <Input value={form[k]} onChange={set(k)} placeholder={ph} multiline={k === 'reason'} rows={2} />
        </div>
      ))}
      <Btn onClick={run} disabled={loading || !form.product.trim()}>
        {loading ? '予測中...' : '🔮 返品リスク予測'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: riskColor[result.risk_level] || '#ff9800' }}>{result.return_risk}<span style={{ fontSize: 24 }}>%</span></div>
            <div style={{ fontSize: 14, color: riskColor[result.risk_level] || '#ff9800', fontWeight: 700 }}>返品リスク {result.risk_level}</div>
            <div style={{ fontSize: 18, color: colors.text, marginTop: 8, fontWeight: 700 }}>「{result.verdict}」</div>
          </div>
          <Card style={{ marginBottom: 12 }}>
            <Label>リスク要因</Label>
            {result.factors?.map((f, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>⚠ {f}</div>)}
          </Card>
          <Card style={{ borderColor: '#7c6af7' }}>
            <Label>購入アドバイス</Label>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.advice}</p>
          </Card>
        </div>
      )}
    </div>
  )
}
