import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { listDevices } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ siteId: string }>
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { siteId } = await params
    await ensureRole('homeowner', siteId)
    const url = new URL(request.url)
    const type = url.searchParams.get('type') ?? undefined
    const devices = await listDevices(siteId, type)
    return ok({ devices })
  } catch (error) {
    return handleRouteError(error)
  }
}
