import { fail, ok } from '@/lib/server/http'
import { runSimulatorTick } from '@/lib/server/simulator'

const isAuthorizedCron = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('x-cron-secret') === secret
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return fail(401, 'Unauthorized cron trigger')
  }
  const result = await runSimulatorTick()
  return ok({ ok: true, ...result })
}
