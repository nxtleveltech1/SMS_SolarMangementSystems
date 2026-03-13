import { describe, expect, it } from 'vitest'
import { validateCommandType } from '../../lib/server/command-validation'

describe('command validation', () => {
  it('accepts supported commands', () => {
    expect(validateCommandType('inverter.start')).toBe(true)
    expect(validateCommandType('battery.discharge_setpoint')).toBe(true)
  })

  it('rejects unsupported commands', () => {
    expect(validateCommandType('inverter.reset_factory')).toBe(false)
  })
})
