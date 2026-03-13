import { modbusSimAdapter } from './modbus-sim'
import { mqttSimAdapter } from './mqtt-sim'
import { ocppSimAdapter } from './ocpp-sim'

export const protocolAdapters = [modbusSimAdapter, mqttSimAdapter, ocppSimAdapter]
