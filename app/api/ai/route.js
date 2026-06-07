export async function POST(req) {
  const { system, user, messages, max = 700, geminiKey } = await req.json();

  // ── Gemini（ユーザー自身のキー） ───────────────────────────
  if (geminiKey) {
    const contents = (messages ?? [{ role: 'user', content: user }]).map(m => ({
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

  // ── Claude（サーバーキー・フォールバック） ─────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ text: 'エラー: APIキーが未設定です。設定画面からGemini APIキーを入力してください。' });
  }
  const msgs = messages ?? [{ role: 'user', content: user }];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
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
