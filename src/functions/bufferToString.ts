/// <reference types="@cloudflare/workers-types" />

import { unwrapReadableStream } from './unwrapNative'

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
  if (value instanceof Buffer || value instanceof Uint8Array) {
    return Buffer.from(value as Buffer).toString(encoding)
  }
  throw new Error('Unsupported value type for bufferToString')
}

export default bufferToString
