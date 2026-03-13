import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { getTimeseries } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ siteId: string }>
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)

    const url = new URL(request.url)
    const now = new Date()
    const from = url.searchParams.get('from') ?? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const to = url.searchParams.get('to') ?? now.toISOString()
    const interval = url.searchParams.get('interval') ?? '1h'

    const data = await getTimeseries(siteId, from, to, interval)
    return ok({ points: data })
  } catch (error) {
    return handleRouteError(error)
  }
}
