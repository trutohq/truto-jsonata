import { NATIVE_BLOB } from './unwrapNative'
import { toJsonataReadableStream } from './toJsonataReadableStream'

export type JsonataBlob = ReturnType<typeof toJsonataBlob>

export function toJsonataBlob(blob: Blob) {
  const value = {
    size: blob.size,
    type: blob.type,
    arrayBuffer: () => blob.arrayBuffer(),
    text: () => blob.text(),
    slice: (start?: number, end?: number, contentType?: string) =>
      toJsonataBlob(blob.slice(start, end, contentType)),
    stream: () => toJsonataReadableStream(blob.stream()),
  }
  Object.defineProperty(value, NATIVE_BLOB, { value: blob, enumerable: false })
  return value
}
