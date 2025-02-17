import { parseOfficeAsync } from 'officeparser'
import { resolvePDFJS } from 'pdfjs-serverless'
import { get, includes, join } from 'lodash-es'
import bufferToString from './bufferToString'

async function parsePdf(buffer: Buffer) {
  const data = buffer.buffer.slice(
    buffer?.byteOffset,
    buffer?.byteOffset + buffer?.byteLength
  )
  const { getDocument } = await resolvePDFJS()
  const doc = await getDocument({
    data,
    useSystemFonts: true,
  }).promise

  // Get metadata and initialize output object
  const output = []

  // Iterate through each page and fetch the text content
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    const contents = textContent.items.map(item => get(item, 'str')).join(' ')

    // Add page content to output
    if (contents) output.push(join([`Page Number: ${i}`, contents], '/\n'))
  }

  // Return the results as JSON
  return join(output, '\n')
}

async function parseDocument(
  file: string | Buffer | ReadableStream,
  fileType: string
) {
  let buffer
  if (file instanceof ReadableStream) {
    const chunks = []
    for await (const chunk of file) {
      chunks.push(Buffer.from(chunk))
    }
    buffer = Buffer.concat(chunks)
  }
  if (
    includes(
      [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
      ],
      fileType
    )
  ) {
    return await parseOfficeAsync(buffer as Buffer)
  }
  if (fileType === 'application/pdf') {
    return await parsePdf(buffer as Buffer)
  }
  return bufferToString(buffer as Buffer, 'utf-8')
}
export default parseDocument
