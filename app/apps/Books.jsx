'use client'
import { useState } from 'react'
import { Card, Btn, Input, Label, callAI, colors } from './shared'
import { useAuth, AuthBadge, saveHistory } from './AuthGate'

const AFFILIATE_TAG = 'yudai-books-22'

export default function Books() {
  const { user, supabase } = useAuth() || {}
  const [situation, setSituation] = useState(''); const [genre, setGenre] = useState(''); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    const text = await callAI([{ role: 'user', content: `状況: ${situation}\nジャンル: ${genre || '問わない'}\n\n今の状況に最適な本を3〜5冊推薦。JSONのみ:\n{"books":[{"title":"書名(日本語)","author":"著者","reason":"なぜ今この本か100字","isbn":"ISBNコード(13桁)","genre":"ジャンル"}]}` }])
    try {
      const r = JSON.parse(text.replace(/```json|```/g, '').trim())
      setResult(r); saveHistory(user, supabase, 'books', `${situation}/${genre}`, r)
    } catch { setResult({ books: [] }) }
    setLoading(false)
  }

  const amazonUrl = (isbn, title) =>
    isbn ? `https://www.amazon.co.jp/dp/${isbn}/?tag=${AFFILIATE_TAG}` : `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}&tag=${AFFILIATE_TAG}`

  return (
    <div>
      <AuthBadge />
      <div style={{ marginTop: 24 }}>
        <Label>今の状況・気持ち</Label>
        <Input value={situation} onChange={e => setSituation(e.target.value)} placeholder="例：転職を考えていてモヤモヤしている。自分の強みが分からない" multiline rows={3} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>読みたいジャンル（任意）</Label>
        <Input value={genre} onChange={e => setGenre(e.target.value)} placeholder="例：ビジネス、小説、自己啓発、何でも" />
      </div>
      <Btn onClick={run} disabled={loading || !situation} style={{ marginTop: 16 }} color="#1b5e20">
        {loading ? '選書中...' : '📖 本を推薦してもらう'}
      </Btn>
      {result?.books?.length > 0 && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {result.books.map((b, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>{b.title}</p>
                  <p style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{b.author} · {b.genre}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: colors.text, marginTop: 10 }}>{b.reason}</p>
                </div>
                <a href={amazonUrl(b.isbn, b.title)} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#FF9900', color: '#000', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Amazon →
                </a>
              </div>
            </Card>
          ))}
          <p style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>※ Amazonアソシエイトリンクを使用しています</p>
        </div>
      )}
    </div>
  )
}
