import { isPlainObject } from 'lodash-es'
import { unwrapNative } from './unwrapNative'

type Walk = {
  // each node's result; an unchanged node maps to itself
  seen: Map<object, unknown>
  // times a node that maps to itself was reached again: a back-reference
  // in a cycle, or a node shared by two parents
  backRefs: number
  // copy every container up front, so back-references in a cycle that
  // changes point at the copies
  eager: boolean
}

/**
 * Recursively swap JSONata-safe native wrappers (from $blob, $jsonToParquet,
 * $parseUrl, $dtFromIso, …) back for the real Blob/ArrayBuffer/URL/DateTime they
 * box, so a result survives instanceof, structuredClone and JSON.stringify once
 * it leaves JSONata. Also restore JSONata 2.2 null-prototype objects to ordinary
 * host objects. Cycle-safe and copy-on-write; unchanged 2.0-shaped results pass
 * through untouched. Host Dates are stamped in place, so need no unwrap here.
 *
 * Only arrays and plain objects are walked. A wrapper inside a Map, Set or
 * class instance stays a wrapper (and such a value fails structuredClone).
 * JSONata cannot build those, and Truto functions get natives rather than
 * wrappers (see toHostArg), so only a container the caller made can hold one.
 */
function deepUnwrapNative<T = unknown>(value: T): T {
  if (!value || typeof value !== 'object') return value
  const walk: Walk = {
    seen: new Map(),
    backRefs: 0,
    eager: false,
  }
  const result = deepUnwrapNativeInner(value, walk)
  if (result === value || walk.backRefs === 0) return result as T
  // A cycle that changes: walk again, copying containers before their
  // children so back-references reach the copies.
  return deepUnwrapNativeInner(value, {
    seen: new Map(),
    backRefs: 0,
    eager: true,
  }) as T
}

// Walks without allocating; a container is copied only once a child changes
// or it has a null prototype.
function deepUnwrapNativeInner(value: unknown, walk: Walk): unknown {
  if (!value || typeof value !== 'object') return value
  const seen = walk.seen.get(value)
  if (seen !== undefined) {
    if (seen === value) walk.backRefs++
    return seen
  }

  if (Array.isArray(value)) {
    let out: unknown[] | undefined = walk.eager ? [] : undefined
    walk.seen.set(value, out ?? value)
    for (let i = 0; i < value.length; i++) {
      const next = deepUnwrapNativeInner(value[i], walk)
      if (out) {
        out.push(next)
      } else if (next !== value[i]) {
        out = value.slice(0, i)
        out.push(next)
      }
    }
    if (out) walk.seen.set(value, out)
    return out ?? value
  }

  const unwrapped = unwrapNative(value)
  if (unwrapped !== value) {
    // a wrapper — hand back the raw native, don't walk its method props
    return unwrapped
  }
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null && !isPlainObject(value)) {
    return value
  }

  const record = value as Record<string, unknown>
  // JSONata 2.2 builds expression objects with a null prototype for security.
  // Restore the 2.0 host contract only after evaluation; the evaluator still
  // gets the upstream prototype-pollution protection.
  const out: Record<string, unknown> | undefined =
    walk.eager || proto === null ? {} : undefined
  walk.seen.set(value, out ?? value)
  const keys = Object.keys(record)
  let next: unknown[] | undefined
  for (let i = 0; i < keys.length; i++) {
    const child = record[keys[i]]
    const unwrappedChild = deepUnwrapNativeInner(child, walk)
    if (next) {
      next[i] = unwrappedChild
    } else if (unwrappedChild !== child) {
      next = new Array(keys.length)
      for (let j = 0; j < i; j++) next[j] = record[keys[j]]
      next[i] = unwrappedChild
    }
  }
  if (!out && !next) {
    return value
  }
  const copy = out ?? {}
  for (let i = 0; i < keys.length; i++) {
    Object.defineProperty(copy, keys[i], {
      value: next ? next[i] : record[keys[i]],
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  walk.seen.set(value, copy)
  return copy
}

export default deepUnwrapNative
