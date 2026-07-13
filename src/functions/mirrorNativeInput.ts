import { isArray, isDate, isPlainObject } from 'lodash-es'
import { DateTime } from 'luxon'
import jsonataSafeResponse from './jsonataSafeResponse'
import { toJsonataUrl } from './parseUrl'
import { toJsonataArrayBuffer } from './toJsonataArrayBuffer'
import { toJsonataBlob } from './toJsonataBlob'
import { toJsonataDateTime } from './toJsonataDateTime'
import { toJsonataReadableStream } from './toJsonataReadableStream'
import { unwrapNative } from './unwrapNative'

const STAMPED = Symbol('jsonataNativePropsStamped')

// Own + non-enumerable so JSONata 2.2 can read it by name without exposing it via
// `.*` / `$keys` (matching 2.0 prototype visibility). Configurable so re-stamping
// never throws. On Cloudflare Workers, ArrayBuffer.byteLength is non-configurable
// and defineProperty throws — swallow that so re-entering evaluate with a parquet
// ArrayBuffer (destination/run_if context) does not abort the sync.
function stampOwnProp(target: object, name: string, value: unknown): boolean {
  try {
    Object.defineProperty(target, name, {
      value,
      enumerable: false,
      configurable: true,
    })
  } catch {
    // leave prototype getter; JSONata may still not see it, but we must not throw
  }
  return Object.prototype.hasOwnProperty.call(target, name)
}

function markStamped(node: object) {
  try {
    Object.defineProperty(node, STAMPED, { value: true })
  } catch {
    // ignore — worst case we re-attempt stamps (also guarded)
  }
}

// Mirror a Blob/File/ArrayBuffer's getters as own props, in place, so
// `body.file.name` / `data.size` / `buf.byteLength` work under JSONata 2.2.
function stampNativeInstance(node: Blob | ArrayBuffer): unknown {
  if ((node as unknown as Record<symbol, unknown>)[STAMPED]) {
    return node
  }
  let readable = true
  if (node instanceof Blob) {
    readable = stampOwnProp(node, 'size', node.size) && readable
    readable = stampOwnProp(node, 'type', node.type) && readable
    if (typeof File !== 'undefined' && node instanceof File) {
      readable = stampOwnProp(node, 'name', node.name) && readable
      readable =
        stampOwnProp(node, 'lastModified', node.lastModified) && readable
    }
  } else {
    readable = stampOwnProp(node, 'byteLength', node.byteLength)
  }
  if (!readable) {
    // Do not mark STAMPED on a failed stamp — otherwise a later evaluate with
    // the same Workers ArrayBuffer would skip the wrapper fallback and stay
    // unreadable.
    if (node instanceof ArrayBuffer) return toJsonataArrayBuffer(node)
    return toJsonataBlob(
      node,
      typeof File !== 'undefined' && node instanceof File
        ? { name: node.name, lastModified: node.lastModified }
        : undefined
    )
  }
  markStamped(node)
  return node
}

function cloneArrayBufferView(view: ArrayBufferView): ArrayBufferView {
  if (view instanceof DataView) {
    const buffer = view.buffer.slice(
      view.byteOffset,
      view.byteOffset + view.byteLength
    )
    return new DataView(buffer)
  }
  const View = view.constructor as new (
    source: ArrayBufferView
  ) => ArrayBufferView
  return new View(view)
}

function stampArrayBufferView(view: ArrayBufferView): ArrayBufferView {
  // Always clone. Unlike Blob/ArrayBuffer/Date, TypedArrays get a large set of
  // own method props for JSONata readability; keep that decoration off the
  // caller's instance.
  const target = cloneArrayBufferView(view)

  let prototype = Object.getPrototypeOf(target)
  while (prototype && prototype !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (
        name === 'constructor' ||
        Object.prototype.hasOwnProperty.call(target, name)
      ) {
        continue
      }
      let member: unknown
      try {
        member = Reflect.get(target, name)
      } catch {
        continue
      }
      if (typeof member === 'function') {
        const method = member
        stampOwnProp(target, name, (...args: unknown[]) => {
          const result = Reflect.apply(method, target, args)
          return ArrayBuffer.isView(result)
            ? stampArrayBufferView(result)
            : result
        })
      } else if (name === 'buffer' && member instanceof ArrayBuffer) {
        // Best-effort stamp for bytes.buffer.byteLength, but never replace the
        // view's buffer with a wrapper object.
        stampNativeInstance(member)
        stampOwnProp(target, name, member)
      } else {
        stampOwnProp(target, name, member)
      }
    }
    prototype = Object.getPrototypeOf(prototype)
  }
  markStamped(target)
  return target
}

// Host `new Date()` (e.g. sync_job_run.started_at) — stamp methods as own props
// so JSONata 2.2 can call them, but keep the real Date (unlike URL/Response
// wrappers). That preserves instanceof / lodash isDate for $jsonToParquet and
// other custom functions that receive the value mid-expression.
function stampDateInstance(date: Date): Date {
  if ((date as unknown as Record<symbol, unknown>)[STAMPED]) {
    return date
  }
  // Frozen/sealed host Dates cannot receive own methods. Clone only in that
  // exceptional case so the expression still receives a real Date.
  const target = Object.isExtensible(date) ? date : new Date(date.getTime())
  const methods = [
    'toISOString',
    'getTime',
    'getFullYear',
    'getMonth',
    'getDate',
    'getUTCFullYear',
    'getUTCMonth',
    'getUTCDate',
    'getUTCHours',
    'getUTCMinutes',
    'getUTCSeconds',
    'getUTCMilliseconds',
  ] as const
  for (const name of methods) {
    stampOwnProp(target, name, target[name].bind(target))
  }
  markStamped(target)
  return target
}

/**
 * Make native inputs readable by JSONata 2.2 expressions (which only see own
 * properties): stamp Blob/File/ArrayBuffer/Date in place where possible, and
 * mirror URL/Response/ReadableStream. Frozen values fall back to wrappers or a
 * same-type Date clone. Traversal is cycle-safe and copy-on-write; already-safe
 * wrappers and unrelated opaque host objects are left alone.
 */
function mirrorNativeInput<T>(value: T): T {
  return mirrorNativeInputInner(value, new WeakMap()) as T
}

function mirrorNativeInputInner(
  value: unknown,
  seen: WeakMap<object, unknown>
): unknown {
  if (!value || typeof value !== 'object') {
    return value
  }
  // already a JSONata-safe wrapper: readable as-is, don't walk its methods
  if (unwrapNative(value) !== value) {
    return value
  }
  if (value instanceof Blob || value instanceof ArrayBuffer) {
    return stampNativeInstance(value)
  }
  if (ArrayBuffer.isView(value)) {
    return stampArrayBufferView(value)
  }
  if (isDate(value)) {
    return stampDateInstance(value as Date)
  }
  if (DateTime.isDateTime(value)) {
    return toJsonataDateTime(value)
  }
  if (value instanceof URL) {
    return toJsonataUrl(value)
  }
  if (typeof Response !== 'undefined' && value instanceof Response) {
    return jsonataSafeResponse(value)
  }
  if (
    typeof ReadableStream !== 'undefined' &&
    value instanceof ReadableStream
  ) {
    return toJsonataReadableStream(value)
  }
  const visited = seen.get(value)
  if (visited) return visited
  if (isArray(value)) {
    const items = value
    const out: unknown[] = []
    seen.set(value, out)
    let changed = false
    for (let i = 0; i < items.length; i++) {
      const next = mirrorNativeInputInner(items[i], seen)
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
    let changed = false
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const next = mirrorNativeInputInner(record[key], seen)
      // Define rather than assign so a data key named "__proto__" stays data.
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

export default mirrorNativeInput
