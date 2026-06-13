'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function TravelNarrator() {
  const [product, setProduct] = useState('')
  const [destination, setDestination] = useState('')
  const [style, setStyle] = useState('文学的')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const STYLES = ['文学的', 'ユーモア', '詩的', 'ドキュメンタリー', 'SNS映え']

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `Amazon商品「${product}」を持って「${destination}」へ旅行するシナリオを${style}なスタイルで物語化してください。\n\nJSONのみ返答:\n{"title":"物語タイトル30字","narrative":"旅の物語300字","highlight":"この商品が旅を変えた瞬間100字","hashtags":["SNS用ハッシュタグ5つ"]}` }])
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ title: '旅の物語', narrative: text, highlight: '', hashtags: [] }) }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Label>Amazon商品名</Label>
        <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="例：軽量トレッキングポール" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <Label>旅先</Label>
        <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="例：屋久島、バリ島、パリ" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>文体スタイル</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)} style={{ fontSize: 12, background: style === s ? '#7c6af7' : '#1a1a1a', border: `1px solid ${style === s ? '#7c6af7' : '#333'}`, color: style === s ? '#fff' : '#aaa', padding: '4px 12px', cursor: 'pointer', borderRadius: 20 }}>{s}</button>
          ))}
        </div>
      </div>
      <Btn onClick={run} disabled={loading || !product.trim() || !destination.trim()}>
        {loading ? '物語を紡いでいます...' : '✈️ 旅の物語を生成'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>「{result.title}」</h2>
          <Card style={{ marginBottom: 12, background: '#0d0d1a', borderColor: '#2a2a4a' }}>
            <p style={{ fontSize: 14, lineHeight: 1.9, margin: 0, fontStyle: 'italic' }}>{result.narrative}</p>
          </Card>
          {result.highlight && (
            <Card style={{ marginBottom: 12, borderColor: '#7c6af7' }}>
              <Label>✨ ハイライトシーン</Label>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.highlight}</p>
            </Card>
          )}
          {result.hashtags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {result.hashtags.map((h, i) => (
                <span key={i} style={{ fontSize: 12, color: '#42a5f5' }}>{h.startsWith('#') ? h : `#${h}`}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
