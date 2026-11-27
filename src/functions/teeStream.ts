/// <reference types="@cloudflare/workers-types" />

import { toJsonataReadableStream } from './toJsonataReadableStream'
import { unwrapReadableStream } from './unwrapNative'

async function teeStream(stream: ReadableStream) {
  // Same names as 2.0, so a bad argument fails with the same message
  // ("stream.tee is not a function").
  stream = unwrapReadableStream(stream) ?? stream
  const pair = stream.tee()
  return [toJsonataReadableStream(pair[0]), toJsonataReadableStream(pair[1])]
}

export default teeStream
