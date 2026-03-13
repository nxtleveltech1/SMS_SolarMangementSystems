import type {
  PowerData,
  TimeSeriesData,
  SolarPanel,
  Inverter,
  Battery,
  Meter,
  EVCharger,
  Alert,
  DashboardKPIs,
  WeatherData,
  PerformanceData,
  MonthlyStats,
  Site,
  AlertType,
  AlertSeverity,
} from './types'

// Utility functions
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max))

// Time-based solar generation curve (simulates sun position)
const getSolarMultiplier = (hour: number): number => {
  // Peak at noon, zero at night
  if (hour < 6 || hour > 20) return 0
  const peak = 13 // Peak hour
  const spread = 6 // Hours from peak to near-zero
  const normalized = Math.max(0, 1 - Math.pow((hour - peak) / spread, 2))
  return normalized * (0.8 + Math.random() * 0.2) // Add some variation
}

// Generate current power data
export const generatePowerData = (capacity: number = 10): PowerData => {
  const now = new Date()
  const hour = now.getHours() + now.getMinutes() / 60
  
  const solarMultiplier = getSolarMultiplier(hour)
  const solarGeneration = capacity * solarMultiplier * (0.85 + Math.random() * 0.15)
  
  // Load varies throughout the day
  const baseLoad = 1.5 + Math.random() * 0.5
  const loadMultiplier = hour >= 17 && hour <= 21 ? 1.5 : hour >= 7 && hour <= 9 ? 1.3 : 1
  const loadConsumption = baseLoad * loadMultiplier
  
  // Battery logic: charge when excess solar, discharge when needed
  const excessPower = solarGeneration - loadConsumption
  const batteryLevel = 20 + Math.random() * 70
  
  let batteryPower = 0
  if (excessPower > 0.5 && batteryLevel < 95) {
    batteryPower = Math.min(excessPower * 0.8, 5) // Charging
  } else if (excessPower < -0.5 && batteryLevel > 10) {
    batteryPower = Math.max(excessPower * 0.6, -5) // Discharging
  }
  
  // Grid makes up the difference
  const gridPower = loadConsumption - solarGeneration + batteryPower
  
  return {
    timestamp: now,
    solarGeneration: Math.max(0, solarGeneration),
    batteryPower,
    gridPower,
    loadConsumption,
    batteryLevel,
  }
}

// Generate time series data for charts
export const generateTimeSeriesData = (hours: number = 24): TimeSeriesData[] => {
  const data: TimeSeriesData[] = []
  const now = new Date()
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = time.getHours() + time.getMinutes() / 60
    const solarMultiplier = getSolarMultiplier(hour)
    
    const solar = 10 * solarMultiplier * (0.85 + Math.random() * 0.15)
    const load = (1.5 + Math.random() * 0.5) * (hour >= 17 && hour <= 21 ? 1.5 : 1)
    const battery = solar > load ? (solar - load) * 0.3 : -(load - solar) * 0.3
    const grid = load - solar + battery
    
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      solar: Math.max(0, Number(solar.toFixed(2))),
      battery: Number(battery.toFixed(2)),
      grid: Number(grid.toFixed(2)),
      load: Number(load.toFixed(2)),
    })
  }
  
  return data
}

// Generate panel data
export const generatePanels = (count: number = 20): SolarPanel[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `panel-${i + 1}`,
    name: `Panel ${String(i + 1).padStart(2, '0')}`,
    status: Math.random() > 0.95 ? 'warning' : Math.random() > 0.98 ? 'offline' : 'online',
    power: randomInt(250, 400),
    voltage: randomBetween(38, 42),
    current: randomBetween(8, 10),
    temperature: randomBetween(35, 55),
    efficiency: randomBetween(18, 22),
    tilt: 30,
    azimuth: 180,
    lastCommunication: new Date(),
  }))
}

// Generate inverter data
export const generateInverters = (count: number = 2): Inverter[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `inverter-${i + 1}`,
    name: `Inverter ${i + 1}`,
    status: Math.random() > 0.98 ? 'warning' : 'online',
    inputPower: randomInt(4000, 5000),
    outputPower: randomInt(3800, 4900),
    efficiency: randomBetween(96, 98.5),
    temperature: randomBetween(40, 55),
    frequency: randomBetween(49.9, 50.1),
    voltage: randomBetween(230, 240),
    model: 'SolarEdge SE5000H',
    serialNumber: `SE${randomInt(100000, 999999)}`,
    lastCommunication: new Date(),
  }))
}

// Generate battery data
export const generateBatteries = (count: number = 1): Battery[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `battery-${i + 1}`,
    name: `Battery ${i + 1}`,
    status: 'online',
    stateOfCharge: randomBetween(20, 90),
    power: randomBetween(-3000, 3000),
    voltage: randomBetween(48, 52),
    current: randomBetween(-60, 60),
    temperature: randomBetween(20, 35),
    health: randomBetween(95, 100),
    cycleCount: randomInt(100, 500),
    capacity: 13.5,
    model: 'Tesla Powerwall 2',
    lastCommunication: new Date(),
  }))
}

// Generate meter data
export const generateMeters = (): Meter[] => {
  return [
    {
      id: 'meter-production',
      name: 'Production Meter',
      type: 'production',
      status: 'online',
      power: randomInt(3000, 8000),
      voltage: randomBetween(230, 240),
      current: randomBetween(10, 35),
      powerFactor: randomBetween(0.95, 0.99),
      frequency: randomBetween(49.9, 50.1),
      energyToday: randomBetween(20, 40),
      energyTotal: randomBetween(15000, 25000),
      lastCommunication: new Date(),
    },
    {
      id: 'meter-consumption',
      name: 'Consumption Meter',
      type: 'consumption',
      status: 'online',
      power: randomInt(1000, 4000),
      voltage: randomBetween(230, 240),
      current: randomBetween(4, 17),
      powerFactor: randomBetween(0.9, 0.98),
      frequency: randomBetween(49.9, 50.1),
      energyToday: randomBetween(10, 25),
      energyTotal: randomBetween(30000, 50000),
      lastCommunication: new Date(),
    },
    {
      id: 'meter-grid',
      name: 'Grid Meter',
      type: 'grid',
      status: 'online',
      power: randomInt(-3000, 2000),
      voltage: randomBetween(230, 240),
      current: randomBetween(0, 13),
      powerFactor: randomBetween(0.9, 0.99),
      frequency: randomBetween(49.9, 50.1),
      energyToday: randomBetween(5, 15),
      energyTotal: randomBetween(10000, 20000),
      lastCommunication: new Date(),
    },
  ]
}

// Generate EV charger data
export const generateEVChargers = (count: number = 1): EVCharger[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `ev-charger-${i + 1}`,
    name: `EV Charger ${i + 1}`,
    status: 'online',
    power: Math.random() > 0.5 ? randomInt(3000, 11000) : 0,
    voltage: randomBetween(230, 240),
    current: Math.random() > 0.5 ? randomBetween(13, 48) : 0,
    vehicleConnected: Math.random() > 0.5,
    chargingState: Math.random() > 0.5 ? 'charging' : 'idle',
    sessionEnergy: randomBetween(0, 30),
    maxPower: 11000,
    lastCommunication: new Date(),
  }))
}

// Generate alerts
const alertTemplates: { type: AlertType; severity: AlertSeverity; title: string; message: string }[] = [
  { type: 'inverter_fault', severity: 'critical', title: 'Inverter Fault Detected', message: 'Inverter has reported a ground fault. Immediate attention required.' },
  { type: 'low_battery', severity: 'warning', title: 'Low Battery Level', message: 'Battery state of charge is below 15%. Consider adjusting consumption.' },
  { type: 'grid_outage', severity: 'critical', title: 'Grid Outage Detected', message: 'Grid power is unavailable. System operating in island mode.' },
  { type: 'panel_degradation', severity: 'warning', title: 'Panel Performance Degradation', message: 'Panel output is 20% below expected. Cleaning or inspection recommended.' },
  { type: 'high_temperature', severity: 'warning', title: 'High Temperature Alert', message: 'Inverter temperature exceeds 65°C. Check ventilation.' },
  { type: 'communication_lost', severity: 'info', title: 'Communication Lost', message: 'Unable to communicate with device for 10 minutes.' },
  { type: 'maintenance_due', severity: 'info', title: 'Maintenance Due', message: 'Scheduled maintenance is due. Please contact your installer.' },
  { type: 'efficiency_drop', severity: 'warning', title: 'System Efficiency Drop', message: 'Overall system efficiency has dropped below 85%.' },
]

export const generateAlerts = (count: number = 5): Alert[] => {
  const alerts: Alert[] = []
  const usedTemplates = new Set<number>()
  
  for (let i = 0; i < count; i++) {
    let templateIndex: number
    do {
      templateIndex = randomInt(0, alertTemplates.length)
    } while (usedTemplates.has(templateIndex) && usedTemplates.size < alertTemplates.length)
    
    usedTemplates.add(templateIndex)
    const template = alertTemplates[templateIndex]
    
    alerts.push({
      id: `alert-${i + 1}`,
      ...template,
      deviceId: `device-${randomInt(1, 10)}`,
      deviceName: `Device ${randomInt(1, 10)}`,
      timestamp: new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000)),
      acknowledged: Math.random() > 0.7,
      resolvedAt: Math.random() > 0.8 ? new Date() : undefined,
    })
  }
  
  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Generate dashboard KPIs
export const generateDashboardKPIs = (): DashboardKPIs => {
  const todayGeneration = randomBetween(25, 45)
  const todayConsumption = randomBetween(15, 30)
  const selfConsumed = Math.min(todayGeneration, todayConsumption) * randomBetween(0.6, 0.9)
  
  return {
    todayGeneration,
    todayConsumption,
    todayExport: Math.max(0, todayGeneration - selfConsumed),
    todayImport: Math.max(0, todayConsumption - selfConsumed),
    selfConsumption: (selfConsumed / todayGeneration) * 100,
    selfSufficiency: (selfConsumed / todayConsumption) * 100,
    todaySavings: todayGeneration * 0.12 + (todayGeneration - selfConsumed) * 0.08,
    monthSavings: randomBetween(150, 300),
    yearSavings: randomBetween(2500, 4000),
    lifetimeSavings: randomBetween(15000, 25000),
    co2Avoided: todayGeneration * 0.42,
    treesEquivalent: Math.floor(todayGeneration * 0.42 / 21),
    performanceRatio: randomBetween(80, 95),
    systemEfficiency: randomBetween(85, 95),
    peakPower: randomBetween(8, 10),
    peakTime: '12:30 PM',
  }
}

// Generate weather data
export const generateWeatherData = (): WeatherData => {
  const conditions: WeatherData['condition'][] = ['sunny', 'partly-cloudy', 'cloudy', 'rainy']
  const condition = conditions[randomInt(0, 2)] // Bias towards better weather
  
  return {
    temperature: randomBetween(18, 32),
    condition,
    humidity: randomBetween(30, 70),
    windSpeed: randomBetween(5, 25),
    irradiance: condition === 'sunny' ? randomBetween(800, 1000) : 
                condition === 'partly-cloudy' ? randomBetween(500, 800) : 
                randomBetween(100, 500),
    sunrise: '06:15',
    sunset: '19:45',
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + i) % 7],
      condition: conditions[randomInt(0, conditions.length)],
      high: randomInt(25, 35),
      low: randomInt(15, 22),
      irradiance: randomBetween(400, 900),
    })),
  }
}

// Generate performance data for analytics
export const generatePerformanceData = (days: number = 30): PerformanceData[] => {
  const data: PerformanceData[] = []
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const generation = randomBetween(20, 50)
    const consumption = randomBetween(15, 35)
    const selfConsumed = Math.min(generation, consumption) * randomBetween(0.5, 0.9)
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      generation,
      consumption,
      export: Math.max(0, generation - selfConsumed),
      import: Math.max(0, consumption - selfConsumed),
      selfConsumption: (selfConsumed / generation) * 100,
      performanceRatio: randomBetween(75, 95),
    })
  }
  
  return data
}

// Generate monthly stats
export const generateMonthlyStats = (months: number = 12): MonthlyStats[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()
  
  return Array.from({ length: months }, (_, i) => {
    const monthIndex = (currentMonth - months + i + 12) % 12
    const summerMonths = [5, 6, 7, 8] // Jun, Jul, Aug, Sep
    const multiplier = summerMonths.includes(monthIndex) ? 1.3 : 
                       [4, 9].includes(monthIndex) ? 1.1 : 0.8
    
    const generation = randomBetween(800, 1200) * multiplier
    const consumption = randomBetween(400, 700)
    
    return {
      month: monthNames[monthIndex],
      generation,
      consumption,
      savings: generation * 0.12 + (generation - consumption * 0.7) * 0.08,
      co2Avoided: generation * 0.42,
    }
  })
}

// Generate site data
export const generateSite = (type: 'residential' | 'commercial' = 'residential'): Site => {
  const isCommercial = type === 'commercial'
  
  return {
    id: 'site-1',
    name: isCommercial ? 'Commercial Solar Plant Alpha' : 'Home Solar System',
    type,
    address: isCommercial ? '123 Industrial Blvd, Solar City, SC 12345' : '456 Sunshine Lane, Green Valley, GV 67890',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    capacity: isCommercial ? 500 : 10,
    commissioning: new Date('2022-06-15'),
    status: 'online',
    panels: generatePanels(isCommercial ? 1000 : 24),
    inverters: generateInverters(isCommercial ? 10 : 2),
    batteries: generateBatteries(isCommercial ? 4 : 1),
    meters: generateMeters(),
    evChargers: generateEVChargers(isCommercial ? 4 : 1),
  }
}
