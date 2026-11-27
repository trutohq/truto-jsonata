/// <reference types="@cloudflare/workers-types" />

import { unwrapBlob, unwrapNative, unwrapReadableStream } from './unwrapNative'

async function getDataUri(file: unknown, mimeType: string) {
  if (!mimeType) {
    throw new Error('Mime type is required')
  }

  const stream = unwrapReadableStream(file)
  if (stream) {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks as readonly Uint8Array[])
    const base64Image = buffer.toString('base64')
    return `data:${mimeType};base64,${base64Image}`
  }

  const blob = unwrapBlob(file)
  if (blob) {
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    return `data:${mimeType};base64,${base64Image}`
  }

  // 2.x took any Buffer.from input: bytes, an ArrayBuffer (also the wrapped
  // one from $jsonToParquet/$getArrayBuffer), an array of byte values or a
  // string.
  const raw = unwrapNative(file)
  if (
    raw instanceof Uint8Array ||
    raw instanceof ArrayBuffer ||
    Array.isArray(raw) ||
    typeof raw === 'string'
  ) {
    const buffer = Buffer.from(raw as Buffer)
    const base64Image = buffer.toString('base64')
    return `data:${mimeType};base64,${base64Image}`
  }

  throw new Error('Unsupported file type for getDataUri')
}

export default getDataUri
