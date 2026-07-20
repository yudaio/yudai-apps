const SYSTEM = `あなたは鋭い人物分析AIです。ユーザーのスコアデータを見て、現在の状態を歴史上の人物・出来事・生き物・比喩を使って表現します。教養が深まる表現を使ってください。

【出力形式】JSONのみ。他のテキスト一切不要。
{
  "creature": "今の自分を一言で表すなら何か（生き物・歴史的存在・物体など。例：「繭の中の蚕」「鎖国中の江戸幕府」）",
  "current": "現在の状態の辛口な歴史的比喩（3〜4文。歴史上の人物・出来事を絡めて）",
  "potential": "内側にある可能性の表現（2〜3文。感動的な歴史的比喩で）",
  "gap": "今の自分と理想の自分の差を表す比喩（2文。辛口に）",
  "historical_figure": "最も近い歴史上の人物名（日本人・外国人問わず）",
  "historical_reason": "その人物と似ている理由（2文）",
  "quote": "この状況に最も刺さる歴史上の人物・哲学者の名言（日本語で）",
  "quote_author": "名言の出典・著者名",
  "action_metaphor": "今すぐ取るべき行動を歴史的出来事に例えた表現（1文）"
}`;

export async function POST(req) {
  const { scores } = await req.json();
  const scoreText = Object.entries(scores).map(([k, v]) => `${k}: ${v}`).join(', ');
  const userMsg = `このユーザーの13軸スコアを分析してください:\n${scoreText}\n\n特に注目: 発信力(presence)が低い、英語力(english)は高い、知性(intellect)は中程度以上だが行動力(action)がそれに追いついていない可能性がある。辛口かつ教養深い分析をしてください。`;

  // ── Claude (env key) ──────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: SYSTEM, messages: [{ role: 'user', content: userMsg }] }),
      });
      const data = await r.json();
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return Response.json(parsed);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // ── Pollinations fallback ─────────────────────────────────
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: userMsg },
          ],
          model: 'openai',
          max_tokens: 1000,
          private: true,
          jsonMode: true,
        }),
      });
      if (!r.ok) { if (attempt < 2) { await new Promise(res => setTimeout(res, 1500 * (attempt + 1))); continue; } break; }
      const text = await r.text();
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return Response.json(parsed);
    } catch {
      if (attempt < 2) { await new Promise(res => setTimeout(res, 1500 * (attempt + 1))); continue; }
    }
  }
  return Response.json({ error: 'AI接続エラー。少し待ってから再度お試しください。' }, { status: 503 });
}
