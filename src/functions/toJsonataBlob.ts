import { NATIVE_BLOB } from './unwrapNative'
import { toJsonataReadableStream } from './toJsonataReadableStream'

export function toJsonataBlob(
  blob: Blob,
  extraProps?: Record<string, unknown>
) {
  // The host gets the native Blob back once evaluation ends (deepUnwrapNative),
  // so put extra props such as `name` on it too: 2.x returned the Blob itself
  // with `name` set, and hosts read it for Content-Disposition. Props the Blob
  // already has (a File's own `name`) are left alone.
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
      toJsonataBlob(blob.slice(start, end, contentType)),
    stream: () => toJsonataReadableStream(blob.stream()),
    ...extraProps,
  }
  Object.defineProperty(value, NATIVE_BLOB, { value: blob, enumerable: false })
  return value
}
