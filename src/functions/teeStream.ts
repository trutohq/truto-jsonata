/// <reference types="@cloudflare/workers-types" />

import { toJsonataReadableStream } from './toJsonataReadableStream'

async function teeStream(stream: ReadableStream) {
  const [a, b] = stream.tee()
  return [toJsonataReadableStream(a), toJsonataReadableStream(b)]
}

export default teeStream
