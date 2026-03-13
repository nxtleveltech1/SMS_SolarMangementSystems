# SolarFlow API Overview

## Core Endpoints
- `GET /api/sites`
- `GET /api/sites/:siteId/summary`
- `GET /api/sites/:siteId/realtime`
- `GET /api/sites/:siteId/timeseries?from&to&interval`
- `GET /api/sites/:siteId/devices?type=...`
- `GET /api/sites/:siteId/alerts?status=open|acknowledged|resolved`
- `GET /api/sites/:siteId/kpis?range=day|month|year`

## Control and Alerts
- `POST /api/control/commands`
- `GET /api/control/commands/:id`
- `POST /api/control/commands/:id/approve`
- `POST /api/alerts/:id/ack`
- `POST /api/alerts/:id/resolve`

## Ingestion and Jobs
- `POST /api/telemetry/ingest`
- `POST /api/cron/simulate` (requires `x-cron-secret`)
- `POST /api/cron/kpi-rollup` (requires `x-cron-secret`)
- `POST /api/cron/forecast` (requires `x-cron-secret`)

## Notifications
- `POST /api/notifications/test-email` (admin only)
