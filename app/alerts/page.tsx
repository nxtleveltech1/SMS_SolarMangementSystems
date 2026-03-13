'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSolar } from '@/lib/solar-context'

function AlertsPageContent() {
  const { alerts, acknowledgeAlert, dismissAlert } = useSolar()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts Center</h1>
        <p className="text-sm text-muted-foreground">
          Monitor, acknowledge, and resolve operational alarms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active and Historical Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                  {alert.severity}
                </Badge>
                <Badge variant={alert.acknowledged ? 'default' : 'secondary'}>
                  {alert.acknowledged ? 'acknowledged' : 'open'}
                </Badge>
                <span className="text-sm font-medium">{alert.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {alert.timestamp.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
              <div className="mt-3 flex gap-2">
                {!alert.acknowledged && (
                  <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                    Acknowledge
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                  Resolve
                </Button>
              </div>
            </div>
          ))}
          {!alerts.length && <p className="text-sm text-muted-foreground">No alerts available.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <AlertsPageContent />
    </DashboardLayout>
  )
}
