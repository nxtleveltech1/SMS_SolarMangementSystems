'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimeSeriesData } from '@/lib/types'

interface EnergyChartProps {
  data: TimeSeriesData[]
  title?: string
  className?: string
}

const COLORS = {
  solar: '#eab308',
  battery: '#22c55e',
  grid: '#6366f1',
  load: '#06b6d4',
}

export function EnergyChart({ data, title = 'Energy Flow', className }: EnergyChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      battery: Math.abs(d.battery),
      grid: Math.abs(d.grid),
    }))
  }, [data])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.solar} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.solar} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.load} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.load} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} kW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} kW`,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <Area
                type="monotone"
                dataKey="solar"
                stroke={COLORS.solar}
                strokeWidth={2}
                fill="url(#solarGradient)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="load"
                stroke={COLORS.load}
                strokeWidth={2}
                fill="url(#loadGradient)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="battery"
                stroke={COLORS.battery}
                strokeWidth={2}
                fill="transparent"
                dot={false}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="grid"
                stroke={COLORS.grid}
                strokeWidth={2}
                fill="transparent"
                dot={false}
                strokeDasharray="3 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
