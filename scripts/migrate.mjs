import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const migrationsDir = path.resolve(__dirname, '../database/migrations')

async function loadEnv() {
  if (process.env.DATABASE_URL) return
  for (const name of ['.env', '.env.local']) {
    try {
      const raw = await fs.readFile(path.join(rootDir, name), 'utf-8')
      for (const line of raw.split('\n')) {
        const i = line.indexOf('=')
        if (i <= 0) continue
        const key = line.slice(0, i).trim()
        const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
        if (key && !process.env[key]) process.env[key] = value
      }
    } catch {
      /* ignore */
    }
  }
}

await loadEnv()
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations. Set it in .env or .env.local (see .env.example).')
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
})

const run = async () => {
  const client = await pool.connect()
  try {
    const files = (await fs.readdir(migrationsDir))
      .filter((name) => name.endsWith('.sql'))
      .sort()

    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const applied = await client.query('SELECT id FROM schema_migrations')
    const appliedIds = new Set(applied.rows.map((row) => row.id))

    for (const file of files) {
      if (appliedIds.has(file)) {
        continue
      }
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file])
      console.log(`Applied migration: ${file}`)
    }

    await client.query('COMMIT')
    console.log('Migration run complete')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
