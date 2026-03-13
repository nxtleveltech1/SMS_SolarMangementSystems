import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { listKpis } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ siteId: string }>
}

const toRange = (value: string | null): 'day' | 'month' | 'year' => {
  if (value === 'month') return 'month'
  if (value === 'year') return 'year'
  return 'day'
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)
    const url = new URL(request.url)
    const range = toRange(url.searchParams.get('range'))
    const kpis = await listKpis(siteId, range)
    return ok({ range, kpis })
  } catch (error) {
    return handleRouteError(error)
  }
}
