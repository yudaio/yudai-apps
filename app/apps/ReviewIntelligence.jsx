'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'

export default function ReviewIntelligence() {
  const [asin, setAsin] = useState('')
  const [reviews, setReviews] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!reviews.trim()) return
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `以下のAmazonレビューを分析してください。ASIN: ${asin || '不明'}\n\nレビュー:\n${reviews}\n\n以下のJSONのみ返答（他テキスト不要）:\n{"sentiment_score":0〜100の数値,"positive":["ポジティブ要点を3つ"],"negative":["ネガティブ要点を3つ"],"keywords":["頻出キーワード5つ"],"summary":"総評150字","recommendation":"改善提案100字"}` }])
    try { setResult(JSON.parse(text.replace(/```json|```/g, '').trim())) }
    catch { setResult({ summary: text, sentiment_score: 50, positive: [], negative: [], keywords: [], recommendation: '' }) }
    setLoading(false)
  }

  const scoreColor = (s) => s >= 70 ? '#4caf50' : s >= 40 ? '#ff9800' : '#f44336'

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Label>ASIN（任意）</Label>
        <Input value={asin} onChange={e => setAsin(e.target.value)} placeholder="B08N5WRWNW" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>レビューテキスト（複数貼り付け可）</Label>
        <Input value={reviews} onChange={e => setReviews(e.target.value)} placeholder="Amazonからコピーしたレビューを貼り付けてください..." multiline rows={6} />
      </div>
      <Btn onClick={run} disabled={loading || !reviews.trim()}>
        {loading ? '分析中...' : '🔍 レビュー分析'}
      </Btn>

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor(result.sentiment_score) }}>
              {result.sentiment_score}
            </div>
            <div>
              <div style={{ fontSize: 12, color: colors.muted }}>感情スコア</div>
              <div style={{ width: 120, height: 6, background: '#222', borderRadius: 3, marginTop: 4 }}>
                <div style={{ width: `${result.sentiment_score}%`, height: '100%', background: scoreColor(result.sentiment_score), borderRadius: 3 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Card>
              <div style={{ fontSize: 11, color: '#4caf50', letterSpacing: 2, marginBottom: 8 }}>POSITIVE</div>
              {result.positive?.map((p, i) => <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>✓ {p}</div>)}
            </Card>
            <Card>
              <div style={{ fontSize: 11, color: '#f44336', letterSpacing: 2, marginBottom: 8 }}>NEGATIVE</div>
              {result.negative?.map((n, i) => <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>✗ {n}</div>)}
            </Card>
          </div>

          {result.keywords?.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 2, marginBottom: 8 }}>KEYWORDS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.keywords.map((k, i) => (
                  <span key={i} style={{ background: '#222', border: '1px solid #333', borderRadius: 20, padding: '3px 12px', fontSize: 12 }}>{k}</span>
                ))}
              </div>
            </Card>
          )}

          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 2, marginBottom: 8 }}>SUMMARY</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
          </Card>

          {result.recommendation && (
            <Card style={{ borderColor: '#7c6af7' }}>
              <div style={{ fontSize: 11, color: '#7c6af7', letterSpacing: 2, marginBottom: 8 }}>RECOMMENDATION</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.recommendation}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
