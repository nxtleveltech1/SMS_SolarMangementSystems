import { Pool, type QueryResultRow } from 'pg'

declare global {
  var __solarPool: Pool | undefined
}

const databaseUrl = process.env.DATABASE_URL

const createPool = () => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
  })
}

export const getPool = () => {
  if (!global.__solarPool) {
    global.__solarPool = createPool()
  }
  return global.__solarPool
}

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) => {
  const pool = getPool()
  return pool.query<T>(text, params)
}

export const ensureMonthlyTelemetryPartition = async (date: Date) => {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const start = `${year}-${month}-01T00:00:00.000Z`
  const nextDate = new Date(Date.UTC(year, date.getUTCMonth() + 1, 1))
  const end = nextDate.toISOString()
  const partitionName = `telemetry_events_${year}_${month}`

  await query(`
    CREATE TABLE IF NOT EXISTS ${partitionName}
    PARTITION OF telemetry_events
    FOR VALUES FROM ('${start}') TO ('${end}')
  `)
}
