import { AuthProvider } from './apps/AuthGate';
export const metadata = { title: "App Portfolio", description: "8つのAIアプリ" };

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#07091A", fontFamily: "'Inter', sans-serif", color: "#C5D0F0", minHeight: "100vh" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
