// parseDocument.test.ts
import { describe, test, expect, vi, afterEach } from 'vitest'
import parseDocument from '../functions/parseDocument'
import { parseOfficeAsync } from 'officeparser'
import { resolvePDFJS } from 'pdfjs-serverless'

// --- Set up module mocks ---
vi.mock('officeparser', () => ({
  parseOfficeAsync: vi.fn(),
}))

vi.mock('pdfjs-serverless', () => ({
  resolvePDFJS: vi.fn(),
}))

// --- Helper: FakeReadableStream ---
// This class simulates a ReadableStream that yields Uint8Array chunks
class FakeReadableStream extends ReadableStream<Uint8Array> {
  constructor(chunks: Uint8Array[]) {
    super({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk)
        }
        controller.close()
      },
    })
  }
  async *[Symbol.asyncIterator]() {
    const reader = this.getReader()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}

// --- Clean up mocks after each test ---
afterEach(() => {
  vi.clearAllMocks()
})

describe('parseDocument with ReadableStream input', () => {
  test('parses a plain text file from a ReadableStream', async () => {
    const text = 'Hello, world!'
    // Create a stream that yields our text as a Uint8Array.
    const stream = new FakeReadableStream([new TextEncoder().encode(text)])

    // For any fileType that is not Office or PDF, parseDocument falls back to bufferToString.
    const result = await parseDocument(stream, 'text/plain')
    expect(result).toEqual(text)
  })

  test('parses an Office document from a ReadableStream', async () => {
    const officeContent = 'Office Document Content'
    // Make parseOfficeAsync resolve to our known output.
    ;(parseOfficeAsync as any).mockResolvedValueOnce(officeContent)

    const stream = new FakeReadableStream([
      new TextEncoder().encode('dummy office file data'),
    ])
    // Use one of the Office MIME types.
    const fileType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const result = await parseDocument(stream, fileType)
    expect(parseOfficeAsync).toHaveBeenCalled()
    expect(result).toEqual(officeContent)
  })

  test('parses a PDF document from a ReadableStream', async () => {
    // Create a fake PDF document with 2 pages.
    const fakePdfDocument = {
      numPages: 2,
      getPage: vi.fn((pageNum: number) =>
        Promise.resolve({
          getTextContent: vi.fn(() =>
            Promise.resolve({
              // Return one item per page with its "str" property.
              items: [{ str: `Page${pageNum}Text` }],
            })
          ),
        })
      ),
    }

    // When resolvePDFJS is called, return an object whose getDocument method resolves to our fake PDF doc.
    ;(resolvePDFJS as any).mockResolvedValueOnce({
      getDocument: vi.fn(() => ({
        promise: Promise.resolve(fakePdfDocument),
      })),
    })

    // The PDF stream (its binary content isn’t used by the fake PDF parser).
    const stream = new FakeReadableStream([new Uint8Array([1, 2, 3, 4])])
    const result = await parseDocument(stream, 'application/pdf')

    // The implementation joins page data as:
    // join([`Page Number: ${i}`, contents], '/\n') for each page,
    // then joins the pages with "\n".
    const expected = 'Page Number: 1/\nPage1Text\nPage Number: 2/\nPage2Text'
    expect(result).toEqual(expected)
  })
})
