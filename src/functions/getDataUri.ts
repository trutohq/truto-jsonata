import { ReadableStream } from 'node:stream/web'
import { fileTypeFromBuffer } from 'file-type'

async function getDataUri(file: Blob | Buffer | ReadableStream) {
  if (file instanceof ReadableStream) {
    const chunks = []
    for await (const chunk of file) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)
    const base64Image = buffer.toString('base64')
    const mimeType = (await fileTypeFromBuffer(buffer))?.mime

    // Construct the data URI for a PNG image
    return `data:${mimeType};base64,${base64Image}`
  }
  const arrayBuffer = file instanceof Blob ? await file.arrayBuffer() : file
  const buffer = Buffer.from(arrayBuffer)
  const base64Image = buffer.toString('base64')
  const mimeType = (await fileTypeFromBuffer(buffer))?.mime

  return `data:${mimeType};base64,${base64Image}`
}
export default getDataUri
