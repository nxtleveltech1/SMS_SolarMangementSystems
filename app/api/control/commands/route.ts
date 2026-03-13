import { z } from 'zod'
import { ensureRole, ensureSignedIn } from '@/lib/server/auth'
import { validateCommandType } from '@/lib/server/command-validation'
import { handleRouteError } from '@/lib/server/errors'
import { fail, ok } from '@/lib/server/http'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { createControlCommand } from '@/lib/server/solar-service'

const commandSchema = z.object({
  siteId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  commandType: z.string().min(1),
  payload: z.record(z.unknown()),
})

export async function POST(request: Request) {
  try {
    const remoteKey = request.headers.get('x-forwarded-for') ?? 'local'
    if (!checkRateLimit(`control:${remoteKey}`, 30, 60_000)) {
      return fail(429, 'Rate limit exceeded')
    }

    await ensureRole('operator')
    const session = await ensureSignedIn()
    const payload = commandSchema.parse(await request.json())
    if (!validateCommandType(payload.commandType)) {
      return fail(400, 'Unsupported command type')
    }
    const command = await createControlCommand({
      siteId: payload.siteId,
      deviceId: payload.deviceId,
      commandType: payload.commandType,
      payload: payload.payload,
      requestedBy: session.userId,
    })
    return ok({ command })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fail(400, 'Invalid JSON payload')
    }
    return handleRouteError(error)
  }
}
