/// <reference types="@cloudflare/workers-types" />

import { toJsonataReadableStream } from './toJsonataReadableStream'
import { unwrapReadableStream } from './unwrapNative'

async function teeStream(stream: ReadableStream) {
  const nativeStream = unwrapReadableStream(stream) ?? stream
  const [a, b] = nativeStream.tee()
  return [toJsonataReadableStream(a), toJsonataReadableStream(b)]
}

export default teeStream
