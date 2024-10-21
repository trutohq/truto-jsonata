import JsonParsefunction from '../functions/jsonParse'
import { describe, expect, it } from 'vitest'

describe('JsonParsefunction', () => {
  it('should parse valid JSON string', () => {
    const jsonString = '{"name": "John", "age": 30}'
    const result = JsonParsefunction(jsonString)
    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('should return null for invalid JSON string', () => {
    const invalidJsonString = '{"name": "John", "age": 30'
    const result = JsonParsefunction(invalidJsonString)
    expect(result).toBeNull()
  })

  it('should return null for empty string', () => {
    const emptyString = ''
    const result = JsonParsefunction(emptyString)
    expect(result).toBeNull()
  })

  it('should parse JSON string with array', () => {
    const jsonString = '["apple", "banana", "cherry"]'
    const result = JsonParsefunction(jsonString)
    expect(result).toEqual(['apple', 'banana', 'cherry'])
  })

  it('should parse JSON string with nested objects', () => {
    const jsonString =
      '{"person": {"name": "John", "age": 30}, "city": "New York"}'
    const result = JsonParsefunction(jsonString)
    expect(result).toEqual({
      person: { name: 'John', age: 30 },
      city: 'New York',
    })
  })
})
