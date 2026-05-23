'use client'
import { useState, useEffect } from 'react'
import { Card, Btn, Label, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

export default function Genki() {
  const { user, supabase } = useAuth() || {}
  const [level, setLevel] = useState(70); const [streak, setStreak] = useState(0); const [saved, setSaved] = useState(false); const [msg, setMsg] = useState('')

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('history_genki') || '[]')
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const lastDate = h[0] ? new Date(h[0].ts).toDateString() : null
      if (lastDate === yesterday || lastDate === today) setStreak(h.length)
    } catch {}
  }, [])

  const msgs = [
    [0, 30, '今日はゆっくり休んでいいよ。あなたのペースで大丈夫。🌙'],
    [30, 60, 'まあまあの日もある。それで十分。☁️'],
    [60, 85, '悪くない！その調子で行こう。🌤'],
    [85, 101, '元気全開！その波、世界に届け！🌟']
  ]

  const checkin = () => {
    const m = msgs.find(([a, b]) => level >= a && level < b)?.[2] || ''
    setMsg(m); setSaved(true)
    saveHistory(user, supabase, 'genki', String(level), { level, msg: m })
    setStreak(s => s + 1)
  }

  const worldAvg = 62
  const color = level < 30 ? '#ef5350' : level < 60 ? '#ffa726' : level < 85 ? '#66bb6a' : '#42a5f5'

  return (
    <div>
      <AuthBadge />
      <Card style={{ textAlign: 'center', marginTop: 24 }}>
        <Label>今日の元気レベル</Label>
        <div style={{ fontSize: 80, fontWeight: 700, color, lineHeight: 1.1 }}>{level}</div>
        <input type="range" min={0} max={100} value={level} onChange={e => { setLevel(+e.target.value); setSaved(false) }} style={{ width: '100%', marginTop: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.muted }}>
          <span>0 つらい</span><span>100 最高</span>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <Card style={{ textAlign: 'center' }}>
          <Label>世界平均との比較</Label>
          <p style={{ fontSize: 24, color: level > worldAvg ? '#66bb6a' : '#ef5350' }}>
            {level > worldAvg ? `+${level - worldAvg}` : level - worldAvg}
          </p>
          <p style={{ fontSize: 12, color: colors.muted }}>世界平均 {worldAvg}</p>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <Label>連続チェックイン</Label>
          <p style={{ fontSize: 24, color: '#c9a84c' }}>🔥 {streak}日</p>
        </Card>
      </div>
      <Btn onClick={checkin} disabled={saved} style={{ marginTop: 16, width: '100%' }} color="#1a6b3a">
        {saved ? '✅ チェックイン完了' : '🌐 今日の元気を記録'}
      </Btn>
      {msg && <Card style={{ marginTop: 12, textAlign: 'center', fontSize: 16, lineHeight: 1.8 }}>{msg}</Card>}
    </div>
  )
}
