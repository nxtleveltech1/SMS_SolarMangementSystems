'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Monitoring Architecture',
    body: 'Telemetry is ingested via protocol adapters (Modbus, MQTT, OCPP), normalized, persisted in PostgreSQL, and served to dashboard APIs.',
  },
  {
    title: 'Control Workflow',
    body: 'Control commands are requested, approved (role-gated), then executed by the simulator with audit entries for full traceability.',
  },
  {
    title: 'Security Model',
    body: 'Authentication is handled by Clerk. API actions are role-checked and rate-limited. Critical actions are auditable in audit logs.',
  },
  {
    title: 'Cron Jobs',
    body: 'Vercel cron endpoints run simulator ticks, KPI rollups, and forecast generation using CRON_SECRET protected triggers.',
  },
]

function HelpContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Help & Docs</h1>
        <p className="text-sm text-muted-foreground">
          Operational reference for monitoring, control, and analytics workflows.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <DashboardLayout>
      <HelpContent />
    </DashboardLayout>
  )
}
