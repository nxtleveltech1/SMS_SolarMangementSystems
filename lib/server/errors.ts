import { fail } from './http'

export const handleRouteError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return fail(401, 'Unauthorized')
    if (error.message === 'FORBIDDEN') return fail(403, 'Forbidden')
    if (error.message.includes('DATABASE_URL')) return fail(500, 'Database configuration missing')
    return fail(400, error.message)
  }
  return fail(500, 'Unexpected error')
}
