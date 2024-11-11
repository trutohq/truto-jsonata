import base64encode from '../functions/base64encode'
import { describe, expect, it } from 'vitest'

describe('encodebase64', () => {
  it('should encode a valid string to base64', () => {
    const inputString = 'Hello world'
    const expectedOutput = 'SGVsbG8gd29ybGQ='
    const result = base64encode(inputString)
    expect(result).toBe(expectedOutput)
  })

  it('should handle an empty string', () => {
    const inputString = ''
    const expectedOutput = ''
    const result = base64encode(inputString)
    expect(result).toBe(expectedOutput)
  })

  it('should handle a string with special characters', () => {
    const inputString = 'Special characters: !@#$%^&*()_+='
    const expectedOutput = 'U3BlY2lhbCBjaGFyYWN0ZXJzOiAhQCMkJV4mKigpXys9'
    const result = base64encode(inputString)
    expect(result).toBe(expectedOutput)
  })

  it('should handle a string with non-ASCII characters', () => {
    const inputString = 'こんにちは世界'
    const expectedOutput = '44GT44KT44Gr44Gh44Gv5LiW55WM'
    const result = base64encode(inputString)
    expect(result).toBe(expectedOutput)
  })

  it('should handle a URL-safe base64 encoding', () => {
    const inputString = 'https://example.com/?query=base64'
    const expectedOutput = 'aHR0cHM6Ly9leGFtcGxlLmNvbS8_cXVlcnk9YmFzZTY0'
    const result = base64encode(inputString,true)
    expect(result).toBe(expectedOutput)
  })

})