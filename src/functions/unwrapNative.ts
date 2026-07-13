import type { DateTime } from 'luxon'
import type { DepGraph } from 'dependency-graph'

export const NATIVE_BLOB = Symbol('nativeBlob')
export const NATIVE_ARRAY_BUFFER = Symbol('nativeArrayBuffer')
export const NATIVE_READABLE_STREAM = Symbol('nativeReadableStream')
export const NATIVE_READABLE_STREAM_READER = Symbol('nativeReadableStreamReader')
export const NATIVE_DEP_GRAPH = Symbol('nativeDepGraph')
export const NATIVE_LUXON_DATE_TIME = Symbol('luxonDateTime')
export const NATIVE_URL = Symbol('nativeUrl')
/** Host `Date` mirrored for JSONata 2.2 (own-property methods); not Luxon. */
export const NATIVE_DATE = Symbol('nativeDate')

export function unwrapNative(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value
  }
  const record = value as Record<symbol, unknown>
  if (NATIVE_BLOB in record) return record[NATIVE_BLOB]
  if (NATIVE_ARRAY_BUFFER in record) return record[NATIVE_ARRAY_BUFFER]
  if (NATIVE_READABLE_STREAM in record) return record[NATIVE_READABLE_STREAM]
  if (NATIVE_READABLE_STREAM_READER in record) {
    return record[NATIVE_READABLE_STREAM_READER]
  }
  if (NATIVE_DEP_GRAPH in record) return record[NATIVE_DEP_GRAPH]
  if (NATIVE_LUXON_DATE_TIME in record) return record[NATIVE_LUXON_DATE_TIME]
  if (NATIVE_URL in record) return record[NATIVE_URL]
  if (NATIVE_DATE in record) return record[NATIVE_DATE]
  return value
}

export function unwrapBlob(value: unknown): Blob | undefined {
  const unwrapped = unwrapNative(value)
  return unwrapped instanceof Blob ? unwrapped : undefined
}

export function unwrapArrayBuffer(value: unknown): ArrayBuffer | undefined {
  const unwrapped = unwrapNative(value)
  return unwrapped instanceof ArrayBuffer ? unwrapped : undefined
}

export function unwrapReadableStream(
  value: unknown
): ReadableStream | undefined {
  const unwrapped = unwrapNative(value)
  return unwrapped instanceof ReadableStream ? unwrapped : undefined
}

export function unwrapDepGraph(value: unknown): DepGraph<unknown> | undefined {
  const unwrapped = unwrapNative(value)
  if (
    unwrapped &&
    typeof unwrapped === 'object' &&
    typeof (unwrapped as DepGraph<unknown>).overallOrder === 'function'
  ) {
    return unwrapped as DepGraph<unknown>
  }
  return undefined
}

export function unwrapDateTime(value: unknown): DateTime | undefined {
  const unwrapped = unwrapNative(value)
  if (
    unwrapped &&
    typeof unwrapped === 'object' &&
    'isValid' in unwrapped &&
    typeof (unwrapped as DateTime).toISO === 'function'
  ) {
    return unwrapped as DateTime
  }
  return undefined
}

export function unwrapUrl(value: unknown): URL | undefined {
  const unwrapped = unwrapNative(value)
  return unwrapped instanceof URL ? unwrapped : undefined
}

export function unwrapDate(value: unknown): Date | undefined {
  const unwrapped = unwrapNative(value)
  return unwrapped instanceof Date ? unwrapped : undefined
}
