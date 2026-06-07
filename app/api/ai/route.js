export async function POST(req) {
  const { system, user, messages, max = 700 } = await req.json();
  const msgs = messages ?? [{ role: "user", content: user }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: max,
      system,
      messages: msgs,
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.error("Anthropic error:", JSON.stringify(data.error));
    return Response.json({ text: `エラー: ${data.error.message}` });
  }
  const text = data.content?.[0]?.text ?? "エラーが発生しました。";
  return Response.json({ text });
}
