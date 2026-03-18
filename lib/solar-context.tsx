'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type {
  PowerData,
  TimeSeriesData,
  Alert,
  DashboardKPIs,
  WeatherData,
  Site,
  ViewMode,
  UserPreferences,
} from './types'

interface SolarContextType {
  // Current data
  powerData: PowerData | null
  timeSeriesData: TimeSeriesData[]
  alerts: Alert[]
  kpis: DashboardKPIs | null
  weather: WeatherData | null
  site: Site | null
  
  // View mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sites: { id: string; externalId: string; name: string; mode: ViewMode; status: string; capacityKwp: number }[]
  selectedSiteId: string | null
  setSelectedSiteId: (siteId: string) => void
  
  // Preferences
  preferences: UserPreferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void
  
  // Alert management
  acknowledgeAlert: (alertId: string) => void
  dismissAlert: (alertId: string) => void
  
  // Data refresh
  refreshData: () => void
  
  // Loading state
  isLoading: boolean
}

const defaultPreferences: UserPreferences = {
  viewMode: 'residential',
  darkMode: true,
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  alertThresholds: {
    lowBattery: 15,
    highTemperature: 60,
    efficiencyDrop: 80,
  },
  currency: 'USD',
  electricityRate: 0.12,
  feedInTariff: 0.08,
}

const SolarContext = createContext<SolarContextType | undefined>(undefined)

type RealtimeSnapshot = {
  solarGeneration: number
  batteryPower: number
  gridPower: number
  loadConsumption: number
  lastUpdatedAt: string
}

function generateSyntheticTimeseries(
  realtime: RealtimeSnapshot,
  capacityKwp: number,
): TimeSeriesData[] {
  const now = new Date(realtime.lastUpdatedAt)
  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentSolarFactor =
    currentHour < 6 || currentHour > 19 ? 0 : Math.max(0, 1 - Math.abs(currentHour - 12.5) / 7)
  const scale = currentSolarFactor > 0.01 ? realtime.solarGeneration / currentSolarFactor : capacityKwp * 0.5

  const points: TimeSeriesData[] = []
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now)
    t.setHours(t.getHours() - i, 0, 0, 0)
    const hour = t.getHours() + t.getMinutes() / 60
    const solarFactor = hour < 6 || hour > 19 ? 0 : Math.max(0, 1 - Math.abs(hour - 12.5) / 7)
    const solar = scale * solarFactor
    points.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      solar: Math.max(0, Number(solar.toFixed(2))),
      battery: realtime.batteryPower,
      grid: realtime.gridPower,
      load: realtime.loadConsumption,
    })
  }
  return points
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
  return response.json()
}

export function SolarProvider({ children }: { children: ReactNode }) {
  const [powerData, setPowerData] = useState<PowerData | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [sites, setSites] = useState<SolarContextType['sites']>([])
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('residential')
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)

  const setSelectedSiteId = (siteId: string) => {
    setSelectedSiteIdState(siteId)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedSiteId', siteId)
    }
  }

  const loadSites = useCallback(async () => {
    const result = await fetchJson<{ sites: SolarContextType['sites'] }>('/api/sites')
    setSites(result.sites)
    if (!result.sites.length) return

    const persisted = typeof window !== 'undefined'
      ? window.localStorage.getItem('selectedSiteId')
      : null

    const activeSite = result.sites.find((s) => s.id === persisted) ?? result.sites[0]
    setSelectedSiteIdState(activeSite.id)
    setViewMode(activeSite.mode)
  }, [])

  const refreshData = useCallback(() => {
    if (!selectedSiteId) return

    const run = async () => {
      const [summary, realtime, timeseries, alertsRes, kpiRes] = await Promise.all([
        fetchJson<{
          site: {
            id: string
            externalId: string
            name: string
            mode: 'residential' | 'enterprise'
            capacityKwp: number
            status: string
          } | null
          devices: { type: string; count: number }[]
        }>(`/api/sites/${selectedSiteId}/summary`),
        fetchJson<{
          solarGeneration: number
          batteryPower: number
          gridPower: number
          loadConsumption: number
          batteryLevel: number
          irradiance: number
          ambientTemperature: number
          lastUpdatedAt: string
        }>(`/api/sites/${selectedSiteId}/realtime`),
        fetchJson<{ points: TimeSeriesData[] }>(
          `/api/sites/${selectedSiteId}/timeseries?interval=1h`,
        ),
        fetchJson<{
          alerts: {
            id: string
            type: Alert['type']
            severity: Alert['severity']
            title: string
            message: string
            status: 'open' | 'acknowledged' | 'resolved'
            createdAt: string
          }[]
        }>(`/api/sites/${selectedSiteId}/alerts`),
        fetchJson<{ kpis: Record<string, number> }>(`/api/sites/${selectedSiteId}/kpis?range=day`),
      ])

      if (summary.site) {
        setViewMode(summary.site.mode)
        setSite({
          id: summary.site.id,
          name: summary.site.name,
          type: summary.site.mode === 'enterprise' ? 'commercial' : 'residential',
          address: '',
          coordinates: { lat: 0, lng: 0 },
          capacity: summary.site.capacityKwp,
          commissioning: new Date(),
          status: 'online',
          panels: [],
          inverters: [],
          batteries: [
            {
              id: 'battery-1',
              name: 'Battery',
              status: 'online',
              stateOfCharge: realtime.batteryLevel,
              power: realtime.batteryPower * 1000,
              voltage: 50,
              current: 20,
              temperature: 29,
              health: 96,
              cycleCount: 120,
              capacity: 13.5,
              model: 'Battery Simulator',
              lastCommunication: new Date(realtime.lastUpdatedAt),
            },
          ],
          meters: [],
          evChargers: [],
        })
      }

      setPowerData({
        timestamp: new Date(realtime.lastUpdatedAt),
        solarGeneration: realtime.solarGeneration,
        batteryPower: realtime.batteryPower,
        gridPower: realtime.gridPower,
        loadConsumption: realtime.loadConsumption,
        batteryLevel: realtime.batteryLevel,
      })

      const rawPoints = timeseries.points
      const points: TimeSeriesData[] =
        rawPoints.length > 0
          ? rawPoints.map((point) => ({
              ...point,
              time: new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            }))
          : generateSyntheticTimeseries(realtime, summary.site?.capacityKwp ?? 10)
      setTimeSeriesData(points)

      setAlerts(
        alertsRes.alerts.map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: new Date(alert.createdAt),
          acknowledged: alert.status !== 'open',
        })),
      )

      const metrics = kpiRes.kpis
      setKpis({
        todayGeneration: metrics.generation ?? 0,
        todayConsumption: metrics.consumption ?? 0,
        todayExport: metrics.exportEnergy ?? 0,
        todayImport: metrics.importEnergy ?? 0,
        selfConsumption: metrics.selfConsumption ?? 0,
        selfSufficiency: metrics.selfSufficiency ?? 0,
        todaySavings: metrics.savings ?? 0,
        monthSavings: (metrics.savings ?? 0) * 30,
        yearSavings: (metrics.savings ?? 0) * 365,
        lifetimeSavings: (metrics.savings ?? 0) * 365 * 5,
        co2Avoided: metrics.co2Avoided ?? 0,
        treesEquivalent: Math.floor((metrics.co2Avoided ?? 0) / 21),
        performanceRatio: metrics.performanceRatio ?? 0,
        systemEfficiency: metrics.performanceRatio ?? 0,
        peakPower: Math.max(realtime.solarGeneration, realtime.loadConsumption),
        peakTime: new Date(realtime.lastUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })

      const condition: WeatherData['condition'] =
        realtime.irradiance > 700 ? 'sunny'
          : realtime.irradiance > 450 ? 'partly-cloudy'
            : realtime.irradiance > 250 ? 'cloudy'
              : 'rainy'
      setWeather({
        temperature: realtime.ambientTemperature,
        condition,
        humidity: 55,
        windSpeed: 13,
        irradiance: realtime.irradiance,
        sunrise: '06:10',
        sunset: '19:10',
        forecast: Array.from({ length: 5 }, (_, i) => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date().getDay() + i) % 7],
          condition,
          high: Math.round(realtime.ambientTemperature + 5),
          low: Math.round(realtime.ambientTemperature - 4),
          irradiance: Math.round(realtime.irradiance),
        })),
      })
    }

    run().catch((error) => {
      console.error('Failed to refresh solar data', error)
    })
  }, [selectedSiteId])

  // Initial data load
  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSites()
        .catch((error) => {
          console.error('Failed to load sites', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadSites])

  // Refresh selected site data
  useEffect(() => {
    if (!selectedSiteId) return
    refreshData()
    const fastInterval = setInterval(refreshData, 15000)
    return () => clearInterval(fastInterval)
  }, [selectedSiteId, refreshData])

  const acknowledgeAlert = (alertId: string) => {
    fetchJson(`/api/alerts/${alertId}/ack`, { method: 'POST' })
      .then(() => {
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert,
          ),
        )
      })
      .catch((error) => console.error('Failed to acknowledge alert', error))
  }

  const dismissAlert = (alertId: string) => {
    fetchJson(`/api/alerts/${alertId}/resolve`, { method: 'POST' })
      .then(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      })
      .catch((error) => console.error('Failed to resolve alert', error))
  }

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }))
  }

  return (
    <SolarContext.Provider
      value={{
        powerData,
        timeSeriesData,
        alerts,
        kpis,
        weather,
        site,
        viewMode,
        setViewMode,
        sites,
        selectedSiteId,
        setSelectedSiteId,
        preferences,
        updatePreferences,
        acknowledgeAlert,
        dismissAlert,
        refreshData,
        isLoading,
      }}
    >
      {children}
    </SolarContext.Provider>
  )
}

export function useSolar() {
  const context = useContext(SolarContext)
  if (context === undefined) {
    throw new Error('useSolar must be used within a SolarProvider')
  }
  return context
}
