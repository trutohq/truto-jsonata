import { describe, expect, it } from 'vitest'
import bufferToString from '../functions/bufferToString'

describe('bufferToString', () => {
  it('should convert a buffer to a string', async () => {
    const buffer = Buffer.from('Hello, world!')
    expect(await bufferToString(buffer, 'utf-8')).toBe('Hello, world!')
  })
  it('should convert a buffer to a string with a specified encoding', async () => {
    const buffer = Buffer.from('Hello, world!')
    expect(await bufferToString(buffer, 'base64')).toBe('SGVsbG8sIHdvcmxkIQ==')
  })
  it('should convert a readable stream to a string', async () => {
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue('Hello, ')
        controller.enqueue('world!')
        controller.close()
      },
    })
    expect(await bufferToString(readableStream, 'utf-8')).toBe('Hello, world!')
  })
})
