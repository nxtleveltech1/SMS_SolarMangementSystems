const bucketStore = new Map<string, number[]>()

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number) => {
  const now = Date.now()
  const bucket = bucketStore.get(key) ?? []
  const active = bucket.filter((ts) => now - ts < windowMs)
  if (active.length >= maxRequests) {
    bucketStore.set(key, active)
    return false
  }
  active.push(now)
  bucketStore.set(key, active)
  return true
}
