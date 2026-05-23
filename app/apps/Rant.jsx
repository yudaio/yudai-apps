'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Rant() {
  const { user, supabase } = useAuth() || {}
  const [theme, setTheme] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `テーマ: ${theme}\n\nこの社会問題・理不尽を3視点で解剖。JSONのみ:\n{"philosophical":"哲学的視点150字","data":"データ的視点150字","human":"人間的視点150字","question":"読者への哲学的問いかけ50字","headline":"見出し30字"}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r); saveHistory(user, supabase, 'rant', theme, r)
    } catch { setResult({ philosophical: text, data: '', human: '', question: '', headline: '' }) }
    setLoading(false)
  }

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>理不尽なテーマ・怒り・社会問題</Label>
        <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="例：なぜ残業を美徳とする文化がなくならないのか" multiline rows={3} />
      </div>
      <Btn onClick={run} disabled={loading || !theme} style={{ marginTop: 16 }} color="#b71c1c">
        {loading ? '解剖中...' : '💢 鬱憤を爆発させる'}
      </Btn>
      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {result.headline && <Card style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', color: '#ef5350' }}>💢 {result.headline}</Card>}
          {[['🏛 哲学的視点', result.philosophical, '#7c6af7'], ['📊 データ的視点', result.data, '#42a5f5'], ['❤️ 人間的視点', result.human, '#66bb6a']].filter(([,v]) => v).map(([t, v, c]) => (
            <Card key={t}>
              <Label>{t}</Label>
              <p style={{ lineHeight: 1.9, color: colors.text, borderLeft: `3px solid ${c}`, paddingLeft: 12 }}>{v}</p>
            </Card>
          ))}
          {result.question && (
            <Card style={{ background: '#1a1020', borderColor: '#4a148c' }}>
              <p style={{ fontSize: 16, fontStyle: 'italic', color: '#ce93d8', textAlign: 'center', lineHeight: 1.8 }}>「{result.question}」</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
