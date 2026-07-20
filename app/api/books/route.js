// /api/books — Google Books API連携 + Claude推薦（フォールバック付き）
export async function POST(req) {
  const { input, lang } = await req.json();

  // Step1: Claudeに検索クエリ＋直接推薦を同時生成
  const step1Prompt = lang === 'en'
    ? `The user wrote: "${input}"

Do two things:
1. Extract 2-3 English search keywords for Google Books API. Output on first line as: KEYWORDS: <keywords>
2. Recommend ONE specific real book for this person. Output as:
[Title] Book title (Author Name)
[Why this book, right now] 3-4 sentences, deeply personal and poetic, addressing their specific situation
[The heart of this book] 1-2 sentences
[After you read it] 1 sentence`
    : `ユーザーの入力：「${input}」

以下の2つを行ってください：
1. Google Books APIで検索するための日本語または英語キーワード2〜3語を最初の行に出力。形式: KEYWORDS: <キーワード>
2. このユーザーに最もふさわしい実在する本を1冊推薦してください：
【書名】書名（著者名）
【なぜ今この本なのか】3〜4文、ユーザーの状況に深く寄り添い詩的に
【この本の核心】1〜2文
【読んだ後のあなたへ】1文

ユーザーの状況に具体的に言及し、絶対に実在する書籍を推薦すること。`;

  const step1Res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      messages: [{ role: "user", content: step1Prompt }],
    }),
  });

  const step1Data = await step1Res.json();
  const step1Text = step1Data.content?.[0]?.text?.trim() || '';

  // キーワードとClaudeの推薦文を分離
  const keywordsMatch = step1Text.match(/KEYWORDS:\s*(.+)/);
  const searchQuery = keywordsMatch?.[1]?.trim() || input.slice(0, 30);
  const claudeExplanation = step1Text.replace(/KEYWORDS:.+\n?/, '').trim();

  // Claudeの推薦文から書名を抽出
  const titleKey = lang === 'en' ? /\[Title\]([^\n]+)/ : /【書名】([^\n]+)/;
  const titleRaw = claudeExplanation.match(titleKey)?.[1]?.trim() || '';
  const authorInTitle = titleRaw.match(/[（(]([^）)]+)[）)]/)?.[1] || '';
  const bookTitleOnly = titleRaw.replace(/[（(][^）)]+[）)]/, '').trim();

  // Step2: Claudeの書名でGoogle Booksを検索（最優先）
  let selectedBook = null;

  const searchAttempts = [
    bookTitleOnly,           // Claudeが推薦した書名で検索
    searchQuery,             // キーワードで検索
  ].filter(Boolean);

  for (const query of searchAttempts) {
    if (selectedBook) break;
    try {
      const langRestrict = lang === 'ja' ? '&langRestrict=ja' : '';
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&orderBy=relevance${langRestrict}${process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : ''}`;
      const gbRes = await fetch(gbUrl, { signal: AbortSignal.timeout(6000) });
      const gbData = await gbRes.json();
      const books = (gbData.items || []).filter(b => b.volumeInfo?.title);

      if (books.length > 0) {
        const best = books[0];
        selectedBook = {
          title: best.volumeInfo?.title || bookTitleOnly,
          authors: best.volumeInfo?.authors?.join(', ') || authorInTitle,
          thumbnail: best.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
          rating: best.volumeInfo?.averageRating || null,
          ratingsCount: best.volumeInfo?.ratingsCount || 0,
          publishedDate: best.volumeInfo?.publishedDate || '',
          pageCount: best.volumeInfo?.pageCount || null,
        };
      }
    } catch (e) { /* タイムアウト等はスキップ */ }
  }

  // Step3: Google Booksが完全に失敗してもClaudeの情報で表示
  if (!selectedBook) {
    selectedBook = {
      title: bookTitleOnly || (lang === 'ja' ? '推薦書籍' : 'Recommended Book'),
      authors: authorInTitle,
      thumbnail: '',
      rating: null,
      ratingsCount: 0,
      publishedDate: '',
      pageCount: null,
    };
  }

  return Response.json({
    book: selectedBook,
    explanation: claudeExplanation,
    searchQuery,
  });
}
