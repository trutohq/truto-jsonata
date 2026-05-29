import { NATIVE_BLOB } from './unwrapNative'
import { toJsonataReadableStream } from './toJsonataReadableStream'

export type JsonataBlob = ReturnType<typeof toJsonataBlob>

export function toJsonataBlob(blob: Blob) {
  return {
    size: blob.size,
    type: blob.type,
    arrayBuffer: () => blob.arrayBuffer(),
    text: () => blob.text(),
    slice: (start?: number, end?: number, contentType?: string) =>
      toJsonataBlob(blob.slice(start, end, contentType)),
    stream: () => toJsonataReadableStream(blob.stream()),
    [NATIVE_BLOB]: blob,
  }
}
