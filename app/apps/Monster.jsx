'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Monster() {
  const { user, supabase } = useAuth() || {}
  const [diary, setDiary] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [imgUrl, setImgUrl] = useState('')

  const run = async () => {
    setLoading(true); setResult(null); setImgUrl('')
    const text = await callAI([{ role: 'user', content: `日記:\n${diary}\n\nこの感情からモンスターを召喚。JSONのみ:\n{"name":"モンスター名(日本語)","type":"属性(例:怒火/悲哀/孤独)","description":"外見と雰囲気50字","skills":["スキル名:説明"],"catchphrase":"モンスターの一言30字","rarity":"common|rare|epic|legendary"}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r)
      const prompt = `fantasy monster, ${r.name}, ${r.type} type, ${r.description}, digital art, dark background`
      setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&nologo=true`)
      saveHistory(user, supabase, 'monster', diary, r)
    } catch { setResult({ name: '謎のモンスター', type: '不明', description: text, skills: [], catchphrase: '...', rarity: 'rare' }) }
    setLoading(false)
  }

  const rarityColor = { common: '#aaa', rare: '#42a5f5', epic: '#ab47bc', legendary: '#c9a84c' }

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>今日の日記・気持ちを書く</Label>
        <Input value={diary} onChange={e => setDiary(e.target.value)} placeholder="今日は仕事でミスして落ち込んだ。でも帰り道に猫を見かけてちょっと元気が出た..." multiline rows={5} />
      </div>
      <Btn onClick={run} disabled={loading || !diary} style={{ marginTop: 16 }} color="#4a148c">
        {loading ? '召喚中...' : '👾 モンスターを召喚'}
      </Btn>
      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <Card style={{ display: 'grid', gridTemplateColumns: imgUrl ? '160px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
            {imgUrl && <img src={imgUrl} alt={result.name} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8 }} onError={() => setImgUrl('')} />}
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>{result.name}</h2>
                <span style={{ fontSize: 11, color: rarityColor[result.rarity], background: '#1a1a1a', padding: '2px 8px', borderRadius: 4, border: `1px solid ${rarityColor[result.rarity]}` }}>{result.rarity?.toUpperCase()}</span>
              </div>
              <p style={{ color: '#ab47bc', marginBottom: 8 }}>⚡ {result.type}属性</p>
              <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7 }}>{result.description}</p>
              <p style={{ marginTop: 12, fontStyle: 'italic', color: '#c9a84c' }}>「{result.catchphrase}」</p>
            </div>
          </Card>
          {result.skills?.length > 0 && (
            <Card>
              <Label>スキル</Label>
              {result.skills.map((s, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: colors.text }}>⚔️ {s}</p>)}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
