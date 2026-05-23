'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Fate() {
  const { user, supabase } = useAuth() || {}
  const [name, setName] = useState(''); const [worry, setWorry] = useState('')
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `名前: ${name}\n悩み: ${worry}\n\n以下3セクションでJSON返答(他テキスト不要):\n{"statistical":"統計的傾向の分析150字","psychological":"心理学的考察150字","guidance":"今後の指針150字","fortune":"運勢ひとこと30字"}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r)
      saveHistory(user, supabase, 'fate', `${name}/${worry}`, r)
    } catch { setResult({ statistical: text, psychological: '', guidance: '', fortune: '' }) }
    setLoading(false)
  }

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>あなたの名前</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="例：田中一郎" />
      </div>
      <div style={{ marginTop: 16 }}>
        <Label>今の悩みや状況</Label>
        <Input value={worry} onChange={e => setWorry(e.target.value)} placeholder="例：転職すべきか迷っている" multiline rows={3} />
      </div>
      <Btn onClick={run} disabled={loading || !name || !worry} style={{ marginTop: 16 }}>
        {loading ? '解析中...' : '🔮 運命を解析'}
      </Btn>
      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {result.fortune && <Card style={{ textAlign: 'center', fontSize: 20, color: '#c9a84c' }}>✨ {result.fortune}</Card>}
          {[['📊 統計的傾向', result.statistical], ['🧠 心理学的考察', result.psychological], ['🧭 今後の指針', result.guidance]].filter(([,v]) => v).map(([t, v]) => (
            <Card key={t}><Label>{t}</Label><p style={{ lineHeight: 1.8, color: colors.text }}>{v}</p></Card>
          ))}
        </div>
      )}
    </div>
  )
}
