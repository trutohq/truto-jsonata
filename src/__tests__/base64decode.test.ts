import { describe, expect, it } from 'vitest'
import base64decode from '../functions/base64decode'

describe('decodebase64', () => {
  it('should decode a valid base64 string', () => {
    const base64String = 'SGVsbG8gd29ybGQ='
    const expectedOutput = 'Hello world'
    const result = base64decode(base64String)
    expect(result).toBe(expectedOutput)
  })

  it('should handle an empty base64 string', () => {
    const base64String = ''
    const expectedOutput = ''
    const result = base64decode(base64String)
    expect(result).toBe(expectedOutput)
  })

  it('should handle a base64 string with special characters', () => {
    const base64String = 'U3BlY2lhbCBjaGFyYWN0ZXJzOiAhQCMkJV4mKigpXys9'
    const expectedOutput = 'Special characters: !@#$%^&*()_+='
    const result = base64decode(base64String)
    expect(result).toBe(expectedOutput)
  })


  it('should decode a URL-safe base64 string', () => {
    const base64String = 'aHR0cHM6Ly9leGFtcGxlLmNvbS8_cXVlcnk9YmFzZTY0'
    const expectedOutput = 'https://example.com/?query=base64'
    const result = base64decode(base64String, true)
    expect(result).toBe(expectedOutput)
  })

  it('should throw an error for an invalid base64 string', () => {
    const invalidBase64String = 'Invalid base64'
    expect(() => base64decode(invalidBase64String)).toThrow()
  })
  
})
