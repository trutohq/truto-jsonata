import { NATIVE_ARRAY_BUFFER } from './unwrapNative'

export function toJsonataArrayBuffer(buffer: ArrayBuffer) {
  const value = {
    byteLength: buffer.byteLength,
    slice: (start?: number, end?: number) =>
      toJsonataArrayBuffer(buffer.slice(start ?? 0, end)),
  }
  Object.defineProperty(value, NATIVE_ARRAY_BUFFER, {
    value: buffer,
    enumerable: false,
  })
  return value
}
