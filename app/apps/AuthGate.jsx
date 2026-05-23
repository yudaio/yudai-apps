'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])
  return <AuthCtx.Provider value={{ user, supabase }}>{children}</AuthCtx.Provider>
}

export function AuthBadge() {
  const { user, supabase: sb } = useAuth() || {}
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  if (!sb) return null
  if (user) return (
    <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>👤 {user.email}</span>
      <button onClick={() => sb.auth.signOut()} style={{ fontSize: 11, background: 'none', border: '1px solid #555', color: '#aaa', padding: '2px 8px', cursor: 'pointer', borderRadius: 4 }}>ログアウト</button>
    </div>
  )
  return (
    <div>
      {!show ? (
        <button onClick={() => setShow(true)} style={{ fontSize: 12, background: 'none', border: '1px solid #555', color: '#aaa', padding: '4px 12px', cursor: 'pointer', borderRadius: 4 }}>
          ログインして履歴をクラウド保存
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input placeholder="メール" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: 4 }} />
          <input placeholder="パスワード" type="password" value={pw} onChange={e => setPw(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: 4 }} />
          <button onClick={() => sb.auth.signInWithPassword({ email, password: pw })} style={{ fontSize: 12, background: '#333', border: 'none', color: '#fff', padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>ログイン</button>
          <button onClick={() => sb.auth.signUp({ email, password: pw })} style={{ fontSize: 12, background: '#1a4b2a', border: 'none', color: '#fff', padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>登録</button>
        </div>
      )}
    </div>
  )
}

export async function saveHistory(user, supabase, appId, input, result) {
  const item = { appId, input, result: JSON.stringify(result), ts: Date.now() }
  if (supabase && user) {
    await supabase.from('histories').insert({ user_id: user.id, app_id: appId, input, result: JSON.stringify(result) })
  }
  try {
    const key = `history_${appId}`
    const prev = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([item, ...prev].slice(0, 10)))
  } catch {}
}
