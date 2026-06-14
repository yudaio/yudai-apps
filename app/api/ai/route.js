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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    if (data.error) return Response.json({ text: `エラー: ${data.error.message}` });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'エラーが発生しました。';
    return Response.json({ text });
  }

  // ── Claude（ユーザーキーのみ） ────────────────────────────
  if (claudeKey) {
    const apiKey = claudeKey;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: max, system, messages: msgs }),
    });
    const data = await res.json();
    if (data.error) return Response.json({ text: `エラー: ${data.error.message}` });
    const text = data.content?.[0]?.text ?? 'エラーが発生しました。';
    return Response.json({ text });
  }

  // ── Pollinations.ai（キー不要・完全無料） ──────────────────
  const pollinationsMsgs = system
    ? [{ role: 'system', content: system }, ...msgs]
    : msgs;

  // リトライ付きで Pollinations に接続
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: pollinationsMsgs,
        model: 'openai',
        max_tokens: max,
        private: true,
      }),
    });

    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('"error"')) {
        return Response.json({ text });
      }
    }

    if (res.status === 429) {
      // レート制限: 少し待ってリトライ
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return Response.json({ text: 'ただいまアクセスが集中しています。少し待ってから再度お試しください。' });
    }

    const errText = await res.text().catch(() => '');
    return Response.json({ text: errText && !errText.includes('"error"') ? errText : 'エラーが発生しました。' });
  }
  return Response.json({ text: 'ただいまアクセスが集中しています。少し待ってから再度お試しください。' });
}
