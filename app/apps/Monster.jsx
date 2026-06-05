'use client';
import { useState, useEffect } from 'react';
import { Btn, TA, Loading, BackBtn, Label, HistoryPanel, callAI, saveHistory, getHistoryLocal, getHistoryRemote, share } from './shared';
import { AuthBadge, useAuth } from './AuthGate';
import { useGate, PaywallModal, UsageBadge } from './Paywall';

const T = {
  ja: {
    title: "言葉モンスター",
    subtitle: "あなたの言葉から、唯一無二の存在が生まれる",
    diaryLabel: "今日の気持ちや出来事を書いてください",
    diaryPlaceholder: "例：会議でうまく話せなかった。でも帰り道の夕焼けがきれいで、少し救われた…",
    imageLabel: "モンスターのイメージ（任意）",
    imagePlaceholder: "例：暗い紫色の翼、炎を纏った爪、霧の中に溶け込む体…",
    imageHint: "色・形・雰囲気など自由に。空欄でもOK",
    summon: "モンスターを召喚",
    generating: "モンスター生成中...",
    shareBtn: "シェア / コピー",
    shareTitle: "言葉モンスター召喚！",
    tabSummon: "召喚",
    tabZukan: "図鑑",
    zukanTitle: "感情図鑑",
    zukanEmpty: "まだモンスターがいません。\n召喚して図鑑を埋めていこう！",
    zukanCount: (n) => `${n}体のモンスターを収集`,
    rareBadge: "✨ レア",
    system: `あなたは言葉から「感情モンスター」を召喚するクリエイターです。出力：
【名前】カタカナ3〜5文字
【タイプ】例：迷いの翼型
【レア度】通常 または レア（10%の確率でレアにする）
【特徴】外見を3行で描写
【スキル】感情から生まれた特殊能力2つ
【一言】モンスターがあなたに言う言葉
テキスト絵文字も使う。`,
    userPrompt: (diary, vision) => `今日の日記：\n${diary}${vision ? `\n\nユーザーのイメージ：\n${vision}` : ''}`,
  },
  en: {
    title: "Word Monster",
    subtitle: "Your words summon a one-of-a-kind creature",
    diaryLabel: "Write about your feelings or what happened today",
    diaryPlaceholder: "e.g. I couldn't speak up in the meeting. But the sunset on the way home was beautiful and somehow comforting…",
    imageLabel: "Monster image idea (optional)",
    imagePlaceholder: "e.g. Dark purple wings, claws wrapped in flames, a body that dissolves into mist…",
    imageHint: "Colors, shapes, vibe — anything goes. Leave blank if unsure.",
    summon: "Summon Monster",
    generating: "Generating monster…",
    shareBtn: "Share / Copy",
    shareTitle: "Word Monster Summoned!",
    tabSummon: "Summon",
    tabZukan: "Collection",
    zukanTitle: "Emotion Collection",
    zukanEmpty: "No monsters yet.\nSummon one to start your collection!",
    zukanCount: (n) => `${n} monster${n !== 1 ? 's' : ''} collected`,
    rareBadge: "✨ Rare",
    system: `You are a creator who summons "emotion monsters" from words. Output:
[Name] 2-4 word dramatic name
[Type] e.g. "Wings of Doubt"
[Rarity] Common or Rare (make it Rare roughly 10% of the time)
[Appearance] Describe the look in 3 lines
[Skills] 2 special abilities born from emotion
[Message] One thing the monster says to the user
Use expressive text emoji too.`,
    userPrompt: (diary, vision) => `Today's journal:\n${diary}${vision ? `\n\nUser's image idea:\n${vision}` : ''}`,
  },
};

function buildImagePrompt(monsterText, vision, lang) {
  const isEn = lang === 'en';
  const nameKey = isEn ? /\[Name\]([^\n]+)/ : /【名前】([^\n]+)/;
  const typeKey = isEn ? /\[Type\]([^\n]+)/ : /【タイプ】([^\n]+)/;
  const featKey = isEn ? /\[Appearance\]([\s\S]+?)(?=\[|$)/ : /【特徴】([\s\S]+?)(?=【|$)/;
  const name = monsterText.match(nameKey)?.[1]?.trim() || 'monster';
  const type = monsterText.match(typeKey)?.[1]?.trim() || '';
  const feat = monsterText.match(featKey)?.[1]?.replace(/\n/g, ' ').trim().slice(0, 80) || '';
  const visionPart = vision ? `, ${vision.slice(0, 60)}` : '';
  return `fantasy creature, ${name}, ${type}, ${feat}${visionPart}, dark background, dramatic lighting, digital art, ultra detailed, cinematic, no text`;
}

function parseRarity(text, lang) {
  const isEn = lang === 'en';
  if (isEn) return /\[Rarity\]\s*Rare/i.test(text) ? 'rare' : 'common';
  return /【レア度】レア/.test(text) ? 'rare' : 'common';
}

function parseName(text, lang) {
  const isEn = lang === 'en';
  return isEn
    ? text.match(/\[Name\]([^\n]+)/)?.[1]?.trim() || '???'
    : text.match(/【名前】([^\n]+)/)?.[1]?.trim() || '???';
}

function parseType(text, lang) {
  const isEn = lang === 'en';
  return isEn
    ? text.match(/\[Type\]([^\n]+)/)?.[1]?.trim() || ''
    : text.match(/【タイプ】([^\n]+)/)?.[1]?.trim() || '';
}

const ZUKAN_KEY = 'monster_zukan';

function loadZukan() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(ZUKAN_KEY) || '[]');
}

function saveZukan(entry) {
  const prev = loadZukan();
  const updated = [entry, ...prev].slice(0, 100);
  localStorage.setItem(ZUKAN_KEY, JSON.stringify(updated));
  return updated;
}

// Stats from zukan
function calcStats(zukan) {
  const total = zukan.length;
  const rareCount = zukan.filter(z => z.rarity === 'rare').length;
  return { total, rareCount };
}

export default function Monster() {
  const auth = useAuth();
  const [lang, setLang] = useState('ja');
  const [tab, setTab] = useState('summon'); // 'summon' | 'zukan'
  const [diary, setDiary] = useState('');
  const [vision, setVision] = useState('');
  const [res, setRes] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [zukan, setZukan] = useState([]);
  const [newRare, setNewRare] = useState(false);
  const t = T[lang];
  const gate = useGate('monster');

  useEffect(() => {
    async function load() {
      if (auth?.user) {
        const remote = await getHistoryRemote('monster', auth.user.id);
        setHistory(remote || getHistoryLocal('monster'));
      } else {
        setHistory(getHistoryLocal('monster'));
      }
    }
    load();
    setZukan(loadZukan());
  }, [auth?.user]);

  const run = async () => {
    if (!gate.check()) return;
    setLoading(true); setImgUrl(''); setImgLoaded(false); setNewRare(false);
    const r = await callAI(t.system, t.userPrompt(diary, vision));
    setRes(r);
    const prompt = buildImagePrompt(r, vision, lang);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
    setImgUrl(url);

    const rarity = parseRarity(r, lang);
    const name = parseName(r, lang);
    const type = parseType(r, lang);
    if (rarity === 'rare') setNewRare(true);

    const entry = {
      id: Date.now(),
      name,
      type,
      rarity,
      imgUrl: url,
      text: r,
      diary: diary.slice(0, 40),
      date: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US'),
    };
    const updated = saveZukan(entry);
    setZukan(updated);

    await saveHistory('monster', diary.slice(0, 40) + '…', r, auth?.user?.id);
    const h = auth?.user ? (await getHistoryRemote('monster', auth.user.id)) : getHistoryLocal('monster');
    setHistory(h || []);
    gate.increment();
    setLoading(false);
  };

  const stats = calcStats(zukan);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />

      {/* Language toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 6 }}>
        {['ja', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${lang === l ? "#5B7BFF" : "#182040"}`,
            background: lang === l ? "#1A2060" : "transparent",
            color: lang === l ? "#5B7BFF" : "#4A5880", fontSize: 12
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ fontSize: 32, marginBottom: 8 }}>👾</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>{t.title}</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>{t.subtitle}</p>

      {/* Stats bar */}
      {stats.total > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: "10px 14px", background: "#0A0F26", border: "1px solid #2A3070", borderRadius: 10, textAlign: "center" }}>
            <div style={{ color: "#5B7BFF", fontSize: 22, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ color: "#4A5880", fontSize: 11 }}>{lang === 'ja' ? '収集済み' : 'Collected'}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 14px", background: "#0A0F26", border: "1px solid #2A3070", borderRadius: 10, textAlign: "center" }}>
            <div style={{ color: "#FFD700", fontSize: 22, fontWeight: 700 }}>{stats.rareCount}</div>
            <div style={{ color: "#4A5880", fontSize: 11 }}>{lang === 'ja' ? 'レア' : 'Rare'}</div>
          </div>
          <div style={{ flex: 1, padding: "10px 14px", background: "#0A0F26", border: "1px solid #2A3070", borderRadius: 10, textAlign: "center" }}>
            <div style={{ color: "#3AFF8A", fontSize: 22, fontWeight: 700 }}>
              {stats.total > 0 ? Math.round((stats.rareCount / stats.total) * 100) : 0}%
            </div>
            <div style={{ color: "#4A5880", fontSize: 11 }}>{lang === 'ja' ? 'レア率' : 'Rare rate'}</div>
          </div>
        </div>
      )}

      <AuthBadge />
      <UsageBadge remaining={gate.remaining} premium={gate.premium} lang={lang} />
      {gate.blocked && <PaywallModal onClose={gate.dismiss} lang={lang} />}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #182040" }}>
        {['summon', 'zukan'].map((tabKey, i) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{
            flex: 1, padding: "10px", background: "transparent", cursor: "pointer",
            fontFamily: "inherit", fontSize: 14, fontWeight: tab === tabKey ? 600 : 400,
            border: "none", borderBottom: `2px solid ${tab === tabKey ? "#5B7BFF" : "transparent"}`,
            color: tab === tabKey ? "#5B7BFF" : "#4A5880",
            transition: "all 0.15s"
          }}>{i === 0 ? `👾 ${t.tabSummon}` : `📖 ${t.tabZukan}${stats.total > 0 ? ` (${stats.total})` : ''}`}</button>
        ))}
      </div>

      {/* Summon tab */}
      {tab === 'summon' && (
        <>
          <Label>{t.diaryLabel}</Label>
          <TA value={diary} onChange={setDiary} placeholder={t.diaryPlaceholder} rows={5} />

          <div style={{ marginTop: 14 }}>
            <Label>{t.imageLabel}</Label>
            <TA value={vision} onChange={setVision} placeholder={t.imagePlaceholder} rows={2} />
            <div style={{ color: "#2A3870", fontSize: 11, marginTop: 4 }}>{t.imageHint}</div>
          </div>

          <Btn onClick={run} disabled={!diary.trim()} color="#059669" style={{ marginTop: 14 }}>{t.summon}</Btn>
          {loading && <Loading />}

          {/* Rare flash */}
          {newRare && !loading && (
            <div style={{
              marginTop: 12, padding: "10px 16px", background: "#1A1200",
              border: "1px solid #FFD700", borderRadius: 10,
              color: "#FFD700", fontSize: 13, textAlign: "center", fontWeight: 600
            }}>✨ {lang === 'ja' ? 'レアモンスター召喚！図鑑に追加されました' : 'Rare monster summoned! Added to collection!'}
            </div>
          )}

          {res && !loading && (
            <div style={{ marginTop: 16, background: "#0A0F26", borderRadius: 12, border: `1px solid ${newRare ? "#FFD700" : "#2A3070"}`, overflow: "hidden" }}>
              {imgUrl && (
                <div style={{ position: "relative", background: "#050A18", minHeight: imgLoaded ? 0 : 200,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!imgLoaded && <div style={{ color: "#4A5880", fontSize: 13 }}>{t.generating}</div>}
                  <img src={imgUrl} alt="monster" onLoad={() => setImgLoaded(true)}
                    style={{ width: "100%", display: imgLoaded ? "block" : "none", borderRadius: "12px 12px 0 0" }} />
                </div>
              )}
              <div style={{ padding: 20, color: "#C5D0F0", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{res}</div>
              <div style={{ borderTop: `1px solid ${newRare ? "#3A2A00" : "#2A3070"}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#4A5880", fontSize: 11 }}>
                  {lang === 'ja' ? '📖 図鑑に自動追加済み' : '📖 Auto-saved to collection'}
                </div>
                <button onClick={() => share(t.shareTitle, res)} style={{
                  background: "none", border: "1px solid #2A3070", borderRadius: 8,
                  color: "#4A5880", fontSize: 12, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit"
                }}>{t.shareBtn}</button>
              </div>
            </div>
          )}
          <HistoryPanel items={history} onSelect={item => setRes(item.result)} />
        </>
      )}

      {/* Zukan tab */}
      {tab === 'zukan' && (
        <div>
          {zukan.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4A5880", padding: "48px 0", fontSize: 14, whiteSpace: "pre-line" }}>
              👾{"\n"}{t.zukanEmpty}
            </div>
          ) : (
            <>
              <div style={{ color: "#4A5880", fontSize: 12, marginBottom: 14 }}>
                {t.zukanCount(zukan.length)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {zukan.map(m => (
                  <div key={m.id} style={{
                    background: m.rarity === 'rare' ? "#120E00" : "#0A0F26",
                    border: `1px solid ${m.rarity === 'rare' ? "#FFD700" : "#2A3070"}`,
                    borderRadius: 12, overflow: "hidden", cursor: "pointer",
                    transition: "transform 0.15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    onClick={() => { setRes(m.text); setImgUrl(m.imgUrl); setImgLoaded(false); setTab('summon'); }}
                  >
                    {m.imgUrl && (
                      <img src={m.imgUrl} alt={m.name}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <div style={{ color: "#C5D0F0", fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        {m.rarity === 'rare' && (
                          <span style={{ fontSize: 10, color: "#FFD700", background: "#2A1A00", padding: "1px 6px", borderRadius: 8 }}>
                            {t.rareBadge}
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#4A5880", fontSize: 11 }}>{m.type}</div>
                      <div style={{ color: "#2A3870", fontSize: 10, marginTop: 4 }}>{m.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}