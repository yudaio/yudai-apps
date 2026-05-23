'use client'

export const colors = {
  bg: '#0a0a0a', surface: '#141414', border: '#222',
  text: '#e8e8e8', muted: '#666', accent: '#7c6af7'
}

export function Card({ children, style }) {
  return <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, ...style }}>{children}</div>
}

export function Btn({ children, onClick, disabled, color = colors.accent, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#222' : color, color: disabled ? '#555' : '#fff',
      border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, ...style
    }}>{children}</button>
  )
}

export function Input({ value, onChange, placeholder, multiline, rows = 4 }) {
  const s = {
    width: '100%', background: '#1a1a1a', border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '12px 16px', fontSize: 14, color: colors.text,
    outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
  }
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={s} />
    : <input value={value} onChange={onChange} placeholder={placeholder} style={{ ...s, resize: undefined }} />
}

export function Label({ children }) {
  return <p style={{ fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: 8, textTransform: 'uppercase' }}>{children}</p>
}

export async function callAI(messages, system) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, ...(system ? { system } : {}) })
  })
  const data = await res.json()
  return data.content[0].text
}
