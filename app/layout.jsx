import { AuthProvider } from './apps/AuthGate';
export const metadata = { title: "App Portfolio", description: "8つのAIアプリ" };

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; }
          ::placeholder { color: #4A3A2A; opacity: 0.6; }
          textarea { resize: vertical; }
          @keyframes float {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-6px); }
          }
          @keyframes glow-pulse {
            0%,100% { box-shadow: 0 0 20px rgba(200,168,75,0.15); }
            50%      { box-shadow: 0 0 40px rgba(200,168,75,0.30); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
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
          @keyframes spin { to { transform: rotate(360deg); } }
          .card-enter   { animation: page-turn 0.4s ease forwards; }
          .stamp-appear { animation: stamp-in 0.3s ease forwards; }
          .book-card-enter { animation: fade-in 0.5s ease forwards; }
          .spine-item { transition: transform 0.2s, filter 0.2s; cursor: pointer; }
          .spine-item:hover { transform: translateY(-4px); filter: brightness(1.15); }
          .paper-texture {
            background-image: repeating-linear-gradient(
              0deg, transparent, transparent 27px,
              rgba(139,107,74,0.08) 27px, rgba(139,107,74,0.08) 28px
            );
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #E8D9B8; }
          ::-webkit-scrollbar-thumb { background: #8B6B4A; border-radius: 3px; }
        `}</style>
      </head>
      <body style={{ margin: 0, background: "#07091A", fontFamily: "'Inter', sans-serif", color: "#C5D0F0", minHeight: "100vh" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
