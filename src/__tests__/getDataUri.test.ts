import { describe, expect, it } from 'vitest'
import getDataUri from '../functions/getDataUri'

describe('getDataUri', () => {
  it('should return a data URI from a blob', async () => {
    const blob = new Blob(['Hello, world!'], { type: 'text/plain' })
    const dataUri = await getDataUri(blob, 'text/plain')
    expect(dataUri).toBe('data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==')
  })
  it('show throw error if mime type is not provided', async () => {
    const blob = new Blob(['Hello, world!'], { type: 'text/plain' })
    await expect(getDataUri(blob, '')).rejects.toThrow('Mime type is required')
  })
})
