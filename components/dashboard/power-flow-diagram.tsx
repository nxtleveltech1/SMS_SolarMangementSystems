'use client'

import { Sun, Battery, Zap, Home, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PowerData } from '@/lib/types'

interface PowerFlowDiagramProps {
  data: PowerData
  className?: string
}

interface FlowNodeProps {
  icon: React.ElementType
  label: string
  value: number
  unit: string
  variant: 'solar' | 'battery' | 'grid' | 'load'
  subtitle?: string
}

const variantStyles = {
  solar: 'bg-solar/10 border-solar/30 text-solar',
  battery: 'bg-battery/10 border-battery/30 text-battery',
  grid: 'bg-grid/10 border-grid/30 text-grid',
  load: 'bg-load/10 border-load/30 text-load',
}

function FlowNode({ icon: Icon, label, value, unit, variant, subtitle }: FlowNodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full border-2 md:h-20 md:w-20',
          variantStyles[variant]
        )}
      >
        <Icon className="h-7 w-7 md:h-8 md:w-8" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums text-foreground md:text-xl">
          {Math.abs(value).toFixed(2)} <span className="text-sm font-normal">{unit}</span>
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface FlowArrowProps {
  direction: 'right' | 'down' | 'up' | 'left'
  active: boolean
  value?: number
  className?: string
}

function FlowArrow({ direction, active, value, className }: FlowArrowProps) {
  const ArrowIcon = direction === 'down' ? ArrowDown : 
                    direction === 'up' ? ArrowUp : ArrowRight
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-3 py-1 transition-all',
          active
            ? 'bg-primary/10 text-primary'
            : 'bg-muted/50 text-muted-foreground/50'
        )}
      >
        <ArrowIcon
          className={cn(
            'h-4 w-4 transition-transform',
            active && 'animate-pulse',
            direction === 'left' && 'rotate-180'
          )}
        />
        {value !== undefined && active && (
          <span className="text-xs font-medium tabular-nums">
            {Math.abs(value).toFixed(1)} kW
          </span>
        )}
      </div>
    </div>
  )
}

export function PowerFlowDiagram({ data, className }: PowerFlowDiagramProps) {
  const {
    solarGeneration,
    batteryPower,
    gridPower,
    loadConsumption,
    batteryLevel,
  } = data

  // Determine flow directions
  const solarToLoad = Math.min(solarGeneration, loadConsumption)
  const solarToBattery = batteryPower > 0 ? Math.min(solarGeneration - solarToLoad, batteryPower) : 0
  const solarToGrid = Math.max(0, -gridPower)
  const batteryToLoad = batteryPower < 0 ? Math.abs(batteryPower) : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Power Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Top row: Solar */}
          <div className="flex justify-center">
            <FlowNode
              icon={Sun}
              label="Solar"
              value={solarGeneration}
              unit="kW"
              variant="solar"
              subtitle={solarGeneration > 0 ? 'Generating' : 'Idle'}
            />
          </div>

          {/* Arrows from solar */}
          <div className="flex items-center justify-center gap-8">
            <FlowArrow
              direction="down"
              active={solarToBattery > 0.1}
              value={solarToBattery}
              className="rotate-[-45deg]"
            />
            <FlowArrow
              direction="down"
              active={solarToLoad > 0.1}
              value={solarToLoad}
            />
            <FlowArrow
              direction="down"
              active={solarToGrid > 0.1}
              value={solarToGrid}
              className="rotate-[45deg]"
            />
          </div>

          {/* Middle row: Battery, Home, Grid */}
          <div className="flex items-center justify-between px-4">
            <FlowNode
              icon={Battery}
              label="Battery"
              value={batteryPower}
              unit="kW"
              variant="battery"
              subtitle={`${batteryLevel.toFixed(0)}% SoC`}
            />

            <div className="flex items-center gap-2">
              <FlowArrow
                direction="right"
                active={batteryToLoad > 0.1}
                value={batteryToLoad}
              />
            </div>

            <FlowNode
              icon={Home}
              label="Home"
              value={loadConsumption}
              unit="kW"
              variant="load"
              subtitle="Consuming"
            />

            <div className="flex items-center gap-2">
              <FlowArrow
                direction={gridPower > 0 ? 'left' : 'right'}
                active={Math.abs(gridPower) > 0.1}
                value={Math.abs(gridPower)}
              />
            </div>

            <FlowNode
              icon={Zap}
              label="Grid"
              value={gridPower}
              unit="kW"
              variant="grid"
              subtitle={gridPower > 0 ? 'Importing' : gridPower < -0.1 ? 'Exporting' : 'Idle'}
            />
          </div>

          {/* Status summary */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {solarGeneration > loadConsumption ? (
                <span className="text-success">
                  Excess solar: {(solarGeneration - loadConsumption).toFixed(2)} kW
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Solar covers {((solarGeneration / loadConsumption) * 100).toFixed(0)}% of load
                </span>
              )}
              <span className="text-muted-foreground">|</span>
              <span className={cn(
                batteryPower > 0 ? 'text-battery' : batteryPower < 0 ? 'text-warning' : 'text-muted-foreground'
              )}>
                Battery: {batteryPower > 0 ? 'Charging' : batteryPower < 0 ? 'Discharging' : 'Idle'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
