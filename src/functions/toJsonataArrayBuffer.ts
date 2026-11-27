import { toJsonataNative } from './toJsonataNative'

export function toJsonataArrayBuffer(buffer: ArrayBuffer) {
  return toJsonataNative(buffer)
}
