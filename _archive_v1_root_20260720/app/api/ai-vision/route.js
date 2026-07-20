export async function POST(req) {
  const { system, imageBase64, mediaType = "image/jpeg", claudeKey } = await req.json();
  const apiKey = claudeKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ text: "エラー: APIキーが設定されていません。" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: "この顔を分析して、改善ポイントと理想のポートレート生成プロンプトをJSONで返してください。" }
        ]
      }]
    }),
  });

  const data = await res.json();
  if (data.error) return Response.json({ text: `エラー: ${data.error.message}` });
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") ?? "";
  return Response.json({ text });
}
