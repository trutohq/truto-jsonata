/// <reference types="@cloudflare/workers-types" />

async function bufferToString(
  value: Buffer | ReadableStream,
  encoding: BufferEncoding | undefined
) {
  if (value instanceof ReadableStream) {
    const chunks: Buffer[] = []
    for await (const chunk of value) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks as readonly Uint8Array[])
    return buffer.toString(encoding)
  }
  return value.toString(encoding)
}

export default bufferToString
