'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { Btn, Label } from './shared';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message;
  };
  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message;
  };
  const signOut = () => supabase?.auth.signOut();

  if (!ready) return null;
  return <AuthCtx.Provider value={{ user, signIn, signUp, signOut }}>{children}</AuthCtx.Provider>;
}

export function AuthBadge() {
  const auth = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState('in');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!supabase) return null;

  const inp = (val, set) => (
    <input value={val} onChange={e => set(e.target.value)} style={{
      width: "100%", padding: "10px 12px", background: "#0A0D20", border: "1px solid #182040",
      borderRadius: 8, color: "#C5D0F0", fontSize: 13, fontFamily: "inherit",
      boxSizing: "border-box", marginBottom: 10, outline: "none"
    }} />
  );

  const submit = async () => {
    setLoading(true); setErr('');
    const fn = mode === 'in' ? auth.signIn : auth.signUp;
    const e = await fn(email, pw);
    if (e) setErr(e);
    setLoading(false);
    if (!e) setShow(false);
  };

  if (auth?.user) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ color: "#3AFF8A", fontSize: 12 }}>✓ {auth.user.email}</span>
      <button onClick={auth.signOut} style={{ background: "none", border: "none", color: "#4A5880", fontSize: 12, cursor: "pointer" }}>ログアウト</button>
    </div>
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {!show ? (
        <button onClick={() => setShow(true)} style={{
          background: "none", border: "1px solid #182040", borderRadius: 8,
          color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
        }}>ログインして履歴をクラウド保存</button>
      ) : (
        <div style={{ padding: 16, background: "#0C0F22", border: "1px solid #182040", borderRadius: 10 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {['in','up'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                border: `1px solid ${mode === m ? "#5B7BFF" : "#182040"}`,
                background: mode === m ? "#1A2060" : "transparent",
                color: mode === m ? "#5B7BFF" : "#4A5880"
              }}>{m === 'in' ? 'ログイン' : '新規登録'}</button>
            ))}
          </div>
          <Label>メールアドレス</Label>
          {inp(email, setEmail)}
          <Label>パスワード</Label>
          {inp(pw, setPw)}
          {err && <div style={{ color: "#FF5A5A", fontSize: 12, marginBottom: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={submit} disabled={loading}>{loading ? '...' : mode === 'in' ? 'ログイン' : '登録'}</Btn>
            <Btn onClick={() => setShow(false)} color="#1A1E38">キャンセル</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
