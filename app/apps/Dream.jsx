'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Dream() {
  const { user, supabase } = useAuth() || {}
  const [dream, setDream] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [imgUrl, setImgUrl] = useState('')

  const run = async () => {
    setLoading(true); setResult(null); setImgUrl('')
    const text = await callAI([{ role: 'user', content: `夢の断片:\n${dream}\n\n詩的に記録。JSONのみ:\n{"title":"夢のタイトル20字","prose":"映像詩200字(断片を詩的散文に)","emotion":"感情考察100字","symbol":"夢に現れた象徴の意味50字","imagePrompt":"English image generation prompt for this dream scene"}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r)
      if (r.imagePrompt) {
        setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(r.imagePrompt + ', dreamlike, surreal, cinematic')}?width=600&height=400&nologo=true`)
      }
      saveHistory(user, supabase, 'dream', dream, r)
    } catch { setResult({ title: '名もなき夢', prose: text, emotion: '', symbol: '', imagePrompt: '' }) }
    setLoading(false)
  }

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>夢の断片を自由に</Label>
        <Input value={dream} onChange={e => setDream(e.target.value)} placeholder="空を飛んでいた。でも羽がなくて、なぜか海の中にいて、知らない人が手を振っていた..." multiline rows={5} />
      </div>
      <Btn onClick={run} disabled={loading || !dream} style={{ marginTop: 16 }} color="#1a237e">
        {loading ? '記録中...' : '🌙 夢を映像化する'}
      </Btn>
      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {result.title && <h2 style={{ fontSize: 24, textAlign: 'center', color: '#90caf9' }}>🌙 {result.title}</h2>}
          {imgUrl && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <img src={imgUrl} alt={result.title} style={{ width: '100%', display: 'block', borderRadius: 12 }} onError={() => setImgUrl('')} />
            </Card>
          )}
          {result.prose && (
            <Card style={{ background: '#0a0a1a', borderColor: '#1a237e' }}>
              <Label>映像詩</Label>
              <p style={{ lineHeight: 2, color: '#b0bec5', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{result.prose}</p>
            </Card>
          )}
          {[['💭 感情考察', result.emotion], ['🔮 象徴の意味', result.symbol]].filter(([,v]) => v).map(([t, v]) => (
            <Card key={t}>
              <Label>{t}</Label>
              <p style={{ lineHeight: 1.8, color: colors.text }}>{v}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
