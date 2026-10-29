// プロセス内メモリのレート制限。サーバーレスではインスタンスごとに数えるので上限は目安。
// 確実に止めるのは AI_DAILY_LIMIT と Anthropic コンソール側の利用上限の組み合わせ。

const PER_MINUTE = Number(process.env.AI_PER_MINUTE_LIMIT || 6)
const PER_DAY_PER_IP = Number(process.env.AI_PER_IP_DAILY_LIMIT || 60)
const DAILY = Number(process.env.AI_DAILY_LIMIT || 1000)

const hits = new Map() // ip -> number[]（直近24時間の呼び出し時刻）
let day = { key: '', count: 0 }

export function checkRateLimit(ip, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10)
  if (day.key !== today) day = { key: today, count: 0 }
  if (day.count >= DAILY) {
    return { message: '本日の利用上限に達しました。明日また使ってください。', retryAfter: 3600 }
  }

  const recent = (hits.get(ip) || []).filter(t => now - t < 86_400_000)
  if (recent.length >= PER_DAY_PER_IP) {
    return { message: '本日の利用回数の上限に達しました。明日また使ってください。', retryAfter: 3600 }
  }
  if (recent.filter(t => now - t < 60_000).length >= PER_MINUTE) {
    return { message: '短時間に使いすぎています。1分ほど待ってください。', retryAfter: 60 }
  }

  recent.push(now)
  hits.set(ip, recent)
  day.count++
  if (hits.size > 10_000) hits.delete(hits.keys().next().value)
  return null
}

export function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

// 上限に達していれば 429 の Response を、そうでなければ null を返す
export function rateLimitResponse(req) {
  const limited = checkRateLimit(clientIp(req))
  if (!limited) return null
  return Response.json(
    { text: `エラーが発生しました：${limited.message}`, error: limited.message },
    { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
  )
}
