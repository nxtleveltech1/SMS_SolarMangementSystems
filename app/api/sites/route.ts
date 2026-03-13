import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { listSites } from '@/lib/server/solar-service'

export async function GET() {
  try {
    await ensureRole('homeowner')
    const sites = await listSites()
    return ok({ sites })
  } catch (error) {
    return handleRouteError(error)
  }
}
