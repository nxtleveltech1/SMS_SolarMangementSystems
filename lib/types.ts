// Solar Energy Monitoring Platform Types

export type ViewMode = 'residential' | 'enterprise'

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type AlertType = 
  | 'inverter_fault'
  | 'low_battery'
  | 'grid_outage'
  | 'panel_degradation'
  | 'high_temperature'
  | 'communication_lost'
  | 'maintenance_due'
  | 'efficiency_drop'

// Real-time power data
export interface PowerData {
  timestamp: Date
  solarGeneration: number // kW
  batteryPower: number // kW (positive = charging, negative = discharging)
  gridPower: number // kW (positive = importing, negative = exporting)
  loadConsumption: number // kW
  batteryLevel: number // 0-100%
}

// Historical data point for charts
export interface TimeSeriesData {
  time: string
  solar: number
  battery: number
  grid: number
  load: number
}

// Device interfaces
export interface SolarPanel {
  id: string
  name: string
  status: DeviceStatus
  power: number // W
  voltage: number // V
  current: number // A
  temperature: number // °C
  efficiency: number // %
  tilt: number // degrees
  azimuth: number // degrees
  lastCommunication: Date
}

export interface Inverter {
  id: string
  name: string
  status: DeviceStatus
  inputPower: number // W
  outputPower: number // W
  efficiency: number // %
  temperature: number // °C
  frequency: number // Hz
  voltage: number // V
  model: string
  serialNumber: string
  lastCommunication: Date
}

export interface Battery {
  id: string
  name: string
  status: DeviceStatus
  stateOfCharge: number // %
  power: number // W (positive = charging)
  voltage: number // V
  current: number // A
  temperature: number // °C
  health: number // %
  cycleCount: number
  capacity: number // kWh
  model: string
  lastCommunication: Date
}

export interface Meter {
  id: string
  name: string
  type: 'production' | 'consumption' | 'grid' | 'battery'
  status: DeviceStatus
  power: number // W
  voltage: number // V
  current: number // A
  powerFactor: number
  frequency: number // Hz
  energyToday: number // kWh
  energyTotal: number // kWh
  lastCommunication: Date
}

export interface EVCharger {
  id: string
  name: string
  status: DeviceStatus
  power: number // W
  voltage: number // V
  current: number // A
  vehicleConnected: boolean
  chargingState: 'idle' | 'charging' | 'complete' | 'error'
  sessionEnergy: number // kWh
  maxPower: number // W
  lastCommunication: Date
}

// Alert interface
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  deviceId?: string
  deviceName?: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

// Site/Plant interface
export interface Site {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'utility'
  address: string
  coordinates: { lat: number; lng: number }
  capacity: number // kWp
  commissioning: Date
  status: DeviceStatus
  panels: SolarPanel[]
  inverters: Inverter[]
  batteries: Battery[]
  meters: Meter[]
  evChargers: EVCharger[]
}

// Dashboard KPIs
export interface DashboardKPIs {
  // Today's metrics
  todayGeneration: number // kWh
  todayConsumption: number // kWh
  todayExport: number // kWh
  todayImport: number // kWh
  selfConsumption: number // %
  selfSufficiency: number // %
  
  // Financial
  todaySavings: number // $
  monthSavings: number // $
  yearSavings: number // $
  lifetimeSavings: number // $
  
  // Environmental
  co2Avoided: number // kg
  treesEquivalent: number
  
  // Performance
  performanceRatio: number // %
  systemEfficiency: number // %
  peakPower: number // kW
  peakTime: string
}

// Weather data
export interface WeatherData {
  temperature: number // °C
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy'
  humidity: number // %
  windSpeed: number // km/h
  irradiance: number // W/m²
  sunrise: string
  sunset: string
  forecast: {
    day: string
    condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy'
    high: number
    low: number
    irradiance: number
  }[]
}

// Analytics interfaces
export interface PerformanceData {
  date: string
  generation: number
  consumption: number
  export: number
  import: number
  selfConsumption: number
  performanceRatio: number
}

export interface MonthlyStats {
  month: string
  generation: number
  consumption: number
  savings: number
  co2Avoided: number
}

// User preferences
export interface UserPreferences {
  viewMode: ViewMode
  darkMode: boolean
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  alertThresholds: {
    lowBattery: number
    highTemperature: number
    efficiencyDrop: number
  }
  currency: string
  electricityRate: number // $/kWh
  feedInTariff: number // $/kWh
}
