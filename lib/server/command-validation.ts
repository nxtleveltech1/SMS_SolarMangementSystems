const allowedCommandTypes = [
  'inverter.start',
  'inverter.stop',
  'battery.charge_setpoint',
  'battery.discharge_setpoint',
  'site.mode_backup',
  'site.mode_grid',
] as const

type AllowedCommandType = (typeof allowedCommandTypes)[number]

export const validateCommandType = (commandType: string): commandType is AllowedCommandType => {
  return (allowedCommandTypes as readonly string[]).includes(commandType)
}
