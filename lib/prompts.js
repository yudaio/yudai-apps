// サーバー専用。プロンプトはここで組み立て、クライアントからは appId と入力値だけを受け取る。
// クライアントが任意のプロンプトやモデルを送れると、APIキーを第三者に使い放題にされるため。

const text = (max, { required = true } = {}) => ({ max, required })

export const PROMPTS = {
  fate: {
    fields: { name: text(50), worry: text(500) },
    build: ({ name, worry }) => `名前: ${name}\n悩み: ${worry}\n\n以下3セクションでJSON返答(他テキスト不要):\n{"statistical":"統計的傾向の分析150字","psychological":"心理学的考察150字","guidance":"今後の指針150字","fortune":"運勢ひとこと30字"}`,
  },
  muda: {
    premium: true,
    fields: { routine: text(2000) },
    build: ({ routine }) => `ルーティン:\n${routine}\n\n認知負荷研究に基づき分析。JSONのみ返答:\n{"delete":[{"item":"項目","reason":"削除理由"}],"optimize":[{"item":"項目","reason":"最適化方法"}],"keep":[{"item":"項目","reason":"維持理由"}],"summary":"総評100字"}`,
  },
  monster: {
    fields: { diary: text(2000) },
    build: ({ diary }) => `日記:\n${diary}\n\nこの感情からモンスターを召喚。JSONのみ:\n{"name":"モンスター名(日本語)","type":"属性(例:怒火/悲哀/孤独)","description":"外見と雰囲気50字","skills":["スキル名:説明"],"catchphrase":"モンスターの一言30字","rarity":"common|rare|epic|legendary"}`,
  },
  books: {
    fields: { situation: text(1000), genre: text(50, { required: false }) },
    build: ({ situation, genre }) => `状況: ${situation}\nジャンル: ${genre || '問わない'}\n\n今の状況に最適な本を3〜5冊推薦。JSONのみ:\n{"books":[{"title":"書名(日本語)","author":"著者","reason":"なぜ今この本か100字","isbn":"ISBNコード(13桁)","genre":"ジャンル"}]}`,
  },
  rant: {
    fields: { theme: text(500) },
    build: ({ theme }) => `テーマ: ${theme}\n\nこの社会問題・理不尽を3視点で解剖。JSONのみ:\n{"philosophical":"哲学的視点150字","data":"データ的視点150字","human":"人間的視点150字","question":"読者への哲学的問いかけ50字","headline":"見出し30字"}`,
  },
  dream: {
    fields: { dream: text(2000) },
    build: ({ dream }) => `夢の断片:\n${dream}\n\n詩的に記録。JSONのみ:\n{"title":"夢のタイトル20字","prose":"映像詩200字(断片を詩的散文に)","emotion":"感情考察100字","symbol":"夢に現れた象徴の意味50字","imagePrompt":"English image generation prompt for this dream scene"}`,
  },
  review: {
    fields: { asin: text(20, { required: false }), reviews: text(5000) },
    build: ({ asin, reviews }) => `以下のAmazonレビューを分析してください。ASIN: ${asin || '不明'}\n\nレビュー:\n${reviews}\n\n以下のJSONのみ返答（他テキスト不要）:\n{"sentiment_score":0〜100の数値,"positive":["ポジティブ要点を3つ"],"negative":["ネガティブ要点を3つ"],"keywords":["頻出キーワード5つ"],"summary":"総評150字","recommendation":"改善提案100字"}`,
  },
  qa: {
    fields: { product: text(200), q: text(500) },
    build: ({ product, q }) => `Amazon商品「${product}」に対するQ&A回答を生成してください。\n\n質問: ${q}\n\n以下のJSONのみ返答:\n{"answer":"丁寧な回答200字","confidence":0〜100,"tags":["関連タグ2〜3個"]}`,
  },
  return: {
    premium: true,
    fields: { product: text(200), price: text(20, { required: false }), reviews: text(3000, { required: false }), reason: text(500, { required: false }) },
    build: ({ product, price, reviews, reason }) => `Amazon購入の返品リスクを予測してください。\n商品: ${product}\n価格: ${price}円\nレビュー概要: ${reviews}\n購入理由: ${reason}\n\nJSONのみ返答:\n{"return_risk":0〜100,"risk_level":"低/中/高","factors":["リスク要因3つ"],"advice":"購入アドバイス150字","verdict":"一言判定20字"}`,
  },
  redflag: {
    fields: { q: text(200) },
    build: ({ q }) => `Amazon「${q}」の危険な商品・詐欺的商品の見分け方を教えてください。\n\nJSONのみ返答:\n{"danger_score":0〜100,"red_flags":["危険サイン5つ"],"safe_signs":["安全なサイン3つ"],"checklist":["購入前チェック項目4つ"],"verdict":"一言警告または推奨20字"}`,
  },
  travel: {
    premium: true,
    fields: { product: text(200), destination: text(100), style: text(30) },
    build: ({ product, destination, style }) => `Amazon商品「${product}」を持って「${destination}」へ旅行するシナリオを${style}なスタイルで物語化してください。\n\nJSONのみ返答:\n{"title":"物語タイトル30字","narrative":"旅の物語300字","highlight":"この商品が旅を変えた瞬間100字","hashtags":["SNS用ハッシュタグ5つ"]}`,
  },
  life: {
    premium: true,
    fields: { product: text(200), owner: text(50, { required: false }) },
    build: ({ product, owner }) => `Amazon商品「${product}」が所有者「${owner || 'その人'}」と共に過ごす一生を、商品の視点から語る物語を生成してください。\n\nJSONのみ返答:\n{"chapters":[{"title":"章タイトル","content":"内容100字"}],"chapters"は4つ,"epitaph":"商品の墓碑銘30字","bond_score":0〜100}`,
  },
  curiosity: {
    fields: { product: text(200), interests: text(200, { required: false }) },
    build: ({ product, interests }) => `Amazon商品「${product}」を起点に、${interests ? `ユーザーの興味(${interests})と絡めながら` : ''}知的好奇心を刺激する意外なつながりを発見してください。\n\nJSONのみ返答:\n{"connections":[{"title":"つながり30字","domain":"分野","insight":"面白い考察150字","depth":"浅/中/深"}],"connections"は5つ,"rabbit_hole":"最も深掘りすべきトピック50字"}`,
  },
}

// 入力を検証して文字列だけのオブジェクトに揃える。不正なら { error } を返す。
export function validateInput(appId, input) {
  const def = PROMPTS[appId]
  if (!def) return { error: 'unknown app' }
  if (!input || typeof input !== 'object') return { error: 'invalid input' }
  const values = {}
  for (const [key, rule] of Object.entries(def.fields)) {
    const raw = input[key] ?? ''
    if (typeof raw !== 'string' && typeof raw !== 'number') return { error: `${key} must be a string` }
    const v = String(raw).trim()
    if (rule.required && !v) return { error: `${key} is required` }
    if (v.length > rule.max) return { error: `${key} は${rule.max}文字以内にしてください` }
    values[key] = v
  }
  return { values }
}
