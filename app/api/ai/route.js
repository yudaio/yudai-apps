import { rateLimitResponse } from "../../../lib/rate-limit";

// ブラウザから system / messages がそのまま届くので、APIキーを踏み台にされないよう大きさを縛る
const MAX_TOKENS_CAP = 1500;
const MAX_INPUT_CHARS = 20000;
const MAX_MESSAGES = 40;

export async function POST(req) {
  const { system, messages, user, max: rawMax = 700 } = await req.json();
  const msgs = messages ?? [{ role: "user", content: user }];
  const max = Math.min(Math.max(Number(rawMax) || 700, 50), MAX_TOKENS_CAP);

  const validRoles = Array.isArray(msgs) && msgs.length > 0 && msgs.length <= MAX_MESSAGES
    && msgs.every(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
  const inputChars = (typeof system === "string" ? system.length : 0) + (validRoles ? msgs.reduce((n, m) => n + m.content.length, 0) : 0);
  if (!validRoles || (system != null && typeof system !== "string") || inputChars > MAX_INPUT_CHARS) {
    return Response.json({ text: "エラーが発生しました：入力が長すぎるか、形式が正しくありません。" }, { status: 400 });
  }

  const limited = rateLimitResponse(req);
  if (limited) return limited;

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
          model: "claude-sonnet-4-6",
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
      console.error('[/api/ai] Anthropic error:', JSON.stringify(data).slice(0, 200));
    } catch (e) { console.error('[/api/ai] Anthropic error:', e.message); }
  }

  // ── 2. Google Gemini（無料 API キー — aistudio.google.com で取得）──────
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiMsgs = [];
      if (system) geminiMsgs.push({ role: 'user', parts: [{ text: `System: ${system}` }] }, { role: 'model', parts: [{ text: 'OK.' }] });
      msgs.forEach(m => geminiMsgs.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMsgs,
            generationConfig: { maxOutputTokens: max, temperature: 0.85 },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return Response.json({ text });
      console.error('[/api/ai] Gemini error:', JSON.stringify(data).slice(0, 200));
    } catch (e) { console.error('[/api/ai] Gemini error:', e.message); }
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
          model: 'llama-3.3-70b-versatile',
          max_tokens: max,
          messages: groqMsgs,
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return Response.json({ text });
      console.error('[/api/ai] Groq error:', JSON.stringify(data).slice(0, 200));
    } catch (e) { console.error('[/api/ai] Groq error:', e.message); }
  }

  // ── 4. OpenRouter 無料モデル（無料枠あり）─────────────────────────────
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orMsgs = system
        ? [{ role: 'system', content: system }, ...msgs]
        : msgs;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          max_tokens: max,
          messages: orMsgs,
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return Response.json({ text });
      console.error('[/api/ai] OpenRouter error:', JSON.stringify(data).slice(0, 200));
    } catch (e) { console.error('[/api/ai] OpenRouter error:', e.message); }
  }

  // ── 5. Pollinations.ai（最終フォールバック）─────────────────────────────
  const polMessages = system
    ? [{ role: 'system', content: system }, ...msgs]
    : msgs;
  for (let attempt = 0; attempt < 2; attempt++) {
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
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status === 403) {
        if (attempt === 0) await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return Response.json({ text });
    } catch (e) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
    }
  }

  return Response.json({ text: 'エラーが発生しました。もう一度お試しください。' }, { status: 503 });
}
