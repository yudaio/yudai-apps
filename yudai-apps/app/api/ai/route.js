export async function POST(req) {
  const { system, messages, user, max = 700 } = await req.json();
  const msgs = messages ?? [{ role: "user", content: user }];

  // ── 1. Anthropic Claude（残高があれば最優先）────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: max,
          system,
          messages: msgs,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (data.content?.[0]?.text) {
        return Response.json({ text: data.content[0].text });
      }
    } catch { /* fall through */ }
  }

  // ── 2. Google Gemini（無料 API キー — aistudio.google.com で取得）──────
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiMsgs = [];
      if (system) geminiMsgs.push({ role: 'user', parts: [{ text: `System: ${system}` }] }, { role: 'model', parts: [{ text: 'OK.' }] });
      msgs.forEach(m => geminiMsgs.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMsgs,
            generationConfig: { maxOutputTokens: max, temperature: 0.8 },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return Response.json({ text });
      console.error('[/api/ai] Gemini error:', JSON.stringify(data).slice(0, 200));
    } catch (e) {
      console.error('[/api/ai] Gemini fetch error:', e.message);
    }
  }

  // ── 3. Groq（無料 — console.groq.com で取得）────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const groqMsgs = system
        ? [{ role: 'system', content: system }, ...msgs]
        : msgs;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: max,
          messages: groqMsgs,
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return Response.json({ text });
      console.error('[/api/ai] Groq error:', JSON.stringify(data).slice(0, 200));
    } catch (e) {
      console.error('[/api/ai] Groq fetch error:', e.message);
    }
  }

  // ── 4. Pollinations.ai（最終フォールバック・レート制限あり）──────────────
  const polMessages = system
    ? [{ role: 'system', content: system }, ...msgs]
    : msgs;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: polMessages,
          max_tokens: max,
          temperature: 0.8,
          seed: Math.floor(Math.random() * 9999),
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return Response.json({ text });
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }

  return Response.json({ text: 'エラーが発生しました。もう一度お試しください。' });
}
