import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed data')
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
})

const run = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orgRes = await client.query(
      `
      INSERT INTO organizations (name)
      VALUES ('SolarFlow Org')
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    )

    const orgId = orgRes.rows[0]?.id
      ?? (await client.query(`SELECT id FROM organizations LIMIT 1`)).rows[0].id

    const siteRows = await client.query(
      `
      INSERT INTO sites (organization_id, external_id, name, mode, timezone, address, capacity_kwp)
      VALUES
        ($1, 'home-alpha', 'Home Solar Alpha', 'residential', 'Africa/Johannesburg', '456 Sunshine Lane', 10),
        ($1, 'plant-omega', 'Plant Omega', 'enterprise', 'Africa/Johannesburg', '123 Industrial Blvd', 500)
      ON CONFLICT (external_id) DO UPDATE
        SET name = excluded.name
      RETURNING id, external_id
    `,
      [orgId],
    )

    for (const site of siteRows.rows) {
      await client.query(
        `
        INSERT INTO devices (site_id, external_id, name, device_type, protocol, status, metadata)
        VALUES
          ($1, 'inv-1', 'Main Inverter', 'inverter', 'modbus', 'online', '{"model":"SE5000H"}'),
          ($1, 'bat-1', 'Battery Bank', 'battery', 'modbus', 'online', '{"capacity_kwh":13.5}'),
          ($1, 'meter-1', 'Grid Meter', 'meter', 'mqtt', 'online', '{}'),
          ($1, 'ev-1', 'EV Charger', 'ev_charger', 'ocpp', 'online', '{}'),
          ($1, 'weather-1', 'Weather Station', 'weather', 'mqtt', 'online', '{}')
        ON CONFLICT (site_id, external_id) DO NOTHING
      `,
        [site.id],
      )

      await client.query(
        `
        INSERT INTO site_memberships (site_id, clerk_user_id, role)
        VALUES
          ($1, 'local-dev-user', 'admin'),
          ($1, 'operator-demo', 'operator'),
          ($1, 'homeowner-demo', 'homeowner')
        ON CONFLICT (site_id, clerk_user_id) DO NOTHING
      `,
        [site.id],
      )
    }

    await client.query('COMMIT')
    console.log('Seed complete')
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
