import { describe, expect, it } from 'vitest'
import base64ToBlob from '../functions/base64ToBlob'

describe('base64ToBlob', () => {
  it('should convert a valid base64 string to a Blob', () => {
    const base64String = 'SGVsbG8gd29ybGQ=' // "Hello world"
    const result = base64ToBlob(base64String)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/octet-stream')
    expect(result.size).toBe(11) // "Hello world" is 11 bytes
  })

  it('should handle empty base64 string', () => {
    const result = base64ToBlob('')

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/octet-stream')
    expect(result.size).toBe(0)
  })

  it('should handle null or undefined input', () => {
    const result1 = base64ToBlob(null as any)
    const result2 = base64ToBlob(undefined as any)

    expect(result1).toBeInstanceOf(Blob)
    expect(result1.size).toBe(0)
    expect(result2).toBeInstanceOf(Blob)
    expect(result2.size).toBe(0)
  })

  it('should handle non-string input', () => {
    const result = base64ToBlob(123 as any)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBe(0)
  })

  it('should convert base64 with custom MIME type', () => {
    const base64String = 'SGVsbG8gd29ybGQ='
    const result = base64ToBlob(base64String, { mimeType: 'text/plain' })

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('text/plain')
    expect(result.size).toBe(11)
  })

  it('should handle data URI format', () => {
    const dataUri = 'data:text/plain;base64,SGVsbG8gd29ybGQ='
    const result = base64ToBlob(dataUri)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('text/plain')
    expect(result.size).toBe(11)
  })

  it('should handle data URI with image MIME type', () => {
    // Base64 for a 1x1 transparent PNG
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    const result = base64ToBlob(dataUri)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('image/png')
    expect(result.size).toBeGreaterThan(0)
  })

  it('should handle URL-safe base64', () => {
    const urlSafeBase64 = 'aHR0cHM6Ly9leGFtcGxlLmNvbS8_cXVlcnk9YmFzZTY0' // URL-safe version
    const result = base64ToBlob(urlSafeBase64, { urlSafe: true })

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBeGreaterThan(0)
  })

  it('should handle base64 string with missing padding', () => {
    const base64WithoutPadding = 'SGVsbG8gd29ybGQ' // Missing '='
    const result = base64ToBlob(base64WithoutPadding)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBe(11)
  })

  it('should handle base64 string with whitespace', () => {
    const base64WithWhitespace = '  SGVsbG8gd29ybGQ=  '
    const result = base64ToBlob(base64WithWhitespace)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBe(11)
  })

  it('should throw error for invalid base64 string', () => {
    const invalidBase64 = 'Invalid base64!'

    expect(() => base64ToBlob(invalidBase64)).toThrow('Invalid base64 string')
  })

  it('should throw error for invalid data URI format', () => {
    const invalidDataUri = 'data:text/plain,not-base64'

    expect(() => base64ToBlob(invalidDataUri)).toThrow(
      'Invalid data URI format'
    )
  })

  it('should handle binary data (PDF header)', () => {
    const pdfHeaderBase64 = 'JVBERi0xLjQ=' // "%PDF-1.4"
    const result = base64ToBlob(pdfHeaderBase64, {
      mimeType: 'application/pdf',
    })

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
    expect(result.size).toBe(8)
  })

  it('should handle special characters in base64', () => {
    const specialCharsBase64 = 'U3BlY2lhbCBjaGFyYWN0ZXJzOiAhQCMkJV4mKigpXys9' // "Special characters: !@#$%^&*()_+="
    const result = base64ToBlob(specialCharsBase64)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBe(33)
  })

  it('should handle Unicode characters in base64', () => {
    const unicodeBase64 = '44GT44KT44Gr44Gh44Gv5LiW55WM' // "こんにちは世界" (Japanese "Hello world")
    const result = base64ToBlob(unicodeBase64, {
      mimeType: 'text/plain; charset=utf-8',
    })

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('text/plain; charset=utf-8')
    expect(result.size).toBeGreaterThan(0)
  })

  it('should return blob content that can be read back', async () => {
    const originalText = 'Hello world'
    const base64String = 'SGVsbG8gd29ybGQ='
    const result = base64ToBlob(base64String, { mimeType: 'text/plain' })

    const text = await result.text()
    expect(text).toBe(originalText)
  })

  it('should handle very long base64 strings', () => {
    // Create a long base64 string (repeated "Hello world")
    const repeatedText = 'Hello world'.repeat(100)
    const longBase64 = btoa(repeatedText)
    const result = base64ToBlob(longBase64)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBe(repeatedText.length)
  })
})
