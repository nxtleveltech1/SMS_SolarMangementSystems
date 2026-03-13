import { fail, ok } from '@/lib/server/http'
import { query } from '@/lib/server/db'
import { listSites } from '@/lib/server/solar-service'

const isAuthorizedCron = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('x-cron-secret') === secret
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return fail(401, 'Unauthorized cron trigger')
  }

  const now = new Date()
  const sites = await listSites()

  for (const site of sites) {
    for (let hour = 1; hour <= 24; hour++) {
      const forecastTime = new Date(now.getTime() + hour * 60 * 60 * 1000)
      const irradiance = randomBetween(120, 980)
      const expectedGenerationKw = (irradiance / 1000) * site.capacityKwp * 0.8
      await query(
        `
        INSERT INTO weather_forecasts (site_id, forecast_time, irradiance, temperature, cloud_cover, expected_generation_kw)
        VALUES ($1, $2::timestamptz, $3, $4, $5, $6)
      `,
        [
          site.id,
          forecastTime.toISOString(),
          irradiance,
          randomBetween(16, 34),
          randomBetween(5, 85),
          expectedGenerationKw,
        ],
      )
    }
  }

  return ok({ ok: true, sites: sites.length })
}
