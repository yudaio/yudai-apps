import Anthropic from '@anthropic-ai/sdk'
import { PROMPTS, validateInput } from '../../../lib/prompts'
import { checkRateLimit } from '../../../lib/rate-limit'

const client = new Anthropic()
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const { appId, input } = body || {}
  if (!PROMPTS[appId]) return Response.json({ error: 'unknown app' }, { status: 400 })

  const { values, error } = validateInput(appId, input)
  if (error) return Response.json({ error }, { status: 400 })

  const limited = checkRateLimit(clientIp(req))
  if (limited) {
    return Response.json({ error: limited.message }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } })
  }

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content: PROMPTS[appId].build(values) }],
    })
    if (response.stop_reason === 'refusal') {
      return Response.json({ error: 'この内容には回答できませんでした。表現を変えて試してください。' }, { status: 422 })
    }
    const text = response.content.find(b => b.type === 'text')?.text ?? ''
    return Response.json({ text })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ error: '混み合っています。少し待ってから試してください。' }, { status: 503 })
    }
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status, e.message)
      return Response.json({ error: 'AIの呼び出しに失敗しました。' }, { status: 502 })
    }
    throw e
  }
}
