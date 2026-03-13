'use client'

import { Sun, Battery, Zap, Home, ArrowRight, ArrowDown, Gauge, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useSolar } from '@/lib/solar-context'
import { cn } from '@/lib/utils'

function PowerFlowContent() {
  const { powerData, kpis, site, isLoading } = useSolar()

  if (isLoading || !powerData || !kpis || !site) {
    if (!isLoading && !site) {
      return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No site configured. Run migrations and seed data to populate this view.
          </p>
        </div>
      )
    }
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading power flow...</p>
        </div>
      </div>
    )
  }

  const { solarGeneration, batteryPower, gridPower, loadConsumption, batteryLevel } = powerData
  const isCharging = batteryPower > 0
  const isExporting = gridPower < 0

  // Calculate flow amounts
  const solarToLoad = Math.min(solarGeneration, loadConsumption)
  const solarToBattery = isCharging ? Math.min(solarGeneration - solarToLoad, batteryPower) : 0
  const solarToGrid = isExporting ? Math.abs(gridPower) : 0
  const batteryToLoad = !isCharging && batteryPower < 0 ? Math.abs(batteryPower) : 0
  const gridToLoad = !isExporting && gridPower > 0 ? gridPower : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Power Flow</h1>
        <p className="text-sm text-muted-foreground">
          Real-time visualization of energy flow through your system
        </p>
      </div>

      {/* Large Power Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Live Power Flow Diagram</CardTitle>
          <CardDescription>
            Arrows indicate direction and magnitude of energy transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[500px] p-4">
            {/* Solar Source - Top Center */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <PowerNode
                icon={Sun}
                label="Solar Array"
                value={solarGeneration}
                unit="kW"
                variant="solar"
                subtitle={`${site.panels.length} panels`}
              />
            </div>

            {/* Flow arrows from solar */}
            <div className="absolute left-1/2 top-[100px] -translate-x-1/2">
              <FlowLine
                direction="down"
                value={solarToLoad}
                active={solarToLoad > 0.1}
              />
            </div>

            {/* Battery - Left */}
            <div className="absolute left-[10%] top-[200px] md:left-[20%]">
              <PowerNode
                icon={Battery}
                label="Battery"
                value={Math.abs(batteryPower)}
                unit="kW"
                variant="battery"
                subtitle={`${batteryLevel.toFixed(0)}% charged`}
                status={isCharging ? 'Charging' : batteryPower < 0 ? 'Discharging' : 'Idle'}
              />
              {/* Arrow to/from battery */}
              <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                <FlowLine
                  direction={isCharging ? 'left' : 'right'}
                  value={isCharging ? solarToBattery : batteryToLoad}
                  active={Math.abs(batteryPower) > 0.1}
                />
              </div>
            </div>

            {/* Home/Load - Center */}
            <div className="absolute left-1/2 top-[280px] -translate-x-1/2">
              <PowerNode
                icon={Home}
                label="Home Load"
                value={loadConsumption}
                unit="kW"
                variant="load"
                subtitle="Consuming"
              />
            </div>

            {/* Grid - Right */}
            <div className="absolute right-[10%] top-[200px] md:right-[20%]">
              <PowerNode
                icon={Zap}
                label="Grid"
                value={Math.abs(gridPower)}
                unit="kW"
                variant="grid"
                subtitle={isExporting ? 'Exporting' : gridPower > 0 ? 'Importing' : 'Standby'}
                status={isExporting ? 'Export' : gridPower > 0 ? 'Import' : 'Idle'}
              />
              {/* Arrow to/from grid */}
              <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                <FlowLine
                  direction={isExporting ? 'right' : 'left'}
                  value={isExporting ? solarToGrid : gridToLoad}
                  active={Math.abs(gridPower) > 0.1}
                />
              </div>
            </div>

            {/* System Status Summary */}
            <div className="absolute bottom-0 left-1/2 w-full max-w-2xl -translate-x-1/2">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatusItem
                      label="Solar Efficiency"
                      value={`${kpis.systemEfficiency.toFixed(0)}%`}
                      icon={Gauge}
                    />
                    <StatusItem
                      label="Self-Consumption"
                      value={`${kpis.selfConsumption.toFixed(0)}%`}
                      icon={Activity}
                    />
                    <StatusItem
                      label="Grid Independence"
                      value={`${kpis.selfSufficiency.toFixed(0)}%`}
                      icon={Zap}
                    />
                    <StatusItem
                      label="Peak Today"
                      value={`${kpis.peakPower.toFixed(1)} kW`}
                      icon={Sun}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DetailCard
          title="Solar Production"
          value={solarGeneration}
          unit="kW"
          details={[
            { label: 'Today', value: `${kpis.todayGeneration.toFixed(1)} kWh` },
            { label: 'Peak', value: `${kpis.peakPower.toFixed(1)} kW @ ${kpis.peakTime}` },
            { label: 'Panels Online', value: `${site.panels.filter(p => p.status === 'online').length}/${site.panels.length}` },
          ]}
          variant="solar"
        />
        <DetailCard
          title="Battery Storage"
          value={Math.abs(batteryPower)}
          unit="kW"
          details={[
            { label: 'State of Charge', value: `${batteryLevel.toFixed(0)}%` },
            { label: 'Status', value: isCharging ? 'Charging' : batteryPower < 0 ? 'Discharging' : 'Idle' },
            { label: 'Capacity', value: `${site.batteries[0]?.capacity || 0} kWh` },
          ]}
          variant="battery"
        />
        <DetailCard
          title="Home Consumption"
          value={loadConsumption}
          unit="kW"
          details={[
            { label: 'Today', value: `${kpis.todayConsumption.toFixed(1)} kWh` },
            { label: 'From Solar', value: `${solarToLoad.toFixed(2)} kW` },
            { label: 'From Grid', value: `${gridToLoad.toFixed(2)} kW` },
          ]}
          variant="load"
        />
        <DetailCard
          title="Grid Exchange"
          value={Math.abs(gridPower)}
          unit="kW"
          details={[
            { label: 'Direction', value: isExporting ? 'Exporting' : gridPower > 0 ? 'Importing' : 'Balanced' },
            { label: 'Exported Today', value: `${kpis.todayExport.toFixed(1)} kWh` },
            { label: 'Imported Today', value: `${kpis.todayImport.toFixed(1)} kWh` },
          ]}
          variant="grid"
        />
      </div>
    </div>
  )
}

interface PowerNodeProps {
  icon: React.ElementType
  label: string
  value: number
  unit: string
  variant: 'solar' | 'battery' | 'grid' | 'load'
  subtitle?: string
  status?: string
}

const variantStyles = {
  solar: 'bg-solar/10 border-solar/30 text-solar',
  battery: 'bg-battery/10 border-battery/30 text-battery',
  grid: 'bg-grid/10 border-grid/30 text-grid',
  load: 'bg-load/10 border-load/30 text-load',
}

function PowerNode({ icon: Icon, label, value, unit, variant, subtitle, status }: PowerNodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full border-2 md:h-24 md:w-24',
          variantStyles[variant]
        )}
      >
        <Icon className="h-9 w-9 md:h-10 md:w-10" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums text-foreground md:text-2xl">
          {value.toFixed(2)} <span className="text-sm font-normal">{unit}</span>
        </p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {status && (
          <span
            className={cn(
              'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              status === 'Charging' && 'bg-battery/20 text-battery',
              status === 'Discharging' && 'bg-warning/20 text-warning',
              status === 'Export' && 'bg-success/20 text-success',
              status === 'Import' && 'bg-grid/20 text-grid',
              status === 'Idle' && 'bg-muted text-muted-foreground'
            )}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  )
}

interface FlowLineProps {
  direction: 'up' | 'down' | 'left' | 'right'
  value: number
  active: boolean
}

function FlowLine({ direction, value, active }: FlowLineProps) {
  const isHorizontal = direction === 'left' || direction === 'right'
  const ArrowIcon = direction === 'down' ? ArrowDown : ArrowRight

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        isHorizontal ? 'flex-row' : 'flex-col',
        direction === 'left' && 'flex-row-reverse',
        direction === 'up' && 'flex-col-reverse'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full transition-all',
          active ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground/30',
          isHorizontal ? 'h-8 w-16' : 'h-16 w-8'
        )}
      >
        <ArrowIcon
          className={cn(
            'h-5 w-5',
            active && 'animate-pulse',
            direction === 'left' && 'rotate-180',
            direction === 'up' && '-rotate-90',
            direction === 'down' && 'rotate-90'
          )}
        />
      </div>
      {active && value > 0.1 && (
        <span className="text-xs font-medium tabular-nums text-primary">
          {value.toFixed(1)} kW
        </span>
      )}
    </div>
  )
}

interface StatusItemProps {
  label: string
  value: string
  icon: React.ElementType
}

function StatusItem({ label, value, icon: Icon }: StatusItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

interface DetailCardProps {
  title: string
  value: number
  unit: string
  details: { label: string; value: string }[]
  variant: 'solar' | 'battery' | 'grid' | 'load'
}

const cardVariants = {
  solar: 'border-solar/20',
  battery: 'border-battery/20',
  grid: 'border-grid/20',
  load: 'border-load/20',
}

function DetailCard({ title, value, unit, details, variant }: DetailCardProps) {
  return (
    <Card className={cn('overflow-hidden', cardVariants[variant])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">
          {value.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
        <div className="mt-4 space-y-2">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-medium">{detail.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PowerFlowPage() {
  return (
    <DashboardLayout>
      <PowerFlowContent />
    </DashboardLayout>
  )
}
