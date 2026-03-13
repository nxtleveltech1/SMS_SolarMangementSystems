import { auth } from '@clerk/nextjs/server'
import { query } from './db'
import type { AppRole } from './types'

const roleRank: Record<AppRole, number> = {
  homeowner: 1,
  operator: 2,
  admin: 3,
}

const isAuthConfigured = () => {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}

const normalizeRole = (value: unknown): AppRole => {
  if (value === 'admin' || value === 'operator' || value === 'homeowner') {
    return value
  }
  return 'homeowner'
}

const readRoleFromClaims = (claims: unknown): AppRole => {
  if (!claims || typeof claims !== 'object') return 'homeowner'
  const candidate = (claims as Record<string, unknown>).role
    ?? (claims as Record<string, unknown>).publicMetadata
    ?? (claims as Record<string, unknown>).metadata

  if (typeof candidate === 'string') {
    return normalizeRole(candidate)
  }
  if (candidate && typeof candidate === 'object') {
    return normalizeRole((candidate as Record<string, unknown>).role)
  }
  return 'homeowner'
}

export const getSession = async () => {
  if (!isAuthConfigured()) {
    return {
      userId: 'local-dev-user',
      sessionClaims: { role: 'admin' },
    }
  }
  const session = await auth()
  return session
}

export const getCurrentRole = async (siteId?: string): Promise<AppRole> => {
  const session = await getSession()
  const fallbackRole = readRoleFromClaims(session.sessionClaims)

  if (!siteId || !session.userId) {
    return fallbackRole
  }

  const membership = await query<{ role: AppRole }>(
    'SELECT role FROM site_memberships WHERE site_id = $1 AND clerk_user_id = $2 LIMIT 1',
    [siteId, session.userId],
  )

  if (membership.rows[0]?.role) {
    return membership.rows[0].role
  }

  // Auto-onboard: add signed-in user to site as admin when they have no membership
  const hasAnyMembership = await query<{ count: string }>(
    'SELECT count(*)::text FROM site_memberships WHERE clerk_user_id = $1',
    [session.userId],
  )
  if (Number(hasAnyMembership.rows[0]?.count ?? 0) === 0) {
    await query(
      `INSERT INTO site_memberships (site_id, clerk_user_id, role)
       SELECT id, $1, 'admin' FROM sites
       ON CONFLICT (site_id, clerk_user_id) DO NOTHING`,
      [session.userId],
    )
    return 'admin'
  }

  if (isAuthConfigured() && fallbackRole !== 'admin') {
    throw new Error('FORBIDDEN')
  }

  return fallbackRole
}

export const ensureSignedIn = async () => {
  const session = await getSession()
  if (!session.userId) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

export const ensureRole = async (minimumRole: AppRole, siteId?: string) => {
  const session = await ensureSignedIn()
  const role = await getCurrentRole(siteId)

  if (roleRank[role] < roleRank[minimumRole]) {
    throw new Error('FORBIDDEN')
  }

  return { session, role }
}
