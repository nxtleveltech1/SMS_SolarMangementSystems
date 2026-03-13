import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { fail, ok } from '@/lib/server/http'
import { getSiteSummary } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ siteId: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)
    const summary = await getSiteSummary(siteId)
    if (!summary.site) return fail(404, 'Site not found')
    return ok(summary)
  } catch (error) {
    return handleRouteError(error)
  }
}
