'use client'

import { Sun, Zap, Battery, Home, TrendingUp, Activity } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { KPICard } from '@/components/dashboard/kpi-card'
import { PowerFlowDiagram } from '@/components/dashboard/power-flow-diagram'
import { EnergyChart } from '@/components/dashboard/energy-chart'
import { WeatherWidget } from '@/components/dashboard/weather-widget'
import { AlertsSummary } from '@/components/dashboard/alerts-summary'
import { BatteryStatus } from '@/components/dashboard/battery-status'
import { SavingsCard } from '@/components/dashboard/savings-card'
import { useSolar } from '@/lib/solar-context'

function DashboardContent() {
  const {
    powerData,
    timeSeriesData,
    alerts,
    kpis,
    weather,
    site,
    viewMode,
    acknowledgeAlert,
    isLoading,
  } = useSolar()

  if (isLoading || !powerData || !kpis || !weather || !site) {
    if (!isLoading && !site) {
      return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="max-w-md space-y-2 text-center">
            <h2 className="text-lg font-semibold">No site data available</h2>
            <p className="text-sm text-muted-foreground">
              Run database setup (`npm run db:migrate` and `npm run db:seed`) or connect telemetry ingestion.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const battery = site.batteries[0]
  const powerUnit = 'kW'
  const energyUnit = 'kWh'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {viewMode === 'enterprise' ? 'Enterprise Dashboard' : 'Home Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of your {viewMode === 'enterprise' ? 'solar plant' : 'solar system'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KPICard
          title="Solar Generation"
          value={powerData.solarGeneration}
          unit={powerUnit}
          icon={Sun}
          variant="solar"
          trend={{ value: 12, label: 'vs yesterday', isPositive: true }}
        />
        <KPICard
          title="Battery"
          value={Math.abs(powerData.batteryPower)}
          unit={powerUnit}
          icon={Battery}
          variant="battery"
        />
        <KPICard
          title="Grid"
          value={Math.abs(powerData.gridPower)}
          unit={powerUnit}
          icon={Zap}
          variant="grid"
        />
        <KPICard
          title="Consumption"
          value={powerData.loadConsumption}
          unit={powerUnit}
          icon={Home}
          variant="load"
        />
        <KPICard
          title="Today's Generation"
          value={kpis.todayGeneration}
          unit={energyUnit}
          icon={TrendingUp}
          variant="solar"
        />
        <KPICard
          title="Performance"
          value={kpis.performanceRatio}
          unit="%"
          icon={Activity}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Power Flow */}
        <div className="lg:col-span-2">
          <PowerFlowDiagram data={powerData} />
        </div>

        {/* Right Column - Weather */}
        <div>
          <WeatherWidget data={weather} />
        </div>
      </div>

      {/* Charts and Status Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Energy Chart - 2 columns */}
        <div className="lg:col-span-2">
          <EnergyChart data={timeSeriesData} title="24-Hour Energy Flow" />
        </div>

        {/* Battery Status */}
        <div>
          <BatteryStatus battery={battery} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts Summary */}
        <AlertsSummary
          alerts={alerts}
          onAcknowledge={acknowledgeAlert}
        />

        {/* Savings Card */}
        <SavingsCard kpis={kpis} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
