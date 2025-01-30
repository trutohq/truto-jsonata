import { ReadableStream } from 'node:stream/web'
import { parseOfficeAsync } from 'officeparser'

async function parseDocument(file: string | Buffer | ReadableStream) {
  if (file instanceof ReadableStream) {
    const chunks = []
    for await (const chunk of file) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)
    return await parseOfficeAsync(buffer)
  }

  return await parseOfficeAsync(file)
}
export default parseDocument
