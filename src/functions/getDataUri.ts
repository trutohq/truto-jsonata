/// <reference types="@cloudflare/workers-types" />

import { unwrapBlob, unwrapReadableStream } from './unwrapNative'

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

  if (file instanceof Buffer || file instanceof Uint8Array) {
    const buffer = Buffer.from(file as Buffer)
    const base64Image = buffer.toString('base64')
    return `data:${mimeType};base64,${base64Image}`
  }

  throw new Error('Unsupported file type for getDataUri')
}

export default getDataUri
