/// <reference types="@cloudflare/workers-types" />

import { unwrapNative, unwrapReadableStream } from './unwrapNative'

async function bufferToString(
  value: Buffer | ReadableStream | unknown,
  encoding: BufferEncoding | undefined
) {
  const stream = unwrapReadableStream(value)
  if (stream) {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks as readonly Uint8Array[])
    return buffer.toString(encoding)
  }
  const raw = unwrapNative(value)
  if (raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
    return Buffer.from(raw as Buffer).toString(encoding)
  }
  if (raw === null || raw === undefined) {
    throw new Error('Unsupported value type for bufferToString')
  }
  // Anything else: 2.x called value.toString(encoding) (a string comes back
  // unchanged, an object as '[object Object]', a DateTime as ISO text).
  return (raw as { toString(encoding?: string): string }).toString(encoding)
}

export default bufferToString
