import getMimeType from '../functions/getMimeType'
import { describe, expect, it } from 'vitest'

describe('getMimeType', () => {
  it('should return the correct MIME type for a known extension', () => {
    expect(getMimeType('html')).toBe('text/html')
    expect(getMimeType('jpg')).toBe('image/jpeg')
    expect(getMimeType('png')).toBe('image/png')
  })

  it('should return null for an unknown extension', () => {
    expect(getMimeType('unknown')).toBeNull()
  })

  it('should return null for an empty string', () => {
    expect(getMimeType('')).toBeNull()
  })

  it('should return null for a null input', () => {
    expect(getMimeType(null as any)).toBeNull()
  })

  it('should return null for an undefined input', () => {
    expect(getMimeType(undefined as any)).toBeNull()
  })
})
