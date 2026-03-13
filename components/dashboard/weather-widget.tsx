'use client'

import { Cloud, CloudRain, Sun, CloudSun, Sunrise, Wind, Droplets } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeatherData } from '@/lib/types'

interface WeatherWidgetProps {
  data: WeatherData
  className?: string
}

const weatherIcons = {
  sunny: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
}

export function WeatherWidget({ data, className }: WeatherWidgetProps) {
  const WeatherIcon = weatherIcons[data.condition]

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weather</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current conditions */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-solar/10">
            <WeatherIcon className="h-8 w-8 text-solar" />
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {data.temperature.toFixed(0)}°C
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {data.condition.replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Sun className="h-4 w-4 text-solar" />
            <div>
              <p className="text-xs text-muted-foreground">Irradiance</p>
              <p className="text-sm font-medium">{data.irradiance} W/m²</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-sm font-medium">{data.windSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Droplets className="h-4 w-4 text-load" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-medium">{data.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Sunrise className="h-4 w-4 text-solar" />
            <div>
              <p className="text-xs text-muted-foreground">Sunrise</p>
              <p className="text-sm font-medium">{data.sunrise}</p>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            5-Day Forecast
          </p>
          <div className="flex justify-between">
            {data.forecast.slice(0, 5).map((day) => {
              const DayIcon = weatherIcons[day.condition]
              return (
                <div key={day.day} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <DayIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{day.high}°</span>
                  <span className="text-xs text-muted-foreground">{day.low}°</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
