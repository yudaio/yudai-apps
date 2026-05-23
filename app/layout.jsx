import { AuthProvider } from './apps/AuthGate'

export const metadata = { title: 'Yudai Apps', description: '8つのAI駆動Webアプリ' }

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#0a0a0a' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
