export type AppRole = 'homeowner' | 'operator' | 'admin'

export type AlertStatus = 'open' | 'acknowledged' | 'resolved'
export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface ApiErrorPayload {
  error: string
  details?: unknown
}

export interface SiteRecord {
  id: string
  external_id: string
  name: string
  mode: 'residential' | 'enterprise'
  capacity_kwp: number
  status: string
}

export interface TelemetryPointInput {
  siteExternalId: string
  deviceExternalId?: string
  metric: string
  value: number
  unit: string
  observedAt: string
  protocol: 'modbus' | 'mqtt' | 'ocpp' | 'internal'
  quality?: 'good' | 'estimated'
  payload?: Record<string, unknown>
}
