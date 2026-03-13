'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSolar } from '@/lib/solar-context'

function SettingsContent() {
  const { preferences, updatePreferences, selectedSiteId } = useSolar()
  const [lowBattery, setLowBattery] = useState(String(preferences.alertThresholds.lowBattery))
  const [testEmailState, setTestEmailState] = useState<string | null>(null)

  const saveSettings = () => {
    updatePreferences({
      alertThresholds: {
        ...preferences.alertThresholds,
        lowBattery: Number(lowBattery),
      },
    })
  }

  const triggerTestEmail = async () => {
    const res = await fetch('/api/notifications/test-email', { method: 'POST' })
    const json = await res.json()
    setTestEmailState(json.sent ? 'Test email sent.' : json.reason || 'Failed to send email')
  }

  const runSimulationTick = async () => {
    const secret = window.prompt('Enter CRON_SECRET to trigger simulator manually')
    if (!secret) return
    await fetch('/api/cron/simulate', {
      method: 'POST',
      headers: {
        'x-cron-secret': secret,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure alert thresholds, notifications, and operational tools.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm">Low Battery Threshold (%)</span>
            <Input value={lowBattery} onChange={(event) => setLowBattery(event.target.value)} />
          </label>
          <Button onClick={saveSettings}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={triggerTestEmail}>Send Test Email</Button>
          {testEmailState && <p className="text-sm text-muted-foreground">{testEmailState}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulator Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Selected site: {selectedSiteId ?? 'none'}</p>
          <Button variant="outline" onClick={runSimulationTick}>
            Trigger Telemetry Simulator Tick
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  )
}
