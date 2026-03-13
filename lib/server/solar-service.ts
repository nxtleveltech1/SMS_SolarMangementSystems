import { z } from 'zod'
import { ensureMonthlyTelemetryPartition, query } from './db'
import { calculatePerformanceRatio, calculateSelfConsumption, calculateSelfSufficiency } from './analytics-utils'
import type { AlertSeverity, AlertStatus, TelemetryPointInput } from './types'

const telemetryPointSchema = z.object({
  siteExternalId: z.string().min(1),
  deviceExternalId: z.string().min(1).optional(),
  metric: z.string().min(1),
  value: z.number().finite(),
  unit: z.string().min(1),
  observedAt: z.string().datetime(),
  protocol: z.enum(['modbus', 'mqtt', 'ocpp', 'internal']),
  quality: z.enum(['good', 'estimated']).optional(),
  payload: z.record(z.unknown()).optional(),
})

const telemetryBatchSchema = z.object({
  source: z.string().min(1),
  points: z.array(telemetryPointSchema).min(1),
})

type TelemetryBatchInput = z.infer<typeof telemetryBatchSchema>

type SiteRow = {
  id: string
  external_id: string
  name: string
  mode: 'residential' | 'enterprise'
  capacity_kwp: string
  status: string
}

type RealtimeMetricRow = {
  metric: string
  value: string
  unit: string
  observed_at: string
}

type AlertRow = {
  id: string
  site_id: string
  device_id: string | null
  type: string
  severity: AlertSeverity
  title: string
  message: string
  status: AlertStatus
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
}

const dedupeKey = (point: TelemetryPointInput) => {
  return [
    point.protocol,
    point.siteExternalId,
    point.deviceExternalId || '-',
    point.metric,
    point.observedAt,
  ].join('|')
}

const maybeCreateAlert = async (siteId: string, point: TelemetryPointInput) => {
  const metric = point.metric
  const value = point.value

  let type: string | null = null
  let severity: AlertSeverity = 'info'
  let title = ''
  let message = ''

  if (metric === 'battery.soc_pct' && value < 15) {
    type = 'low_battery'
    severity = value < 10 ? 'critical' : 'warning'
    title = 'Low Battery State of Charge'
    message = `Battery SOC dropped to ${value.toFixed(1)}%`
  } else if (metric === 'inverter.temperature_c' && value > 65) {
    type = 'high_temperature'
    severity = 'warning'
    title = 'Inverter Temperature High'
    message = `Inverter temperature is ${value.toFixed(1)}C`
  } else if (metric === 'inverter.status' && value === 0) {
    type = 'inverter_fault'
    severity = 'critical'
    title = 'Inverter Offline'
    message = 'Inverter status reported offline'
  } else if (metric === 'solar.performance_ratio_pct' && value < 80) {
    type = 'efficiency_drop'
    severity = 'warning'
    title = 'Performance Ratio Drop'
    message = `Performance ratio is ${value.toFixed(1)}%`
  }

  if (!type) return

  const existing = await query<{ id: string }>(
    `
    SELECT id
    FROM alerts
    WHERE site_id = $1
      AND type = $2
      AND status IN ('open', 'acknowledged')
      AND created_at > now() - interval '6 hours'
    LIMIT 1
  `,
    [siteId, type],
  )

  if (existing.rowCount && existing.rowCount > 0) return

  await query(
    `
    INSERT INTO alerts (site_id, type, severity, title, message, status)
    VALUES ($1, $2, $3, $4, $5, 'open')
  `,
    [siteId, type, severity, title, message],
  )
}

export const ingestTelemetryBatch = async (rawInput: unknown) => {
  const input = telemetryBatchSchema.parse(rawInput)
  const bySite = new Map<string, TelemetryPointInput[]>()

  for (const point of input.points) {
    const bucket = bySite.get(point.siteExternalId) ?? []
    bucket.push(point)
    bySite.set(point.siteExternalId, bucket)
  }

  let inserted = 0

  for (const [siteExternalId, points] of bySite) {
    const siteResult = await query<{ id: string }>(
      'SELECT id FROM sites WHERE external_id = $1 LIMIT 1',
      [siteExternalId],
    )
    const siteId = siteResult.rows[0]?.id
    if (!siteId) continue

    for (const point of points) {
      const observedAt = new Date(point.observedAt)
      await ensureMonthlyTelemetryPartition(observedAt)

      let deviceId: string | null = null
      if (point.deviceExternalId) {
        const deviceResult = await query<{ id: string }>(
          'SELECT id FROM devices WHERE site_id = $1 AND external_id = $2 LIMIT 1',
          [siteId, point.deviceExternalId],
        )
        deviceId = deviceResult.rows[0]?.id ?? null
      }

      const result = await query(
        `
        INSERT INTO telemetry_events (
          site_id, device_id, metric, value, unit, quality, observed_at, source_protocol, dedupe_key, payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10::jsonb)
        ON CONFLICT (site_id, dedupe_key, observed_at) DO NOTHING
        RETURNING id
      `,
        [
          siteId,
          deviceId,
          point.metric,
          point.value,
          point.unit,
          point.quality ?? 'good',
          point.observedAt,
          point.protocol,
          dedupeKey(point),
          JSON.stringify(point.payload ?? {}),
        ],
      )

      if (result.rowCount && result.rowCount > 0) {
        inserted += 1
        await maybeCreateAlert(siteId, point)
      }
    }
  }

  return {
    source: input.source,
    accepted: input.points.length,
    inserted,
    duplicates: input.points.length - inserted,
  }
}

export const listSites = async () => {
  const rows = await query<SiteRow>(
    'SELECT id, external_id, name, mode, capacity_kwp, status FROM sites ORDER BY name ASC',
  )
  return rows.rows.map((row) => ({
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    mode: row.mode,
    capacityKwp: Number(row.capacity_kwp),
    status: row.status,
  }))
}

export const getSiteSummary = async (siteId: string) => {
  const site = await query<SiteRow>(
    'SELECT id, external_id, name, mode, capacity_kwp, status FROM sites WHERE id = $1 LIMIT 1',
    [siteId],
  )
  const devices = await query<{ count: string; device_type: string }>(
    'SELECT device_type, count(*)::text AS count FROM devices WHERE site_id = $1 GROUP BY device_type',
    [siteId],
  )
  return {
    site: site.rows[0] ? {
      id: site.rows[0].id,
      externalId: site.rows[0].external_id,
      name: site.rows[0].name,
      mode: site.rows[0].mode,
      capacityKwp: Number(site.rows[0].capacity_kwp),
      status: site.rows[0].status,
    } : null,
    devices: devices.rows.map((row) => ({
      type: row.device_type,
      count: Number(row.count),
    })),
  }
}

export const getRealtime = async (siteId: string) => {
  const rows = await query<RealtimeMetricRow>(
    `
    SELECT DISTINCT ON (metric)
      metric, value::text, unit, observed_at::text
    FROM telemetry_events
    WHERE site_id = $1
    ORDER BY metric, observed_at DESC
  `,
    [siteId],
  )

  const metricMap = new Map(rows.rows.map((row) => [row.metric, row]))
  const get = (metric: string, fallback = 0) => Number(metricMap.get(metric)?.value ?? fallback)

  return {
    solarGeneration: get('solar.generation_kw'),
    batteryPower: get('battery.power_kw'),
    gridPower: get('grid.import_kw') - get('grid.export_kw'),
    loadConsumption: get('load.consumption_kw'),
    batteryLevel: get('battery.soc_pct', 50),
    irradiance: get('weather.irradiance_wm2'),
    ambientTemperature: get('weather.temperature_c', 24),
    evChargingPower: get('ev.charging_kw'),
    lastUpdatedAt: rows.rows[0]?.observed_at ?? new Date().toISOString(),
  }
}

const intervalExpression = (interval: string) => {
  switch (interval) {
    case '15m':
      return "date_bin('15 minutes', observed_at, TIMESTAMPTZ '2001-01-01')"
    case '1d':
      return "date_trunc('day', observed_at)"
    case '1h':
    default:
      return "date_trunc('hour', observed_at)"
  }
}

export const getTimeseries = async (
  siteId: string,
  from: string,
  to: string,
  interval = '1h',
) => {
  const bucketExpr = intervalExpression(interval)
  const rows = await query<{
    bucket: string
    metric: string
    avg_value: string
  }>(
    `
    SELECT
      ${bucketExpr} AS bucket,
      metric,
      avg(value)::text AS avg_value
    FROM telemetry_events
    WHERE site_id = $1
      AND observed_at >= $2::timestamptz
      AND observed_at <= $3::timestamptz
      AND metric IN ('solar.generation_kw', 'battery.power_kw', 'grid.import_kw', 'grid.export_kw', 'load.consumption_kw')
    GROUP BY ${bucketExpr}, metric
    ORDER BY bucket ASC
  `,
    [siteId, from, to],
  )

  const grouped = new Map<string, Record<string, number>>()
  for (const row of rows.rows) {
    const key = row.bucket
    const entry = grouped.get(key) ?? {
      solar: 0,
      battery: 0,
      grid: 0,
      load: 0,
    }
    const value = Number(row.avg_value)
    if (row.metric === 'solar.generation_kw') entry.solar = value
    if (row.metric === 'battery.power_kw') entry.battery = value
    if (row.metric === 'grid.import_kw') entry.grid += value
    if (row.metric === 'grid.export_kw') entry.grid -= value
    if (row.metric === 'load.consumption_kw') entry.load = value
    grouped.set(key, entry)
  }

  return [...grouped.entries()].map(([bucket, value]) => ({
    time: new Date(bucket).toISOString(),
    ...value,
  }))
}

export const listDevices = async (siteId: string, type?: string) => {
  const rows = await query<{
    id: string
    external_id: string
    name: string
    device_type: string
    protocol: string
    status: string
    metadata: Record<string, unknown>
  }>(
    `
    SELECT id, external_id, name, device_type, protocol, status, metadata
    FROM devices
    WHERE site_id = $1
      AND ($2::text IS NULL OR device_type = $2::text)
    ORDER BY name ASC
  `,
    [siteId, type ?? null],
  )
  return rows.rows.map((row) => ({
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    type: row.device_type,
    protocol: row.protocol,
    status: row.status,
    metadata: row.metadata,
  }))
}

export const listAlerts = async (siteId: string, status?: AlertStatus) => {
  const rows = await query<AlertRow>(
    `
    SELECT id, site_id, device_id, type, severity, title, message, status, created_at::text, acknowledged_at::text, resolved_at::text
    FROM alerts
    WHERE site_id = $1
      AND ($2::text IS NULL OR status = $2::text)
    ORDER BY created_at DESC
    LIMIT 200
  `,
    [siteId, status ?? null],
  )

  return rows.rows.map((row) => ({
    id: row.id,
    siteId: row.site_id,
    deviceId: row.device_id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
  }))
}

export const acknowledgeAlert = async (alertId: string, actorUserId: string) => {
  const siteResult = await query<{ site_id: string }>('SELECT site_id FROM alerts WHERE id = $1 LIMIT 1', [alertId])
  await query(
    `
    UPDATE alerts
    SET status = 'acknowledged',
        acknowledged_by = $2,
        acknowledged_at = now()
    WHERE id = $1
  `,
    [alertId, actorUserId],
  )
  await logAudit({
    action: 'alert.acknowledged',
    entityType: 'alert',
    entityId: alertId,
    actorUserId,
    siteId: siteResult.rows[0]?.site_id,
    details: {},
  })
}

export const resolveAlert = async (alertId: string, actorUserId: string) => {
  const siteResult = await query<{ site_id: string }>('SELECT site_id FROM alerts WHERE id = $1 LIMIT 1', [alertId])
  await query(
    `
    UPDATE alerts
    SET status = 'resolved',
        resolved_by = $2,
        resolved_at = now()
    WHERE id = $1
  `,
    [alertId, actorUserId],
  )
  await logAudit({
    action: 'alert.resolved',
    entityType: 'alert',
    entityId: alertId,
    actorUserId,
    siteId: siteResult.rows[0]?.site_id,
    details: {},
  })
}

export const createControlCommand = async (input: {
  siteId: string
  deviceId?: string
  commandType: string
  requestedBy: string
  payload: Record<string, unknown>
}) => {
  const command = await query<{ id: string }>(
    `
    INSERT INTO control_commands (site_id, device_id, command_type, target_payload, requested_by, status)
    VALUES ($1, $2, $3, $4::jsonb, $5, 'pending')
    RETURNING id
  `,
    [
      input.siteId,
      input.deviceId ?? null,
      input.commandType,
      JSON.stringify(input.payload),
      input.requestedBy,
    ],
  )
  await logAudit({
    action: 'control.requested',
    entityType: 'control_command',
    entityId: command.rows[0].id,
    actorUserId: input.requestedBy,
    siteId: input.siteId,
    details: {
      commandType: input.commandType,
      payload: input.payload,
    },
  })
  return command.rows[0]
}

export const approveControlCommand = async (id: string, approverUserId: string) => {
  const command = await query<{ site_id: string }>('SELECT site_id FROM control_commands WHERE id = $1 LIMIT 1', [id])
  await query(
    `
    UPDATE control_commands
    SET status = 'approved',
        approved_by = $2,
        approved_at = now()
    WHERE id = $1
      AND status = 'pending'
  `,
    [id, approverUserId],
  )
  await logAudit({
    action: 'control.approved',
    entityType: 'control_command',
    entityId: id,
    actorUserId: approverUserId,
    siteId: command.rows[0]?.site_id,
    details: {},
  })
}

export const executeApprovedCommands = async () => {
  const commands = await query<{
    id: string
    site_id: string
    command_type: string
  }>(
    `
    SELECT id, site_id, command_type
    FROM control_commands
    WHERE status = 'approved'
    ORDER BY created_at ASC
    LIMIT 25
  `,
  )

  for (const command of commands.rows) {
    await query(
      `
      UPDATE control_commands
      SET status = 'executed',
          executed_by = 'simulator',
          executed_at = now(),
          result_payload = $2::jsonb
      WHERE id = $1
    `,
      [command.id, JSON.stringify({ ok: true, simulated: true })],
    )

    await query(
      `
      INSERT INTO audit_logs (site_id, actor_user_id, actor_role, action, entity_type, entity_id, details)
      VALUES ($1, 'simulator', 'operator', 'control.executed', 'control_command', $2, $3::jsonb)
    `,
      [command.site_id, command.id, JSON.stringify({ commandType: command.command_type })],
    )
  }
}

export const getControlCommand = async (id: string) => {
  const command = await query<{
    id: string
    site_id: string
    device_id: string | null
    command_type: string
    status: string
    target_payload: Record<string, unknown>
    result_payload: Record<string, unknown>
    requested_by: string
    approved_by: string | null
    executed_by: string | null
    created_at: string
    approved_at: string | null
    executed_at: string | null
  }>(
    `
    SELECT id, site_id, device_id, command_type, status, target_payload, result_payload,
           requested_by, approved_by, executed_by, created_at::text, approved_at::text, executed_at::text
    FROM control_commands
    WHERE id = $1
    LIMIT 1
  `,
    [id],
  )
  return command.rows[0] ?? null
}

const toKpiWindow = (range: 'day' | 'month' | 'year') => {
  if (range === 'year') return "interval '365 days'"
  if (range === 'month') return "interval '30 days'"
  return "interval '1 day'"
}

export const computeKpis = async (siteId: string, range: 'day' | 'month' | 'year') => {
  const windowExpr = toKpiWindow(range)
  const rows = await query<{ metric: string; total_value: string }>(
    `
    SELECT metric, sum(value)::text AS total_value
    FROM telemetry_events
    WHERE site_id = $1
      AND observed_at >= now() - ${windowExpr}
      AND metric IN (
        'solar.generation_kw',
        'load.consumption_kw',
        'grid.import_kw',
        'grid.export_kw'
      )
    GROUP BY metric
  `,
    [siteId],
  )

  const totals = new Map(rows.rows.map((row) => [row.metric, Number(row.total_value)]))
  const generation = totals.get('solar.generation_kw') ?? 0
  const consumption = totals.get('load.consumption_kw') ?? 0
  const importEnergy = totals.get('grid.import_kw') ?? 0
  const exportEnergy = totals.get('grid.export_kw') ?? 0
  const selfConsumption = calculateSelfConsumption(generation, exportEnergy)
  const selfSufficiency = calculateSelfSufficiency(consumption, importEnergy)
  const availability = Math.max(90, Math.min(100, 100 - (importEnergy > generation ? 5 : 1)))
  const performanceRatio = Math.min(100, calculatePerformanceRatio(generation, Math.max(consumption, 1)))
  const savings = generation * 0.12 + exportEnergy * 0.08
  const roi = savings * (range === 'year' ? 1 : range === 'month' ? 12 : 365) / 30000 * 100

  return {
    generation,
    consumption,
    importEnergy,
    exportEnergy,
    selfConsumption,
    selfSufficiency,
    availability,
    performanceRatio,
    savings,
    roi,
    co2Avoided: generation * 0.42,
  }
}

export const upsertKpiSnapshot = async (siteId: string, range: 'day' | 'month' | 'year') => {
  const kpis = await computeKpis(siteId, range)
  const now = new Date()
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  await query(
    `
    INSERT INTO kpi_snapshots (site_id, range_key, period_start, metrics)
    VALUES ($1, $2, $3, $4::jsonb)
    ON CONFLICT (site_id, range_key, period_start)
    DO UPDATE SET metrics = EXCLUDED.metrics
  `,
    [siteId, range, periodStart.toISOString(), JSON.stringify(kpis)],
  )

  return kpis
}

export const listKpis = async (siteId: string, range: 'day' | 'month' | 'year') => {
  const snapshot = await query<{ metrics: Record<string, unknown> }>(
    `
    SELECT metrics
    FROM kpi_snapshots
    WHERE site_id = $1 AND range_key = $2
    ORDER BY period_start DESC
    LIMIT 1
  `,
    [siteId, range],
  )

  if (snapshot.rowCount && snapshot.rowCount > 0) {
    return snapshot.rows[0].metrics
  }

  return upsertKpiSnapshot(siteId, range)
}

export const logAudit = async (input: {
  action: string
  entityType: string
  entityId?: string
  actorUserId?: string
  actorRole?: string
  siteId?: string
  details: Record<string, unknown>
}) => {
  await query(
    `
    INSERT INTO audit_logs (site_id, actor_user_id, actor_role, action, entity_type, entity_id, details)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
  `,
    [
      input.siteId ?? null,
      input.actorUserId ?? null,
      input.actorRole ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.details),
    ],
  )
}

export const telemetrySchemas = {
  telemetryPointSchema,
  telemetryBatchSchema,
}

export type { TelemetryBatchInput }
