import { NextResponse } from 'next/server'
import type { ApiErrorPayload } from './types'

export const ok = <T>(data: T, init?: ResponseInit) => {
  return NextResponse.json(data, init)
}

export const fail = (status: number, error: string, details?: unknown) => {
  const payload: ApiErrorPayload = { error, details }
  return NextResponse.json(payload, { status })
}
