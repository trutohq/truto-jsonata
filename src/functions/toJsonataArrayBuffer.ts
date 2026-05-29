import { NATIVE_ARRAY_BUFFER } from './unwrapNative'

export type JsonataArrayBuffer = ReturnType<typeof toJsonataArrayBuffer>

export function toJsonataArrayBuffer(buffer: ArrayBuffer) {
  return {
    byteLength: buffer.byteLength,
    slice: (start?: number, end?: number) =>
      toJsonataArrayBuffer(buffer.slice(start, end)),
    [NATIVE_ARRAY_BUFFER]: buffer,
  }
}
