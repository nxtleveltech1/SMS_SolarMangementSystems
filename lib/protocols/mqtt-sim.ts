import type { ProtocolAdapter } from './types'

const rand = (min: number, max: number) => Math.random() * (max - min) + min

export const mqttSimAdapter: ProtocolAdapter = {
  protocol: 'mqtt',
  generate: (site, now) => {
    const baseLoad = site.mode === 'enterprise' ? rand(120, 260) : rand(1.2, 4.5)
    const importPower = Math.max(0, baseLoad - rand(0, site.mode === 'enterprise' ? 140 : 5))
    const exportPower = Math.max(0, rand(0, site.mode === 'enterprise' ? 40 : 3) - importPower * 0.1)

    return [
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'meter-1',
        metric: 'load.consumption_kw',
        value: Number(baseLoad.toFixed(2)),
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'mqtt',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'meter-1',
        metric: 'grid.import_kw',
        value: Number(importPower.toFixed(2)),
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'mqtt',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'meter-1',
        metric: 'grid.export_kw',
        value: Number(exportPower.toFixed(2)),
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'mqtt',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'weather-1',
        metric: 'weather.irradiance_wm2',
        value: Number(rand(120, 980).toFixed(2)),
        unit: 'W/m2',
        observedAt: now.toISOString(),
        protocol: 'mqtt',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'weather-1',
        metric: 'weather.temperature_c',
        value: Number(rand(16, 35).toFixed(2)),
        unit: 'C',
        observedAt: now.toISOString(),
        protocol: 'mqtt',
      },
    ]
  },
}
