'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PowerGaugeProps {
  title: string
  value: number
  maxValue: number
  unit: string
  variant?: 'solar' | 'battery' | 'grid' | 'load'
  showPercentage?: boolean
  subtitle?: string
}

const variantColors = {
  solar: { stroke: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
  battery: { stroke: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  grid: { stroke: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  load: { stroke: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
}

export function PowerGauge({
  title,
  value,
  maxValue,
  unit,
  variant = 'solar',
  showPercentage = false,
  subtitle,
}: PowerGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const percentage = Math.min((animatedValue / maxValue) * 100, 100)
  const colors = variantColors[variant]
  
  // SVG arc calculations
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          <svg
            width={size}
            height={size / 2 + 10}
            className="overflow-visible"
          >
            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={colors.bg}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
              style={{ transformOrigin: 'center center' }}
            />
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {animatedValue.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        
        <div className="mt-2 flex w-full items-center justify-between px-2 text-xs text-muted-foreground">
          <span>0</span>
          {showPercentage && (
            <span className="font-medium" style={{ color: colors.stroke }}>
              {percentage.toFixed(0)}%
            </span>
          )}
          <span>{maxValue}</span>
        </div>
        
        {subtitle && (
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
