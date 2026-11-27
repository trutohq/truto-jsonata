import { NATIVE_ARRAY_BUFFER, NATIVE_BLOB } from './unwrapNative'
import { toJsonataReadableStream } from './toJsonataReadableStream'

// Wrappers for binary INPUT the host passes in (an ArrayBuffer or frozen Blob
// that cannot be stamped, a Response body): a fixed set of own members. Values
// Truto functions return use toJsonataNative instead.

export function toInputArrayBuffer(buffer: ArrayBuffer) {
  const value = {
    byteLength: buffer.byteLength,
    slice: (start?: number, end?: number) =>
      toInputArrayBuffer(buffer.slice(start ?? 0, end)),
  }
  Object.defineProperty(value, NATIVE_ARRAY_BUFFER, {
    value: buffer,
    enumerable: false,
  })
  return value
}

export function toInputBlob(blob: Blob, extraProps?: Record<string, unknown>) {
  // The host gets the native Blob back once evaluation ends, so put extra
  // props such as `name` on it too. Props the Blob already has (a File's own
  // `name`) are left alone.
  if (extraProps) {
    for (const [key, value] of Object.entries(extraProps)) {
      if (key in blob) continue
      try {
        Object.defineProperty(blob, key, {
          value,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      } catch {
        // a frozen Blob keeps the prop on the wrapper only
      }
    }
  }
  const value = {
    size: blob.size,
    type: blob.type,
    arrayBuffer: () => blob.arrayBuffer(),
    text: () => blob.text(),
    slice: (start?: number, end?: number, contentType?: string) =>
      toInputBlob(blob.slice(start, end, contentType)),
    stream: () => toJsonataReadableStream(blob.stream()),
    ...extraProps,
  }
  Object.defineProperty(value, NATIVE_BLOB, { value: blob, enumerable: false })
  return value
}
