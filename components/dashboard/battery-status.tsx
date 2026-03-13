'use client'

import { Battery, BatteryCharging, BatteryLow, BatteryWarning, Thermometer, Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Battery as BatteryType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BatteryStatusProps {
  battery: BatteryType
  className?: string
}

export function BatteryStatus({ battery, className }: BatteryStatusProps) {
  const isCharging = battery.power > 0
  const isDischarging = battery.power < 0
  const isLow = battery.stateOfCharge < 20
  const isCritical = battery.stateOfCharge < 10

  const BatteryIcon = isCritical
    ? BatteryLow
    : isLow
    ? BatteryWarning
    : isCharging
    ? BatteryCharging
    : Battery

  const getStatusColor = () => {
    if (isCritical) return 'text-destructive'
    if (isLow) return 'text-warning'
    if (isCharging) return 'text-battery'
    return 'text-muted-foreground'
  }

  const getProgressColor = () => {
    if (isCritical) return 'bg-destructive'
    if (isLow) return 'bg-warning'
    return 'bg-battery'
  }

  // Calculate estimated time
  const powerKW = Math.abs(battery.power) / 1000
  const remainingKWh = (battery.stateOfCharge / 100) * battery.capacity
  const timeRemaining = isDischarging && powerKW > 0
    ? remainingKWh / powerKW
    : isCharging && powerKW > 0
    ? ((100 - battery.stateOfCharge) / 100 * battery.capacity) / powerKW
    : null

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Battery Status</CardTitle>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              isCharging && 'bg-battery/10 text-battery',
              isDischarging && 'bg-warning/10 text-warning',
              !isCharging && !isDischarging && 'bg-muted text-muted-foreground'
            )}
          >
            {isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main battery display */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl',
              isCritical && 'bg-destructive/10',
              isLow && !isCritical && 'bg-warning/10',
              !isLow && 'bg-battery/10'
            )}
          >
            <BatteryIcon className={cn('h-8 w-8', getStatusColor())} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {battery.stateOfCharge.toFixed(0)}
              </span>
              <span className="text-lg text-muted-foreground">%</span>
            </div>
            <Progress
              value={battery.stateOfCharge}
              className={cn('mt-2 h-2', getProgressColor())}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Power</span>
            </div>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {Math.abs(battery.power / 1000).toFixed(2)} kW
              <span className="ml-1 text-xs text-muted-foreground">
                {isCharging ? 'in' : isDischarging ? 'out' : ''}
              </span>
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Temperature</span>
            </div>
            <p className={cn(
              'mt-1 text-sm font-medium tabular-nums',
              battery.temperature > 40 && 'text-warning'
            )}>
              {battery.temperature.toFixed(1)}°C
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Health</span>
            </div>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {battery.health.toFixed(0)}%
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isCharging ? 'Full in' : 'Remaining'}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {timeRemaining
                ? `${Math.floor(timeRemaining)}h ${Math.round((timeRemaining % 1) * 60)}m`
                : '--:--'}
            </p>
          </div>
        </div>

        {/* Model info */}
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{battery.model}</span>
          <span>{battery.capacity} kWh</span>
        </div>
      </CardContent>
    </Card>
  )
}
