import { describe, expect, it } from 'vitest'

describe('teeStream', () => {
  it('should tee the stream', () => {
    const stream = new ReadableStream()
    const teedStream = stream.tee()
    console.log(teedStream)
    expect(teedStream).toBeInstanceOf(Array)
  })
})
