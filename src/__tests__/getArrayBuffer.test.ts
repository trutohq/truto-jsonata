import { File } from 'buffer'
import getArrayBuffer from '../functions/getArrayBuffer'
import { describe, expect, it } from 'vitest'

describe('getArrayBuffer', () => {
  it('should return an ArrayBuffer from a normal blob string', async () => {
    const testBlob = new Blob(['Hello, world!'], { type: 'text/plain' })
    const arrayBuffer = await getArrayBuffer(testBlob)

    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
    if (arrayBuffer) {
      expect(arrayBuffer.byteLength).toBe(testBlob.size)
    }
  })

  it('should return an ArrayBuffer from a file', async () => {
    const file = new File(['Hello, world!'], 'hello.txt', {
      type: 'text/plain',
    })
    const arrayBuffer = await getArrayBuffer(file)
    if (arrayBuffer) {
      expect(arrayBuffer.byteLength).toBe(file.size)
    }
    expect(arrayBuffer).toBeInstanceOf(ArrayBuffer)
  })
})
