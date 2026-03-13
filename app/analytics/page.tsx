'use client'

import { Activity, BarChart3, DollarSign, Gauge, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { EnergyChart } from '@/components/dashboard/energy-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSolar } from '@/lib/solar-context'

function AnalyticsContent() {
  const { timeSeriesData, kpis } = useSolar()

  if (!kpis) {
    return <p className="text-sm text-muted-foreground">Loading analytics...</p>
  }

  const analyticsCards = [
    { label: 'Performance Ratio', value: `${kpis.performanceRatio.toFixed(1)}%`, icon: Gauge },
    { label: 'Self Consumption', value: `${kpis.selfConsumption.toFixed(1)}%`, icon: Activity },
    { label: 'Self Sufficiency', value: `${kpis.selfSufficiency.toFixed(1)}%`, icon: TrendingUp },
    { label: 'Today Savings', value: `$${kpis.todaySavings.toFixed(2)}`, icon: DollarSign },
    { label: 'CO2 Avoided', value: `${kpis.co2Avoided.toFixed(1)} kg`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Performance, reliability, and financial insights across solar operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {analyticsCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="text-xl font-semibold">{card.value}</p>
              </div>
              <card.icon className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Energy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EnergyChart data={timeSeriesData} title="Plant Energy Profile" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  )
}
