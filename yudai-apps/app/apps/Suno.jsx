'use client';
import { useState, useRef, useEffect } from 'react';
import { BackBtn, Label, callAI } from './shared';

const C = {
  bg: "#0A0A12",
  card: "#10101C",
  card2: "#141422",
  border: "#1E1E30",
  text: "#E8E8F8",
  muted: "#5050A0",
  accent: "#8B5CF6",
  accent2: "#EC4899",
  accent3: "#06B6D4",
};

const GENRES = ["Pop","Rock","Jazz","Lo-fi","Electronic","Hip-hop","Classical","R&B","Ambient","Folk","Metal","Soul"];
const MOODS  = ["明るい","切ない","エネルギッシュ","穏やか","ロマンチック","ダーク","エピック","懐かしい"];
const VOCALS = ["女性ボーカル","男性ボーカル","インストゥルメンタル","コーラス"];
const NOTES  = [261.63,329.63,392.00,523.25,659.25,783.99];

export default function Suno() {
  const [prompt, setPrompt]       = useState('');
  const [genres, setGenres]       = useState([]);
  const [mood, setMood]           = useState('');
  const [vocal, setVocal]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [songs, setSongs]         = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const audioCtxRef = useRef(null);
  const nodesRef    = useRef([]);
  const timerRef    = useRef(null);

  const toggleGenre = g =>
    setGenres(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g].slice(0, 3));

  const stopAudio = () => {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    clearTimeout(timerRef.current);
    setPlayingId(null);
  };

  const playDemo = (id) => {
    if (playingId === id) { stopAudio(); return; }
    stopAudio();
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.07, ctx.currentTime);
    masterGain.connect(ctx.destination);

    [0, 2, 4].map(i => NOTES[i]).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
      osc.connect(g); g.connect(masterGain);
      osc.start(); osc.stop(ctx.currentTime + 6);
      nodesRef.current.push(osc);
    });

    [0,2,4,5,4,2,0,2].map(i => NOTES[i]).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq * 2, ctx.currentTime + i * 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.4);
      g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + i * 0.4 + 0.05);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.4 + 0.35);
      osc.connect(g); g.connect(masterGain);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + i * 0.4 + 0.4);
      nodesRef.current.push(osc);
    });

    setPlayingId(id);
    timerRef.current = setTimeout(stopAudio, 6200);
  };

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setActiveTab('library');

    const style = [...genres, mood, vocal].filter(Boolean).join(', ');
    const system = `あなたはプロの作詞家・音楽プロデューサーです。ユーザーのリクエストに合わせた完全な楽曲を制作してください。

必ず以下のフォーマットで出力してください：
【TITLE】曲のタイトル
【TAGS】ジャンル, ムード, テンポ などを3〜5個（カンマ区切り）
【DESCRIPTION】楽曲の雰囲気を詩的に1〜2文で説明
【LYRICS】
[イントロ]
イントロのフレーズ

[Aメロ]
Aメロの歌詞（4〜6行）

[Bメロ]
Bメロの歌詞（3〜4行）

[サビ]
サビの歌詞（4〜6行）

[Aメロ2]
2番のAメロ（4〜6行）

[サビ2]
サビの繰り返し・変奏

[アウトロ]
締めのフレーズ

歌詞は感情的でリズミカルに。英語・日本語どちらでも、または混ぜても構いません。`;

    const userPrompt = `楽曲のテーマ：${prompt}${style ? `\nスタイル：${style}` : ''}`;
    const result = await callAI(system, userPrompt, 1000);

    const titleM = result.match(/【TITLE】([^\n]+)/);
    const tagsM  = result.match(/【TAGS】([^\n]+)/);
    const descM  = result.match(/【DESCRIPTION】([^\n]+)/);
    const lyrM   = result.match(/【LYRICS】([\s\S]+?)$/);

    const title       = titleM?.[1]?.trim() || '無題の曲';
    const tags        = tagsM?.[1]?.split(',').map(t => t.trim()).filter(Boolean) || genres;
    const description = descM?.[1]?.trim() || '';
    const lyrics      = lyrM?.[1]?.trim() || result;

    const seed = Date.now();
    const imgQ = encodeURIComponent(`album art, ${title}, ${tags.slice(0,3).join(' ')}, cinematic, vibrant, music, artistic, abstract, no text`);
    const imgUrl = `https://image.pollinations.ai/prompt/${imgQ}?width=256&height=256&nologo=true&seed=${seed}`;

    setSongs(p => [{
      id: seed, title, tags, description, lyrics, imgUrl, prompt,
      duration: Math.floor(Math.random() * 90 + 150),
    }, ...p]);

    setLoading(false);
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", minHeight: "100vh", padding: "0 0 80px" }}>
      <style>{`
        @keyframes wave { from{height:6px} to{height:28px} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes floatIcon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .play-btn:hover { opacity:0.85; transform:scale(1.05); }
        .tag-btn:hover { opacity:0.8; }
        .tab-btn { transition: all 0.2s; }
        .example-btn:hover { background: #1A1A28 !important; }
      `}</style>

      {/* Top Nav */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BackBtn />
        <div style={{ display: "flex", gap: 8 }}>
          {[['create','✨ 作成'],['library','🎵 ライブラリ']].map(([t,l]) => (
            <button key={t} className="tab-btn" onClick={() => setActiveTab(t)} style={{
              padding: "7px 18px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit", border: `1px solid ${activeTab===t ? C.accent : C.border}`,
              background: activeTab===t ? C.accent+"33" : "transparent",
              color: activeTab===t ? C.accent : C.muted, fontWeight: activeTab===t ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>
        <span style={{ fontSize: 20, color: C.accent, animation: "floatIcon 3s ease-in-out infinite" }}>🎼</span>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "28px 16px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 10, filter: "drop-shadow(0 0 20px #8B5CF688)" }}>🎵</div>
        <h1 style={{
          margin: "0 0 8px", fontSize: 32, fontWeight: 900, letterSpacing: "-1px",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accent2}, ${C.accent3})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Melody AI</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
          テキストから完全な楽曲を瞬時に生成
        </p>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: 20, marginBottom: 16 }}>

            <div style={{ marginBottom: 16 }}>
              <Label>どんな曲を作りたいですか？</Label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={"例：夜の海辺を歩きながら思い出す、切ない初恋の歌\n例：友達と過ごした夏の終わりを歌ったポップソング"}
                rows={4}
                style={{
                  width: "100%", padding: "14px", background: "#07070F",
                  border: `1px solid ${C.border}`, borderRadius: 12, color: C.text,
                  fontSize: 14, resize: "vertical", fontFamily: "inherit",
                  lineHeight: 1.8, boxSizing: "border-box", outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>
                ジャンル（最大3つ）
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {GENRES.map(g => (
                  <button key={g} className="tag-btn" onClick={() => toggleGenre(g)} style={{
                    padding: "5px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                    border: `1px solid ${genres.includes(g) ? C.accent : C.border}`,
                    background: genres.includes(g) ? C.accent+"22" : "transparent",
                    color: genres.includes(g) ? C.accent : C.muted,
                  }}>{g}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>ムード</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {MOODS.map(m => (
                    <button key={m} className="tag-btn" onClick={() => setMood(mood===m ? '' : m)} style={{
                      padding: "4px 10px", borderRadius: 16, fontSize: 11, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                      border: `1px solid ${mood===m ? C.accent2 : C.border}`,
                      background: mood===m ? C.accent2+"22" : "transparent",
                      color: mood===m ? C.accent2 : C.muted,
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.08em", marginBottom: 8 }}>ボーカル</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {VOCALS.map(v => (
                    <button key={v} className="tag-btn" onClick={() => setVocal(vocal===v ? '' : v)} style={{
                      padding: "4px 10px", borderRadius: 16, fontSize: 11, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                      border: `1px solid ${vocal===v ? C.accent3 : C.border}`,
                      background: vocal===v ? C.accent3+"22" : "transparent",
                      color: vocal===v ? C.accent3 : C.muted,
                    }}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!prompt.trim() || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, fontSize: 15,
                fontWeight: 700, cursor: prompt.trim() && !loading ? "pointer" : "default",
                fontFamily: "inherit", border: "none", transition: "opacity 0.2s",
                background: prompt.trim() && !loading
                  ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})`
                  : "#1A1A28",
                color: prompt.trim() && !loading ? "#fff" : C.muted,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "🎼 楽曲を制作中..." : "✨ 楽曲を生成する"}
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>サンプルプロンプト</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "深夜のコンビニで感じる孤独と安心感",
                "卒業式の朝、友達と最後に交わした言葉",
                "AI時代に人間らしさを問う哲学的なヒップホップ",
                "雨の日にカフェで飲むコーヒーのような落ち着く曲",
              ].map(ex => (
                <button key={ex} className="example-btn" onClick={() => setPrompt(ex)} style={{
                  padding: "10px 14px", background: C.card2, border: `1px solid ${C.border}`,
                  borderRadius: 10, color: C.text, fontSize: 13, cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                  <span style={{ color: C.accent, marginRight: 8 }}>→</span>{ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div style={{ padding: "0 16px" }}>
          {loading && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: "24px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.accent}44, ${C.accent2}44)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "pulse 1.5s ease-in-out infinite" }}>
                <span style={{ fontSize: 28 }}>🎵</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 600, marginBottom: 8 }}>楽曲を制作中...</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
                  {[...Array(16)].map((_, i) => (
                    <div key={i} style={{
                      width: 3, borderRadius: 2, background: C.accent,
                      animation: `wave 0.7s ${i*0.06}s infinite alternate`,
                    }} />
                  ))}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
                  {prompt.slice(0, 40)}{prompt.length > 40 ? '...' : ''}
                </div>
              </div>
            </div>
          )}

          {songs.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🎵</div>
              <div style={{ fontSize: 14 }}>まだ楽曲がありません</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>「作成」タブから楽曲を生成してください</div>
            </div>
          )}

          {songs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={playingId === song.id}
              onPlay={() => playDemo(song.id)}
              fmt={fmt}
              accent={C.accent}
              accent2={C.accent2}
              card={C.card}
              border={C.border}
              text={C.text}
              muted={C.muted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongCard({ song, isPlaying, onPlay, fmt, accent, accent2, card, border, text, muted }) {
  const [showLyrics, setShowLyrics] = useState(false);
  const [imgLoaded, setImgLoaded]   = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {}, 6200);
    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="song-card" style={{
      background: card, border: `1px solid ${isPlaying ? accent+"66" : border}`,
      borderRadius: 16, overflow: "hidden", marginBottom: 12, transition: "all 0.3s",
      boxShadow: isPlaying ? `0 0 30px ${accent}22` : "none",
    }}>
      <div style={{ display: "flex" }}>
        {/* Album Art */}
        <div style={{ width: 90, minHeight: 90, flexShrink: 0, position: "relative",
          background: `linear-gradient(135deg, ${accent}55, ${accent2}55)`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={song.imgUrl} alt={song.title} onLoad={() => setImgLoaded(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", display: imgLoaded ? "block" : "none" }} />
          {!imgLoaded && <span style={{ fontSize: 28, position: "relative" }}>🎵</span>}
          <button onClick={onPlay} className="play-btn" style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
            border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 26,
            opacity: isPlaying ? 1 : 0, transition: "opacity 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
          onMouseLeave={e => { if (!isPlaying) e.currentTarget.style.opacity = 0; }}>
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
          <div style={{ color: text, fontWeight: 700, fontSize: 14,
            marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {song.title}
          </div>
          {song.description && (
            <div style={{ color: muted, fontSize: 11, marginBottom: 6, lineHeight: 1.5,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" }}>{song.description}</div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {song.tags.slice(0,4).map((tag, i) => (
              <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: i===0 ? accent+"33" : border,
                color: i===0 ? accent : muted }}>
                {tag}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onPlay} className="play-btn" style={{
              width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
              border: `1.5px solid ${accent}`, background: isPlaying ? accent : "transparent",
              color: isPlaying ? "#fff" : accent, fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
            }}>
              {isPlaying ? "⏸" : "▶"}
            </button>

            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 24 }}>
              {[...Array(22)].map((_, i) => (
                <div key={i} style={{
                  width: 2.5, borderRadius: 2, minHeight: 3,
                  height: `${30 + Math.sin(i*0.9+1)*15}%`,
                  background: isPlaying ? accent : border,
                  animation: isPlaying ? `wave 0.6s ${i*0.045}s infinite alternate` : "none",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>

            <span style={{ color: muted, fontSize: 10, flexShrink: 0 }}>{fmt(song.duration)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${border}` }}>
        <button onClick={() => setShowLyrics(s => !s)} style={{
          width: "100%", padding: "9px 14px", background: "none", border: "none",
          color: muted, fontSize: 11, cursor: "pointer", textAlign: "left",
          fontFamily: "inherit", display: "flex", justifyContent: "space-between",
          alignItems: "center", letterSpacing: "0.06em",
        }}>
          <span>歌詞を見る</span>
          <span style={{ transition: "transform 0.2s",
            transform: showLyrics ? "rotate(180deg)" : "none" }}>▼</span>
        </button>
        {showLyrics && (
          <div style={{ padding: "14px 16px 16px", color: text, fontSize: 13,
            lineHeight: 2.1, whiteSpace: "pre-wrap",
            borderTop: `1px solid ${border}` }}>
            {song.lyrics}
          </div>
        )}
      </div>
    </div>
  );
}
