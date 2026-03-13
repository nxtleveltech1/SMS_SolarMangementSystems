CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('residential', 'enterprise')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  address TEXT,
  capacity_kwp NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'online',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('homeowner', 'operator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, clerk_user_id)
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (
    device_type IN ('panel', 'inverter', 'battery', 'meter', 'ev_charger', 'weather')
  ),
  protocol TEXT NOT NULL CHECK (protocol IN ('modbus', 'mqtt', 'ocpp', 'internal')),
  status TEXT NOT NULL DEFAULT 'online',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, external_id)
);

CREATE TABLE IF NOT EXISTS telemetry_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  metric TEXT NOT NULL,
  value NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'good',
  observed_at TIMESTAMPTZ NOT NULL,
  source_protocol TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, observed_at),
  UNIQUE (site_id, dedupe_key, observed_at)
) PARTITION BY RANGE (observed_at);

CREATE TABLE IF NOT EXISTS telemetry_events_default
  PARTITION OF telemetry_events DEFAULT;

CREATE INDEX IF NOT EXISTS telemetry_events_site_metric_time_idx
  ON telemetry_events (site_id, metric, observed_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved')) DEFAULT 'open',
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_site_status_created_idx
  ON alerts (site_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS control_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  command_type TEXT NOT NULL,
  target_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  executed_by TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'approved', 'rejected', 'executed', 'failed')
  ) DEFAULT 'pending',
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS control_commands_site_status_idx
  ON control_commands (site_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  actor_user_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_site_created_idx
  ON audit_logs (site_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  range_key TEXT NOT NULL CHECK (range_key IN ('day', 'month', 'year')),
  period_start TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, range_key, period_start)
);

CREATE TABLE IF NOT EXISTS weather_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  forecast_time TIMESTAMPTZ NOT NULL,
  irradiance NUMERIC(10,2) NOT NULL,
  temperature NUMERIC(10,2) NOT NULL,
  cloud_cover NUMERIC(6,2) NOT NULL,
  expected_generation_kw NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weather_forecasts_site_time_idx
  ON weather_forecasts (site_id, forecast_time DESC);

CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly_rollups AS
SELECT
  site_id,
  metric,
  date_trunc('hour', observed_at) AS hour_bucket,
  avg(value) AS avg_value,
  min(value) AS min_value,
  max(value) AS max_value
FROM telemetry_events
GROUP BY site_id, metric, date_trunc('hour', observed_at);

CREATE INDEX IF NOT EXISTS telemetry_hourly_rollups_idx
  ON telemetry_hourly_rollups (site_id, metric, hour_bucket DESC);
