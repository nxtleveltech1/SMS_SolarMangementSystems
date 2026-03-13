import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { listAlerts } from '@/lib/server/solar-service'
import type { AlertStatus } from '@/lib/server/types'

interface Params {
  params: Promise<{ siteId: string }>
}

const toAlertStatus = (value: string | null): AlertStatus | undefined => {
  if (value === 'open' || value === 'acknowledged' || value === 'resolved') {
    return value
  }
  return undefined
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)
    const url = new URL(request.url)
    const status = toAlertStatus(url.searchParams.get('status'))
    const alerts = await listAlerts(siteId, status)
    return ok({ alerts })
  } catch (error) {
    return handleRouteError(error)
  }
}
