import type { ProtocolAdapter } from './types'

const rand = (min: number, max: number) => Math.random() * (max - min) + min

export const ocppSimAdapter: ProtocolAdapter = {
  protocol: 'ocpp',
  generate: (site, now) => {
    const isCharging = Math.random() > 0.45
    const chargingPower = isCharging ? rand(2.5, site.mode === 'enterprise' ? 22 : 11) : 0
    return [
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'ev-1',
        metric: 'ev.charging_kw',
        value: Number(chargingPower.toFixed(2)),
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'ocpp',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'ev-1',
        metric: 'ev.session_energy_kwh',
        value: Number(rand(0, 30).toFixed(2)),
        unit: 'kWh',
        observedAt: now.toISOString(),
        protocol: 'ocpp',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'ev-1',
        metric: 'ev.vehicle_soc_pct',
        value: Number(rand(20, 96).toFixed(1)),
        unit: '%',
        observedAt: now.toISOString(),
        protocol: 'ocpp',
      },
    ]
  },
}
