import { toJsonataNative } from './toJsonataNative'

export function toJsonataBlob(
  blob: Blob,
  extraProps?: Record<string, unknown>
) {
  // 2.x returned the Blob itself with extra props such as `name` set on it,
  // and hosts read them for Content-Disposition, so set them on the Blob.
  // Props the Blob already has (a File's own `name`) are left alone.
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
        // a frozen Blob cannot take it
      }
    }
  }
  return toJsonataNative(blob)
}
