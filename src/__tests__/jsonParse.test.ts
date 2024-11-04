import jsonParse from '../functions/jsonParse'
import { describe, expect, it } from 'vitest'

describe('jsonParse', () => {
  it('should parse valid JSON string', () => {
    const jsonString = '{"name": "John", "age": 30}'
    const result = jsonParse(jsonString)
    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('should return null for invalid JSON string', () => {
    const invalidJsonString = '{"name": "John", "age": 30'
    const result = jsonParse(invalidJsonString)
    expect(result).toBeNull()
  })

  it('should return null for empty string', () => {
    const emptyString = ''
    const result = jsonParse(emptyString)
    expect(result).toBeNull()
  })

  it('should parse JSON string with array', () => {
    const jsonString = '["apple", "banana", "cherry"]'
    const result = jsonParse(jsonString)
    expect(result).toEqual(['apple', 'banana', 'cherry'])
  })

  it('should parse JSON string with nested objects', () => {
    const jsonString =
      '{"person": {"name": "John", "age": 30}, "city": "New York"}'
    const result = jsonParse(jsonString)
    expect(result).toEqual({
      person: { name: 'John', age: 30 },
      city: 'New York',
    })
  })
})
