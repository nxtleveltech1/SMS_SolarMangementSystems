import type { ProtocolAdapter } from './types'

const rand = (min: number, max: number) => Math.random() * (max - min) + min

export const modbusSimAdapter: ProtocolAdapter = {
  protocol: 'modbus',
  generate: (site, now) => {
    const hour = now.getHours() + now.getMinutes() / 60
    const solarFactor = hour < 6 || hour > 19 ? 0 : Math.max(0, 1 - Math.abs(hour - 12.5) / 7)
    const solar = Number((site.capacityKwp * solarFactor * rand(0.75, 0.98)).toFixed(2))
    const batteryPower = Number((solar > site.capacityKwp * 0.3 ? rand(0.4, 3.5) : -rand(0.2, 2.8)).toFixed(2))
    const soc = Number(rand(15, 96).toFixed(1))

    return [
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'inv-1',
        metric: 'solar.generation_kw',
        value: solar,
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'modbus',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'inv-1',
        metric: 'inverter.temperature_c',
        value: Number(rand(34, 68).toFixed(2)),
        unit: 'C',
        observedAt: now.toISOString(),
        protocol: 'modbus',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'bat-1',
        metric: 'battery.power_kw',
        value: batteryPower,
        unit: 'kW',
        observedAt: now.toISOString(),
        protocol: 'modbus',
      },
      {
        siteExternalId: site.externalId,
        deviceExternalId: 'bat-1',
        metric: 'battery.soc_pct',
        value: soc,
        unit: '%',
        observedAt: now.toISOString(),
        protocol: 'modbus',
      },
    ]
  },
}
