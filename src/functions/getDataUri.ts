/// <reference types="@cloudflare/workers-types" />

async function getDataUri(
  file: Blob | Buffer | ReadableStream,
  mimeType: string
) {
  if (!mimeType) {
    throw new Error('Mime type is required')
  }
  if (file instanceof ReadableStream) {
    const chunks: Buffer[] = []
    for await (const chunk of file) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks as readonly Uint8Array[])
    const base64Image = buffer.toString('base64')

    // Construct the data URI for a PNG image
    return `data:${mimeType};base64,${base64Image}`
  }
  const arrayBuffer = file instanceof Blob ? await file.arrayBuffer() : file
  const buffer = Buffer.from(arrayBuffer as ArrayBuffer)
  const base64Image = buffer.toString('base64')

  return `data:${mimeType};base64,${base64Image}`
}
export default getDataUri
