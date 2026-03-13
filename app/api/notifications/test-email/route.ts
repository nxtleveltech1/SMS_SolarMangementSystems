import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { fail, ok } from '@/lib/server/http'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendTestEmail } from '@/lib/server/notifications'

export async function POST(request: Request) {
  try {
    const remoteKey = request.headers.get('x-forwarded-for') ?? 'local'
    if (!checkRateLimit(`test-email:${remoteKey}`, 5, 60_000)) {
      return fail(429, 'Rate limit exceeded')
    }

    await ensureRole('admin')
    const result = await sendTestEmail()
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
