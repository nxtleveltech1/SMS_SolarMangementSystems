import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { getRealtime } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ siteId: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)
    const realtime = await getRealtime(siteId)
    return ok(realtime)
  } catch (error) {
    return handleRouteError(error)
  }
}
