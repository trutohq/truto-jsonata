import { unwrapNative } from './unwrapNative'

function base64encode(value: string | ArrayBufferLike | Uint8Array, urlSafe = false): string {
  // $jsonToParquet/$getArrayBuffer return a wrapper; 2.x passed the raw bytes.
  const input = unwrapNative(value) as string | ArrayBufferLike | Uint8Array
  let bytes: Uint8Array
  if (
    input instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer)
  ) {
    bytes = new Uint8Array(input)
  } else if (input instanceof Uint8Array) {
    bytes = input
  } else {
    bytes = new TextEncoder().encode(input as string)
  }
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)))
  }
  let base64 = btoa(binary)
  if (urlSafe) {
    base64 = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  return base64
}

export default base64encode
