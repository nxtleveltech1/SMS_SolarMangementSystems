import { describe, expect, it } from 'vitest'
import {
  calculatePerformanceRatio,
  calculateSelfConsumption,
  calculateSelfSufficiency,
  detectGenerationAnomaly,
} from '../../lib/server/analytics-utils'

describe('analytics utilities', () => {
  it('calculates self-consumption correctly', () => {
    expect(calculateSelfConsumption(100, 25)).toBe(75)
  })

  it('calculates self-sufficiency correctly', () => {
    expect(calculateSelfSufficiency(120, 30)).toBe(75)
  })

  it('calculates performance ratio correctly', () => {
    expect(calculatePerformanceRatio(90, 100)).toBe(90)
  })

  it('detects generation anomalies below threshold', () => {
    expect(detectGenerationAnomaly(70, 100)).toBe(true)
    expect(detectGenerationAnomaly(90, 100)).toBe(false)
  })
})
