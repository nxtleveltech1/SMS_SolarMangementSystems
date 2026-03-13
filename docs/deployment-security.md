# SolarFlow Deployment and Security Guide

## Runtime Topology
- Next.js app/API is deployed on Vercel.
- PostgreSQL is hosted on a managed provider (Neon/Vercel Postgres-compatible).
- Telemetry enters through `/api/telemetry/ingest` from protocol gateways.
- Vercel cron triggers simulator/rollup/forecast jobs.

## OT Boundary Guidance
- Keep field gateways (Modbus/CAN/OCPP collectors) on a segmented OT subnet.
- Allow egress from gateways only to the HTTPS ingestion endpoint.
- Do not expose SCADA/PLC interfaces directly to the internet.
- Route IT/OT traffic through controlled firewall rules and logging.

## Access Controls
- Authentication: Clerk.
- Authorization: RBAC roles (`homeowner`, `operator`, `admin`).
- Sensitive endpoints (control commands, notification tests) are role-restricted.
- Mutating APIs are rate-limited at the route layer.

## Secrets
- Required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Optional: `RESEND_API_KEY`, `CRON_SECRET`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO`.
- Store secrets in Vercel project environment settings, never in source.

## Audit and Incident Response
- Control command requests/approvals/execution are written to `audit_logs`.
- Alert acknowledgment/resolution actions are audit-tracked.
- Keep DB backups and retention policies aligned with operational compliance requirements.
