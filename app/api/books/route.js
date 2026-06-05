// /api/books — Google Books API連携 + Claude推薦
export async function POST(req) {
  const { input, lang } = await req.json();

  // Step1: Claudeに検索クエリを生成させる
  const queryPrompt = lang === 'en'
    ? `The user wrote: "${input}"
Extract 2-3 English search keywords for Google Books API to find the most fitting book.
Output ONLY the search query string, nothing else. Example: "existential philosophy loss identity"`
    : `ユーザーの入力：「${input}」
この感情・状況に最もふさわしい本をGoogle Books APIで検索するための
日本語または英語の検索キーワードを2〜3語で出力してください。
キーワードのみ出力。例：「喪失 哲学 自己再生」`;

  const queryRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [{ role: "user", content: queryPrompt }],
    }),
  });
  const queryData = await queryRes.json();
  const searchQuery = queryData.content?.[0]?.text?.trim() || input.slice(0, 30);

  // Step2: Google Books APIで実在する本を検索
  const langRestrict = lang === 'ja' ? '&langRestrict=ja' : '';
  const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5&orderBy=relevance${langRestrict}${process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : ''}`;

  const gbRes = await fetch(gbUrl);
  const gbData = await gbRes.json();
  const books = (gbData.items || []).map(item => ({
    id: item.id,
    title: item.volumeInfo?.title || '',
    authors: item.volumeInfo?.authors?.join(', ') || '',
    description: item.volumeInfo?.description?.slice(0, 200) || '',
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
    rating: item.volumeInfo?.averageRating || null,
    ratingsCount: item.volumeInfo?.ratingsCount || 0,
    publishedDate: item.volumeInfo?.publishedDate || '',
    pageCount: item.volumeInfo?.pageCount || null,
    infoLink: item.volumeInfo?.infoLink || '',
  }));

  if (books.length === 0) {
    return Response.json({ error: 'no_books', searchQuery });
  }

  // Step3: Claudeに最適な1冊を選ばせて詩的な説明を生成
  const bookList = books.map((b, i) =>
    `${i + 1}. 「${b.title}」 著者: ${b.authors}\n概要: ${b.description}`
  ).join('\n\n');

  const recPrompt = lang === 'en'
    ? `The user wrote: "${input}"

Here are ${books.length} books from Google Books:
${bookList}

Choose the single best book for this user and output:
[Index] (1-${books.length})
[Why this book, right now] 3-4 sentences, deeply personal and poetic
[The heart of this book] 1-2 sentences
[After you read it] 1 sentence

Write only these 4 sections. Be specific to the user's situation.`
    : `ユーザーの入力：「${input}」

Google Booksから取得した${books.length}冊：
${bookList}

このユーザーに最もふさわしい1冊を選び、以下を出力：
【選択】番号（1〜${books.length}）
【なぜ今この本なのか】3〜4文、ユーザーの状況に寄り添い詩的に
【この本の核心】1〜2文
【読んだ後のあなたへ】1文

この4セクションのみ出力。ユーザーの状況に具体的に言及すること。`;

  const recRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: recPrompt }],
    }),
  });
  const recData = await recRes.json();
  const explanation = recData.content?.[0]?.text?.trim() || '';

  // 選ばれた本のインデックスを抽出
  const indexMatch = explanation.match(/【選択】(\d+)|\[Index\]\s*(\d+)/);
  const selectedIndex = indexMatch ? (parseInt(indexMatch[1] || indexMatch[2]) - 1) : 0;
  const selectedBook = books[Math.min(selectedIndex, books.length - 1)];

  return Response.json({
    book: selectedBook,
    explanation,
    searchQuery,
  });
}
