'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSolar } from '@/lib/solar-context'

interface DeviceItem {
  id: string
  externalId: string
  name: string
  type: string
  protocol: string
  status: string
  metadata: Record<string, unknown>
}

const typeMap: Record<string, string> = {
  panels: 'panel',
  inverters: 'inverter',
  batteries: 'battery',
  meters: 'meter',
  'ev-chargers': 'ev_charger',
}

const titleMap: Record<string, string> = {
  panels: 'Solar Panels',
  inverters: 'Inverters',
  batteries: 'Batteries',
  meters: 'Meters',
  'ev-chargers': 'EV Chargers',
}

function DevicesContent() {
  const { selectedSiteId } = useSolar()
  const params = useParams<{ type: string }>()
  const routeType = params.type
  const deviceType = typeMap[routeType]
  const [allDevices, setAllDevices] = useState<DeviceItem[]>([])
  const [loading, setLoading] = useState(true)
  const cacheRef = useRef<{ siteId: string; devices: DeviceItem[] } | null>(null)

  const title = useMemo(() => titleMap[routeType] ?? 'Devices', [routeType])

  const devices = useMemo(
    () => (deviceType ? allDevices.filter((d) => d.type === deviceType) : []),
    [allDevices, deviceType],
  )

  useEffect(() => {
    if (!selectedSiteId || !deviceType) {
      setLoading(false)
      return
    }
    if (cacheRef.current?.siteId === selectedSiteId) {
      setAllDevices(cacheRef.current.devices)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/sites/${selectedSiteId}/devices`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        const list = (json.devices ?? []) as DeviceItem[]
        cacheRef.current = { siteId: selectedSiteId, devices: list }
        setAllDevices(list)
      })
      .catch(() => setAllDevices([]))
      .finally(() => setLoading(false))
  }, [selectedSiteId, deviceType])

  if (!deviceType) {
    return <div className="text-sm text-muted-foreground">Unknown device type.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Live inventory and status for {title.toLowerCase()}.</p>
        </div>
        <Badge variant="outline">{devices.length} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title} Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading devices...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">External ID</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Protocol</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-2 py-3 text-left font-medium text-muted-foreground">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b">
                      <td className="px-2 py-3">{device.name}</td>
                      <td className="px-2 py-3 text-muted-foreground">{device.externalId}</td>
                      <td className="px-2 py-3">{device.protocol}</td>
                      <td className="px-2 py-3">
                        <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                          {device.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        <pre>{JSON.stringify(device.metadata, null, 2)}</pre>
                      </td>
                    </tr>
                  ))}
                  {!devices.length && (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">
                        No devices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <DevicesContent />
    </DashboardLayout>
  )
}
