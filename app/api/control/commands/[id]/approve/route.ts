import { ensureRole, ensureSignedIn } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { ok } from '@/lib/server/http'
import { approveControlCommand } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, { params }: Params) {
  try {
    await ensureRole('admin')
    const session = await ensureSignedIn()
    const { id } = await params
    await approveControlCommand(id, session.userId)
    return ok({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
