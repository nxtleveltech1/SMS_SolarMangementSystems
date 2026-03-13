import { protocolAdapters } from '@/lib/protocols'
import { ingestTelemetryBatch, listDevices, listSites, upsertKpiSnapshot, executeApprovedCommands } from './solar-service'

export const runSimulatorTick = async () => {
  const sites = await listSites()
  const now = new Date()
  let totalPoints = 0

  for (const site of sites) {
    const devices = await listDevices(site.id)
    const baseContext = {
      externalId: site.externalId,
      mode: site.mode,
      capacityKwp: site.capacityKwp,
      devices: devices.map((device) => ({
        externalId: device.externalId,
        type: device.type,
      })),
    }

    const points = protocolAdapters.flatMap((adapter) => adapter.generate(baseContext, now))
    totalPoints += points.length
    await ingestTelemetryBatch({
      source: 'simulator',
      points,
    })
  }

  await executeApprovedCommands()
  return { sites: sites.length, points: totalPoints }
}

export const runKpiRollup = async () => {
  const sites = await listSites()
  for (const site of sites) {
    await upsertKpiSnapshot(site.id, 'day')
    await upsertKpiSnapshot(site.id, 'month')
    await upsertKpiSnapshot(site.id, 'year')
  }
  return { sites: sites.length }
}
