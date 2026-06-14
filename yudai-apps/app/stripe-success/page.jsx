'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function StripeSuccess() {
  const params = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) { setStatus('error'); return; }

    // localStorageにプレミアムフラグを保存（Supabase未設定環境でも動く）
    localStorage.setItem('premium_v1', sessionId);
    setStatus('success');
  }, [params]);

  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050812' }}>
      <div style={{ color:'#5A6890', fontSize:14 }}>確認中...</div>
    </div>
  );

  if (status === 'error') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050812', padding:16 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
        <div style={{ color:'#FCA5A5', fontSize:16, marginBottom:8 }}>セッション情報が見つかりません</div>
        <Link href="/" style={{ color:'#6366F1', fontSize:14 }}>トップに戻る</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050812', padding:16 }}>
      <div style={{ maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
        <h1 style={{ color:'#E2E8FF', fontSize:24, fontWeight:800, margin:'0 0 12px' }}>
          プレミアム開始！
        </h1>
        <p style={{ color:'#5A6890', fontSize:14, lineHeight:1.8, marginBottom:32 }}>
          全アプリが使い放題になりました。<br />
          いつでもキャンセルできます。
        </p>
        <Link href="/" style={{
          display:'inline-block', padding:'14px 32px',
          background:'linear-gradient(135deg,#6366F1,#A78BFA)',
          borderRadius:12, color:'#fff', fontWeight:700,
          fontSize:16, textDecoration:'none',
          boxShadow:'0 8px 32px rgba(99,102,241,0.4)',
        }}>
          アプリを使う →
        </Link>
      </div>
    </div>
  );
}
