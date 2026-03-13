'use client'

import Link from 'next/link'
import { AlertTriangle, AlertCircle, Info, ChevronRight, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Alert } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AlertsSummaryProps {
  alerts: Alert[]
  onAcknowledge?: (alertId: string) => void
  className?: string
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    iconColor: 'text-destructive',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconColor: 'text-warning',
  },
  info: {
    icon: Info,
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    iconColor: 'text-primary',
  },
}

export function AlertsSummary({ alerts, onAcknowledge, className }: AlertsSummaryProps) {
  const unacknowledged = alerts.filter(a => !a.acknowledged)
  const critical = unacknowledged.filter(a => a.severity === 'critical')
  const warning = unacknowledged.filter(a => a.severity === 'warning')
  const info = unacknowledged.filter(a => a.severity === 'info')

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Alerts</CardTitle>
        <Link href="/alerts">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View All
            <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary counts */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{critical.length}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-1.5">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning">{warning.length}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{info.length}</span>
          </div>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {unacknowledged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">All Clear</p>
              <p className="text-xs text-muted-foreground">No active alerts</p>
            </div>
          ) : (
            unacknowledged.slice(0, 4).map((alert) => {
              const config = severityConfig[alert.severity]
              const Icon = config.icon
              
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {alert.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                  {onAcknowledge && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 px-2 text-xs"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Ack
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
