export async function POST(req) {
  const { system, user, messages, max = 700, geminiKey, claudeKey } = await req.json();
  const msgs = messages ?? [{ role: 'user', content: user }];

  // ── Gemini（ユーザーキー） ─────────────────────────────────
  if (geminiKey) {
    const contents = msgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const body = { contents, generationConfig: { maxOutputTokens: max } };
    if (system) body.system_instruction = { parts: [{ text: system }] };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    if (data.error) {
      console.error('Gemini error:', JSON.stringify(data.error));
      return Response.json({ text: `エラー: ${data.error.message}` });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'エラーが発生しました。';
    return Response.json({ text });
  }

  // ── Claude（ユーザーキー or サーバーキー） ─────────────────
  const apiKey = claudeKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ text: 'エラー: APIキーが未設定です。設定画面からAPIキーを入力してください。' });
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: max, system, messages: msgs }),
  });
  const data = await res.json();
  if (data.error) {
    console.error('Anthropic error:', JSON.stringify(data.error));
    return Response.json({ text: `エラー: ${data.error.message}` });
  }
  const text = data.content?.[0]?.text ?? 'エラーが発生しました。';
  return Response.json({ text });
}
