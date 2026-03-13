'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  variant?: 'default' | 'solar' | 'battery' | 'grid' | 'load'
  className?: string
}

const variantStyles = {
  default: 'bg-card',
  solar: 'bg-solar/10 border-solar/20',
  battery: 'bg-battery/10 border-battery/20',
  grid: 'bg-grid/10 border-grid/20',
  load: 'bg-load/10 border-load/20',
}

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  solar: 'bg-solar/20 text-solar',
  battery: 'bg-battery/20 text-battery',
  grid: 'bg-grid/20 text-grid',
  load: 'bg-load/20 text-load',
}

export function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: KPICardProps) {
  return (
    <Card className={cn('overflow-hidden', variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
              </span>
              {unit && (
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              iconStyles[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
