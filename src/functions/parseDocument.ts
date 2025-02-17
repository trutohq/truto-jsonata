import { parseOfficeAsync } from 'officeparser'
import { fileTypeFromBuffer } from 'file-type'
import { resolvePDFJS } from 'pdfjs-serverless'
import { get, join } from "lodash-es";
import { isText } from 'istextorbinary'


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
    const contents = textContent.items.map(item  => get(item,'str')).join(' ')

    // Add page content to output
    if(contents) output.push(join([`Page Number: ${i}`, contents], '/\n'))
  }

  // Return the results as JSON
  return join(output, '\n')
}

async function parseDocument(file: string | Buffer | ReadableStream  ) {
  if (file instanceof ReadableStream) {
    const chunks = []
    for await (const chunk of file) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)
    const fileExt = (await fileTypeFromBuffer(buffer))?.ext
    if(isText(null, buffer)) {
      return buffer.toString('utf-8')
    }
    if (fileExt === 'pdf') {
      return await parsePdf(buffer)
    }

    return await parseOfficeAsync(buffer)
  }

  return await parseOfficeAsync(file)
}
export default parseDocument
