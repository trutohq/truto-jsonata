import { describe, expect, it } from 'vitest'
import teeStream from '../functions/teeStream'
import { unwrapReadableStream } from '../functions/unwrapNative'

describe('teeStream', () => {
  it('returns jsonata-safe stream pair', async () => {
    const stream = new ReadableStream()
    const teed = await teeStream(stream)
    expect(teed).toHaveLength(2)
    expect(teed[0].locked).toBe(false)
    expect(unwrapReadableStream(teed[0])).toBeInstanceOf(ReadableStream)
  })

  it('getReader reads enqueued bytes', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hi'))
        controller.close()
      },
    })
    const [branch] = await teeStream(stream)
    const reader = branch.getReader()
    const { done } = await reader.read()
    expect(done).toBe(false)
    reader.releaseLock()
  })
})
