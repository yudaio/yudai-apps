'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function AutoAnswer() {
  const [product, setProduct] = useState('')
  const [question, setQuestion] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const QUICK = ['この商品は日本製ですか？', '保証はありますか？', 'サイズ交換できますか？', '子供でも使えますか？', '返品可能ですか？']

  const run = async (q = question) => {
    if (!product.trim() || !q.trim()) return
    setLoading(true)
    const text = await callAI([{ role: 'user', content: `Amazon商品「${product}」に対するQ&A回答を生成してください。\n\n質問: ${q}\n\n以下のJSONのみ返答:\n{"answer":"丁寧な回答200字","confidence":0〜100,"tags":["関連タグ2〜3個"]}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResults(prev => [{ q, ...r }, ...prev].slice(0, 5))
    } catch { setResults(prev => [{ q, answer: text, confidence: 50, tags: [] }, ...prev].slice(0, 5)) }
    setLoading(false)
  }

  const confColor = (c) => c >= 80 ? '#4caf50' : c >= 50 ? '#ff9800' : '#f44336'

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Label>商品名 / カテゴリ</Label>
        <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="例：防水ワイヤレスイヤホン" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>よくある質問（クイック選択）</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => { setQuestion(q); run(q) }}
              style={{ fontSize: 12, background: '#1a1a1a', border: '1px solid #333', color: '#aaa', padding: '4px 10px', cursor: 'pointer', borderRadius: 20 }}>{q}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>カスタム質問</Label>
        <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="独自の質問を入力..." />
      </div>
      <Btn onClick={() => run()} disabled={loading || !product.trim() || !question.trim()}>
        {loading ? '生成中...' : '💬 回答生成'}
      </Btn>

      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {results.map((r, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Q: {r.q}</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }}>{r.answer}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {r.tags?.map((t, j) => (
                    <span key={j} style={{ fontSize: 11, background: '#222', border: '1px solid #333', borderRadius: 20, padding: '2px 8px' }}>{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: confColor(r.confidence), fontFamily: 'monospace' }}>信頼度 {r.confidence}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
