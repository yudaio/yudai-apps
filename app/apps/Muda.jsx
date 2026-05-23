'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Muda() {
  const { user, supabase } = useAuth() || {}
  const [routine, setRoutine] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `ルーティン:\n${routine}\n\n認知負荷研究に基づき分析。JSONのみ返答:\n{"delete":[{"item":"項目","reason":"削除理由"}],"optimize":[{"item":"項目","reason":"最適化方法"}],"keep":[{"item":"項目","reason":"維持理由"}],"summary":"総評100字"}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r); saveHistory(user, supabase, 'muda', routine, r)
    } catch { setResult({ delete: [], optimize: [], keep: [], summary: text }) }
    setLoading(false)
  }

  const Section = ({ title, items, color }) => items?.length > 0 && (
    <Card>
      <Label>{title}</Label>
      {items.map((i, idx) => (
        <div key={idx} style={{ padding: '10px 0', borderBottom: idx < items.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
          <p style={{ fontWeight: 600, color }}>{i.item}</p>
          <p style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{i.reason}</p>
        </div>
      ))}
    </Card>
  )

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>日課・ルーティンを箇条書きで入力</Label>
        <Input value={routine} onChange={e => setRoutine(e.target.value)} placeholder={"・毎朝SNSを1時間見る\n・週3ジム\n・毎晩YouTube2時間\n・日記を書く"} multiline rows={6} />
      </div>
      <Btn onClick={run} disabled={loading || !routine} style={{ marginTop: 16 }}>
        {loading ? '分析中...' : '🧠 無駄を科学する'}
      </Btn>
      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {result.summary && <Card style={{ color: '#7c6af7' }}>{result.summary}</Card>}
          <Section title="🗑 削除推奨" items={result.delete} color="#ef5350" />
          <Section title="⚡ 最適化推奨" items={result.optimize} color="#ffa726" />
          <Section title="✅ 維持推奨" items={result.keep} color="#66bb6a" />
        </div>
      )}
    </div>
  )
}
