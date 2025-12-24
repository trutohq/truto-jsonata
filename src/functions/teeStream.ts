/// <reference types="@cloudflare/workers-types" />

async function teeStream(stream: ReadableStream) {
  return stream.tee()
}
export default teeStream
