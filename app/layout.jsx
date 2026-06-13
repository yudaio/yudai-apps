import { AuthProvider } from './apps/AuthGate'

export const metadata = {
  title: 'Yudai Apps — Claude AIで動く15のWebアプリ',
  description: '運命診断・Amazon分析・創作支援など、Claude AIを活用した15のWebアプリが無料で使える。日本語完全対応。',
  keywords: 'AI,Claude,Amazon,レビュー分析,運命診断,創作,無料,Webアプリ',
  openGraph: {
    title: 'Yudai Apps',
    description: 'Claude AIで動く15のWebアプリ。無料で即使える。',
    type: 'website',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#080808' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
