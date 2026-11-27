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
 * Make native inputs readable by JSONata 2.2 expressions (which only see own
 * properties): stamp Blob/File/ArrayBuffer/Date in place where possible, and
 * mirror URL/Response/ReadableStream. Frozen values fall back to wrappers or a
 * same-type Date clone. Traversal is cycle-safe and copy-on-write; already-safe
 * wrappers and unrelated opaque host objects are left alone.
 */
function mirrorNativeInput<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  const walk: Walk = {
    seen: new Map(),
    backRefs: 0,
    eager: false,
  }
  const result = mirrorNativeInputInner(value, walk)
  if (result === value || walk.backRefs === 0) return result as T
  // A cycle that changes: walk again, copying containers before their
  // children so back-references reach the copies.
  return mirrorNativeInputInner(value, {
    seen: new Map(),
    backRefs: 0,
    eager: true,
  }) as T
}

function mirrorNativeInputInner(value: unknown, walk: Walk): unknown {
  if (!value || typeof value !== 'object') {
    return value
  }
  const seen = walk.seen.get(value)
  if (seen !== undefined) {
    if (seen === value) walk.backRefs++
    return seen
  }

  // Plain JSON (arrays and Object.prototype objects) is almost all of any
  // input, so test for it first and walk it without allocating; a container
  // is copied only once a child actually changes.
  if (Array.isArray(value)) {
    let out: unknown[] | undefined = walk.eager ? [] : undefined
    walk.seen.set(value, out ?? value)
    for (let i = 0; i < value.length; i++) {
      const next = mirrorNativeInputInner(value[i], walk)
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
  const proto = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) {
    // already a JSONata-safe wrapper: readable as-is, don't walk its methods
    if (unwrapNative(value) !== value) return value
    return mirrorRecord(value as Record<string, unknown>, walk)
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
  // a plain object from another realm (lodash's wider definition)
  if (isPlainObject(value)) {
    if (unwrapNative(value) !== value) return value
    return mirrorRecord(value as Record<string, unknown>, walk)
  }
  return value
}

function mirrorRecord(record: Record<string, unknown>, walk: Walk): unknown {
  const out: Record<string, unknown> | undefined = walk.eager ? {} : undefined
  walk.seen.set(record, out ?? record)
  const keys = Object.keys(record)
  let next: unknown[] | undefined
  for (let i = 0; i < keys.length; i++) {
    const child = record[keys[i]]
    const mirrored = mirrorNativeInputInner(child, walk)
    if (next) {
      next[i] = mirrored
    } else if (mirrored !== child) {
      next = new Array(keys.length)
      for (let j = 0; j < i; j++) next[j] = record[keys[j]]
      next[i] = mirrored
    }
  }
  if (!out && !next) {
    return record
  }
  const copy = out ?? {}
  for (let i = 0; i < keys.length; i++) {
    // Define rather than assign so a data key named "__proto__" stays data.
    Object.defineProperty(copy, keys[i], {
      value: next ? next[i] : record[keys[i]],
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  walk.seen.set(record, copy)
  return copy
}

export default mirrorNativeInput
