import type { TelemetryPointInput } from '@/lib/server/types'

export interface AdapterSiteContext {
  externalId: string
  mode: 'residential' | 'enterprise'
  capacityKwp: number
  devices: {
    externalId: string
    type: string
  }[]
}

export interface ProtocolAdapter {
  protocol: 'modbus' | 'mqtt' | 'ocpp'
  generate: (site: AdapterSiteContext, now: Date) => TelemetryPointInput[]
}
