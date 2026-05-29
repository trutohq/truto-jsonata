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
})
