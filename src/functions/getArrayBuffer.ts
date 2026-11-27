import { toJsonataArrayBuffer } from './toJsonataArrayBuffer'
import { unwrapNative } from './unwrapNative'

// Anything with an arrayBuffer() method, as in 2.0: a Blob or File, and also a
// Response or Request.
async function getArrayBuffer(file?: unknown) {
  const native = unwrapNative(file) as { arrayBuffer?: unknown } | undefined
  if (!native || typeof native !== 'object') return undefined
  if (typeof native.arrayBuffer !== 'function') return undefined
  return toJsonataArrayBuffer(
    await (native.arrayBuffer as () => Promise<ArrayBuffer>)()
  )
}

export default getArrayBuffer
