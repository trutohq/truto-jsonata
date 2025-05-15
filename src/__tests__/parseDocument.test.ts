// parseDocument.test.ts
import { describe, test, expect, vi, afterEach } from 'vitest'
import parseDocument from '../functions/parseDocument'
import { Focus } from 'jsonata'

// --- Set up module mocks ---
vi.mock('node-fetch', () => ({
  default: vi.fn(),
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
  test('parses a document using the document parser API', async () => {
    const text = 'Hello, world!'
    const stream = new FakeReadableStream([new TextEncoder().encode(text)])

    // Mock the Focus context
    const focus = {
      environment: {
        lookup: vi.fn((key: string) => {
          if (key === 'documentParserApiUrl') return 'http://api.example.com'
          if (key === 'documentParserApiKey') return 'test-api-key'
          return null
        }),
      },
    } as unknown as Focus

    // Mock the fetch response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: text }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await parseDocument.call(focus, stream, 'text/plain')

    expect(mockFetch).toHaveBeenCalledWith('http://api.example.com/parse', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'text/plain',
        'user-agent': 'truto',
        Authorization: 'Bearer test-api-key',
      },
      body: stream,
    })
    expect(result).toEqual(text)
  })

  test('throws error when API key is missing', async () => {
    const stream = new FakeReadableStream([new TextEncoder().encode('test')])

    const focus = {
      environment: {
        lookup: vi.fn((key: string) => {
          if (key === 'documentParserApiUrl') return 'http://api.example.com'
          return null
        }),
      },
    } as unknown as Focus

    await expect(
      parseDocument.call(focus, stream, 'text/plain')
    ).rejects.toThrow('API key not found in environment')
  })
})
