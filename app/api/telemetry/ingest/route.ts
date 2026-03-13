import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { fail, ok } from '@/lib/server/http'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { ingestTelemetryBatch } from '@/lib/server/solar-service'

const hasIngestSecret = (request: Request) => {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('x-cron-secret') === expected
}

export async function POST(request: Request) {
  try {
    const remoteKey = request.headers.get('x-forwarded-for') ?? 'local'
    if (!checkRateLimit(`ingest:${remoteKey}`, 120, 60_000)) {
      return fail(429, 'Rate limit exceeded')
    }

    if (!hasIngestSecret(request)) {
      await ensureRole('operator')
    }
    const payload = await request.json()
    const result = await ingestTelemetryBatch(payload)
    return ok(result)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fail(400, 'Invalid JSON payload')
    }
    return handleRouteError(error)
  }
}
