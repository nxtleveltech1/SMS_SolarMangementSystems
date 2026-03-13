import { ensureRole } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/errors'
import { fail, ok } from '@/lib/server/http'
import { getControlCommand } from '@/lib/server/solar-service'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    await ensureRole('operator')
    const { id } = await params
    const command = await getControlCommand(id)
    if (!command) return fail(404, 'Command not found')
    return ok({ command })
  } catch (error) {
    return handleRouteError(error)
  }
}
