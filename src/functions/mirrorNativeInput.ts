import { isArray, isPlainObject } from 'lodash-es'
import jsonataSafeResponse from './jsonataSafeResponse'
import { toJsonataUrl } from './parseUrl'
import { toJsonataDate } from './toJsonataDate'
import { unwrapNative } from './unwrapNative'

const STAMPED = Symbol('jsonataNativePropsStamped')

// Own + enumerable so JSONata 2.2 can read it; configurable so re-stamping never
// throws. Shadows the identical prototype getter — the value stays a real native.
// On Cloudflare Workers, ArrayBuffer.byteLength is non-configurable and
// defineProperty throws — swallow that so re-entering evaluate with a parquet
// ArrayBuffer (destination/run_if context) does not abort the sync.
function stampOwnProp(target: object, name: string, value: unknown) {
  try {
    Object.defineProperty(target, name, {
      value,
      enumerable: true,
      configurable: true,
    })
  } catch {
    // leave prototype getter; JSONata may still not see it, but we must not throw
  }
}

// Mirror a Blob/File/ArrayBuffer's getters as own props, in place, so
// `body.file.name` / `data.size` / `buf.byteLength` work under JSONata 2.2.
function stampNativeInstance(node: Blob | ArrayBuffer) {
  if ((node as unknown as Record<symbol, unknown>)[STAMPED]) {
    return
  }
  if (node instanceof Blob) {
    stampOwnProp(node, 'size', node.size)
    stampOwnProp(node, 'type', node.type)
    if (typeof File !== 'undefined' && node instanceof File) {
      stampOwnProp(node, 'name', node.name)
      stampOwnProp(node, 'lastModified', node.lastModified)
    }
  } else {
    stampOwnProp(node, 'byteLength', node.byteLength)
  }
  try {
    Object.defineProperty(node, STAMPED, { value: true })
  } catch {
    // ignore — worst case we re-attempt stamps (also guarded)
  }
}

/**
 * Make native inputs readable by JSONata 2.2 expressions (which only see own
 * properties): stamp Blob/File/ArrayBuffer in place, swap URL → the $parseUrl
 * shape, Date → own-property method mirror (round-trips via NATIVE_DATE), and
 * Response → a plain mirror. Copy-on-write; already-wrapped values and opaque
 * host objects (Headers, Map, Luxon DateTime, …) are left alone.
 */
function mirrorNativeInput<T>(value: T): T {
  if (!value || typeof value !== 'object') {
    return value
  }
  // already a JSONata-safe wrapper: readable as-is, don't walk its methods
  if (unwrapNative(value) !== value) {
    return value
  }
  if (value instanceof Blob || value instanceof ArrayBuffer) {
    stampNativeInstance(value)
    return value
  }
  if (value instanceof Date) {
    return toJsonataDate(value) as unknown as T
  }
  if (value instanceof URL) {
    return toJsonataUrl(value) as unknown as T
  }
  if (typeof Response !== 'undefined' && value instanceof Response) {
    return jsonataSafeResponse(value) as unknown as T
  }
  if (isArray(value)) {
    const items = value as unknown[]
    let out: unknown[] | null = null
    for (let i = 0; i < items.length; i++) {
      const next = mirrorNativeInput(items[i])
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
      const next = mirrorNativeInput(record[key])
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

export default mirrorNativeInput
