import { AuthProvider } from './apps/AuthGate';
export const metadata = { title: "Yudai Apps", description: "AIと感情が交差する、11本のアプリ" };

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          ::selection { background: #6366F133; color: #E2E8FF; }
          ::placeholder { color: #3A4870; opacity: 1; }
          textarea { resize: vertical; }

          /* ── アニメーション ── */
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes float {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            50%      { transform: translateY(-8px) rotate(1deg); }
          }
          @keyframes floatAlt {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            50%      { transform: translateY(-6px) rotate(-1deg); }
          }
          @keyframes glow {
            0%,100% { opacity: 0.5; }
            50%      { opacity: 1; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40%            { transform: translateY(-6px); }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes page-turn {
            from { opacity: 0; transform: rotateY(-8deg) translateX(-10px); }
            to   { opacity: 1; transform: rotateY(0deg) translateX(0); }
          }
          @keyframes stamp-in {
            0%   { transform: scale(1.4) rotate(-3deg); opacity: 0; }
            60%  { transform: scale(0.95) rotate(-1deg); opacity: 1; }
            100% { transform: scale(1) rotate(-2deg); opacity: 1; }
          }
          @keyframes pulse-ring {
            0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
            70%  { transform: scale(1);    box-shadow: 0 0 0 10px rgba(99,102,241,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          }

          /* ── ユーティリティ ── */
          .fade-up  { animation: fadeUp 0.5s ease forwards; }
          .fade-in  { animation: fadeIn 0.4s ease forwards; }
          .card-enter { animation: page-turn 0.4s ease forwards; }
          .stamp-appear { animation: stamp-in 0.3s ease forwards; }
          .spine-item { transition: transform 0.2s, filter 0.2s; cursor: pointer; }
          .spine-item:hover { transform: translateY(-4px); filter: brightness(1.15); }
          .paper-texture {
            background-image: repeating-linear-gradient(
              0deg, transparent, transparent 27px,
              rgba(139,107,74,0.08) 27px, rgba(139,107,74,0.08) 28px
            );
          }

          /* ── グラデーションテキスト ── */
          .grad-text {
            background: linear-gradient(135deg, #A78BFA 0%, #6366F1 40%, #38BDF8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .grad-text-warm {
            background: linear-gradient(135deg, #F472B6 0%, #A78BFA 50%, #60A5FA 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          /* ── グローカード ── */
          .glow-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .glow-card:hover {
            transform: translateY(-4px);
          }

          /* ── スクロールバー ── */
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: #07091A; }
          ::-webkit-scrollbar-thumb { background: #2A3060; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #4A5890; }
        `}</style>
      </head>
      <body style={{
        margin: 0,
        background: "#050812",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#E2E8FF",
        minHeight: "100vh",
        WebkitFontSmoothing: "antialiased",
      }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
