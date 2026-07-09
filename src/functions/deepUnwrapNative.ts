import { isArray, isPlainObject } from 'lodash-es'
import { unwrapNative } from './unwrapNative'

/**
 * Recursively swap JSONata-safe native wrappers (from $blob, $jsonToParquet,
 * $parseUrl, $dtFromIso, …) back for the real Blob/ArrayBuffer/URL/DateTime they
 * box, so a result survives instanceof, structuredClone and JSON.stringify once
 * it leaves JSONata. Copy-on-write — plain-JSON results pass through untouched.
 */
function deepUnwrapNative<T = unknown>(value: T): T {
  const unwrapped = unwrapNative(value)
  if (unwrapped !== value) {
    // a wrapper — hand back the raw native, don't walk its method props
    return unwrapped as T
  }
  if (isArray(value)) {
    const items = value as unknown[]
    let out: unknown[] | null = null
    for (let i = 0; i < items.length; i++) {
      const next = deepUnwrapNative(items[i])
      if (!out && next !== items[i]) {
        out = items.slice(0, i)
      }
      if (out) out.push(next)
    }
    return (out ?? value) as T
  }
  if (isPlainObject(value)) {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record)
    let out: Record<string, unknown> | null = null
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const next = deepUnwrapNative(record[key])
      if (!out && next !== record[key]) {
        out = {}
        for (let j = 0; j < i; j++) {
          out[keys[j]] = record[keys[j]]
        }
      }
      if (out) out[key] = next
    }
    return (out ?? value) as T
  }
  return value
}

export default deepUnwrapNative
