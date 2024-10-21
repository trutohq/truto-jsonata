import { describe, expect, it } from 'vitest'
import decodebase64 from '../functions/base64decode'

describe('decodebase64', () => {
  it('should decode a valid base64 string', () => {
    const base64String = 'SGVsbG8gd29ybGQ='
    const expectedOutput = 'Hello world'
    const result = decodebase64(base64String)
    expect(result).toBe(expectedOutput)
  })

  it('should handle an empty base64 string', () => {
    const base64String = ''
    const expectedOutput = ''
    const result = decodebase64(base64String)
    expect(result).toBe(expectedOutput)
  })

  it('should handle a base64 string with special characters', () => {
    const base64String = 'U3BlY2lhbCBjaGFyYWN0ZXJzOiAhQCMkJV4mKigpXys9'
    const expectedOutput = 'Special characters: !@#$%^&*()_+='
    const result = decodebase64(base64String)
    expect(result).toBe(expectedOutput)
  })

  it('should throw an error for an invalid base64 string', () => {
    const invalidBase64String = 'Invalid base64'
    expect(() => decodebase64(invalidBase64String)).toThrow()
  })
})
