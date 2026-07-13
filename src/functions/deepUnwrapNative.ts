import { isArray, isPlainObject } from 'lodash-es'
import { unwrapNative } from './unwrapNative'

/**
 * Recursively swap JSONata-safe native wrappers (from $blob, $jsonToParquet,
 * $parseUrl, $dtFromIso, …) back for the real Blob/ArrayBuffer/URL/DateTime they
 * box, so a result survives instanceof, structuredClone and JSON.stringify once
 * it leaves JSONata. Also restore JSONata 2.2 null-prototype objects to ordinary
 * host objects. Cycle-safe and copy-on-write; unchanged 2.0-shaped results pass
 * through untouched. Host Dates are stamped in place, so need no unwrap here.
 */
function deepUnwrapNative<T = unknown>(value: T): T {
  return deepUnwrapNativeInner(value, new WeakMap()) as T
}

function deepUnwrapNativeInner(
  value: unknown,
  seen: WeakMap<object, unknown>
): unknown {
  const unwrapped = unwrapNative(value)
  if (unwrapped !== value) {
    // a wrapper — hand back the raw native, don't walk its method props
    return unwrapped
  }
  if (!value || typeof value !== 'object') return value
  const visited = seen.get(value)
  if (visited) return visited
  if (isArray(value)) {
    const items = value
    const out: unknown[] = []
    seen.set(value, out)
    let changed = false
    for (let i = 0; i < items.length; i++) {
      const next = deepUnwrapNativeInner(items[i], seen)
      out.push(next)
      if (next !== items[i]) changed = true
    }
    if (!changed) {
      seen.set(value, value)
      return value
    }
    return out
  }
  if (isPlainObject(value)) {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record)
    const out: Record<string, unknown> = {}
    seen.set(value, out)
    // JSONata 2.2 builds expression objects with a null prototype for security.
    // Restore the 2.0 host contract only after evaluation; the evaluator still
    // gets the upstream prototype-pollution protection.
    let changed = Object.getPrototypeOf(value) === null
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const next = deepUnwrapNativeInner(record[key], seen)
      Object.defineProperty(out, key, {
        value: next,
        enumerable: true,
        configurable: true,
        writable: true,
      })
      if (next !== record[key]) changed = true
    }
    if (!changed) {
      seen.set(value, value)
      return value
    }
    return out
  }
  return value
}

export default deepUnwrapNative
