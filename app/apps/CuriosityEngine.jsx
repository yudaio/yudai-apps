'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function CuriosityEngine() {
  const [product, setProduct] = useState('')
  const [interests, setInterests] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `Amazon商品「${product}」を起点に、${interests ? `ユーザーの興味(${interests})と絡めながら` : ''}知的好奇心を刺激する意外なつながりを発見してください。\n\nJSONのみ返答:\n{"connections":[{"title":"つながり30字","domain":"分野","insight":"面白い考察150字","depth":"浅/中/深"}],"connections"は5つ,"rabbit_hole":"最も深掘りすべきトピック50字"}` }])
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ connections: [{ title: '発見', domain: '知識', insight: text, depth: '中' }], rabbit_hole: '' }) }
    setLoading(false)
  }

  const depthColor = { '浅': '#42a5f5', '中': '#ab47bc', '深': '#ef5350' }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Label>Amazon商品名</Label>
        <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="例：コーヒーミル、テレスコープ、囲碁セット" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>あなたの興味・専門（任意）</Label>
        <Input value={interests} onChange={e => setInterests(e.target.value)} placeholder="例：歴史、数学、哲学、ビジネス" />
      </div>
      <Btn onClick={run} disabled={loading || !product.trim()}>
        {loading ? '知的つながりを探索中...' : '🔭 好奇心を刺激する'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          {result.connections?.map((c, i) => (
            <Card key={i} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 10, color: depthColor[c.depth] || '#7c6af7', marginRight: 8, border: `1px solid ${depthColor[c.depth] || '#7c6af7'}`, borderRadius: 10, padding: '1px 6px' }}>{c.depth}度</span>
                  <span style={{ fontSize: 10, color: colors.muted }}>{c.domain}</span>
                </div>
                <span style={{ fontSize: 14, color: colors.muted }}>{expanded === i ? '▲' : '▼'}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{c.title}</div>
              {expanded === i && <p style={{ fontSize: 13, lineHeight: 1.8, margin: '10px 0 0', color: '#ccc' }}>{c.insight}</p>}
            </Card>
          ))}
          {result.rabbit_hole && (
            <Card style={{ marginTop: 4, borderColor: '#7c6af7', background: '#0d0a1f' }}>
              <div style={{ fontSize: 11, color: '#7c6af7', letterSpacing: 2, marginBottom: 6 }}>🐇 RABBIT HOLE</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.rabbit_hole}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
