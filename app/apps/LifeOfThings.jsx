'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function LifeOfThings() {
  const [product, setProduct] = useState('')
  const [owner, setOwner] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI('life', { product, owner })
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ chapters: [{ title: '物語', content: text }], epitaph: '', bond_score: 70 }) }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Label>商品名</Label>
        <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="例：革製の財布、母から贈られた傘" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>所有者のイメージ（任意）</Label>
        <Input value={owner} onChange={e => setOwner(e.target.value)} placeholder="例：28歳の会社員、東京在住" />
      </div>
      <Btn onClick={run} disabled={loading || !product.trim()}>
        {loading ? '物語を刻んでいます...' : '📖 一生の物語を生成'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 20 }}>
            {result.chapters?.map((ch, i) => (
              <div key={i} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid #333' }}>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4, letterSpacing: 1 }}>CHAPTER {i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{ch.title}</div>
                <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: '#ccc' }}>{ch.content}</p>
              </div>
            ))}
          </div>
          {result.epitaph && (
            <Card style={{ textAlign: 'center', borderColor: '#555', background: '#0d0d0d' }}>
              <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8, letterSpacing: 2 }}>EPITAPH</div>
              <p style={{ fontSize: 16, fontStyle: 'italic', margin: '0 0 12px' }}>「{result.epitaph}」</p>
              <div style={{ fontSize: 12, color: colors.muted }}>絆スコア {result.bond_score}/100</div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
