'use client'

import { DollarSign, TrendingUp, Leaf, TreePine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DashboardKPIs } from '@/lib/types'

interface SavingsCardProps {
  kpis: DashboardKPIs
  currency?: string
  className?: string
}

export function SavingsCard({ kpis, currency = '$', className }: SavingsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Savings & Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="environmental" className="gap-2">
              <Leaf className="h-3.5 w-3.5" />
              Environmental
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="mt-4 space-y-4">
            <div className="rounded-lg bg-success/10 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Today&apos;s Savings</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {currency}{kpis.todaySavings.toFixed(2)}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-semibold tabular-nums">
                  {currency}{kpis.monthSavings.toFixed(0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">This Year</p>
                <p className="text-lg font-semibold tabular-nums">
                  {currency}{(kpis.yearSavings / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Lifetime</p>
                <p className="text-lg font-semibold tabular-nums">
                  {currency}{(kpis.lifetimeSavings / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
            
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Self-Consumption</span>
                <span className="text-sm font-medium">{kpis.selfConsumption.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${kpis.selfConsumption}%` }}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="environmental" className="mt-4 space-y-4">
            <div className="rounded-lg bg-success/10 p-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">CO2 Avoided Today</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {kpis.co2Avoided.toFixed(1)} <span className="text-lg font-normal">kg</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <TreePine className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{kpis.treesEquivalent}</p>
                <p className="text-sm text-muted-foreground">Trees equivalent</p>
              </div>
            </div>
            
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Self-Sufficiency</span>
                <span className="text-sm font-medium">{kpis.selfSufficiency.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${Math.min(kpis.selfSufficiency, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Percentage of your energy needs covered by solar
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
