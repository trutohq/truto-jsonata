import { describe, expect, it } from 'vitest'
import { recursiveCharacterTextSplitter } from '../functions/recursiveCharacterTextSplitter'

describe('recursiveCharacterTextSplitter', () => {
  it('should split a string with the provided chunkSize/chunkOverlap', async () => {
    const text = Array.from({ length: 50 }, (_, i) =>
      String.fromCharCode(65 + (i % 26))
    ).join('')

    const chunks = await recursiveCharacterTextSplitter(text, {
      chunkSize: 10,
      chunkOverlap: 2,
    })

    // With step = chunkSize - chunkOverlap = 8, indices: 0,8,16,24,32,40 => 6 chunks
    expect(chunks).toHaveLength(6)
    expect(chunks.every((c) => c.length <= 10)).toBe(true)

    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].slice(0, 2)).toBe(chunks[i - 1].slice(-2))
    }
  })

  it('should JSON.stringify plain objects (pretty printed) before splitting', async () => {
    const input = { a: 1, b: { c: 'x' } }
    const expected = JSON.stringify(input, null, 2)

    const chunks = await recursiveCharacterTextSplitter(input, {
      chunkSize: 10_000,
      chunkOverlap: 0,
    })

    expect(chunks).toEqual([expected])
  })

  it('should JSON.stringify arrays (pretty printed) before splitting', async () => {
    const input = [{ a: 1 }, { b: 2 }]
    const expected = JSON.stringify(input, null, 2)

    const chunks = await recursiveCharacterTextSplitter(input, {
      chunkSize: 10_000,
      chunkOverlap: 0,
    })

    expect(chunks).toEqual([expected])
  })

  it('should stringify non-string/non-plain-object/non-array values via lodash toString', async () => {
    const chunks = await recursiveCharacterTextSplitter(123 as unknown as any, {
      chunkSize: 10_000,
      chunkOverlap: 0,
    })

    expect(chunks).toEqual(['123'])
  })
})


