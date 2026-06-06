export async function POST(req) {
  const { system, messages, user, max = 700 } = await req.json();
  const msgs = messages ?? [{ role: "user", content: user }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: max,
      system,
      messages: msgs,
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "エラーが発生しました。";
  return Response.json({ text });
}
