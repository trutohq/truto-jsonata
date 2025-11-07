import { describe, expect, it } from 'vitest'
import jsonToCsv from '../functions/jsonToCsv'

describe('jsonToCsv', () => {
  describe('basic conversion', () => {
    it('should convert array of objects to CSV', () => {
      const json = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age","city"')
      expect(result).toContain('"John",30,"New York"')
      expect(result).toContain('"Jane",25,"Los Angeles"')
    })

    it('should convert single object to CSV', () => {
      const json = [{ name: 'John', age: 30, city: 'New York' }]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age","city"')
      expect(result).toContain('"John",30,"New York"')
    })

    it('should handle objects with different properties', () => {
      const json = [
        { name: 'John', age: 30 },
        { name: 'Jane', city: 'Los Angeles' },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age","city"')
      expect(result).toContain('"John",30,')
      expect(result).toContain('"Jane",,"Los Angeles"')
    })
  })

  describe('empty inputs', () => {
    it('should return empty string for empty array', () => {
      const json: Record<string, unknown>[] = []
      const result = jsonToCsv(json, {})
      expect(result).toBe('')
    })

    it('should return empty string for null', () => {
      const json = null as unknown as Record<string, unknown>[]
      const result = jsonToCsv(json, {})
      expect(result).toBe('')
    })

    it('should return empty string for undefined', () => {
      const json = undefined as unknown as Record<string, unknown>[]
      const result = jsonToCsv(json, {})
      expect(result).toBe('')
    })

    it('should return empty string for array with only null/undefined values', () => {
      const json = [null, undefined, null] as unknown as Record<
        string,
        unknown
      >[]
      const result = jsonToCsv(json, {})
      expect(result).toBe('')
    })
  })

  describe('options', () => {
    it('should use custom delimiter when provided', () => {
      const json = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]
      const result = jsonToCsv(json, { delimiter: ';' })
      expect(result).toContain('"name";"age"')
      expect(result).toContain('"John";30')
      expect(result).not.toContain('"name","age"')
    })

    it('should use custom headers when provided', () => {
      const json = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]
      const result = jsonToCsv(json, {
        fields: [
          { label: 'Full Name', value: 'name' },
          { label: 'Years', value: 'age' },
        ],
      })
      expect(result).toContain('"Full Name","Years"')
      expect(result).not.toContain('"name","age"')
    })

    it('should include header when header option is true', () => {
      const json = [{ name: 'John', age: 30 }]
      const result = jsonToCsv(json, { header: true })
      expect(result).toContain('"name","age"')
    })

    it('should exclude header when header option is false', () => {
      const json = [{ name: 'John', age: 30 }]
      const result = jsonToCsv(json, { header: false })
      expect(result).not.toContain('"name","age"')
      expect(result).toContain('"John",30')
    })
  })

  describe('special values', () => {
    it('should handle objects with nested values', () => {
      const json = [
        { name: 'John', details: { age: 30 } },
        { name: 'Jane', details: { age: 25 } },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","details"')
      expect(result).toContain('"John"')
      expect(result).toContain('"Jane"')
    })

    it('should handle empty strings', () => {
      const json = [
        { name: 'John', age: '', city: 'New York' },
        { name: 'Jane', age: 25, city: '' },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age","city"')
      expect(result).toContain('"John","","New York"')
      expect(result).toContain('"Jane",25,""')
    })

    it('should handle numbers', () => {
      const json = [
        { name: 'John', age: 30, score: 95.5 },
        { name: 'Jane', age: 25, score: 88 },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age","score"')
      expect(result).toContain('30')
      expect(result).toContain('95.5')
    })

    it('should handle boolean values', () => {
      const json = [
        { name: 'John', active: true },
        { name: 'Jane', active: false },
      ]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","active"')
      expect(result).toContain('true')
      expect(result).toContain('false')
    })
  })

  describe('error handling', () => {
    it('should throw an error on parser error', () => {
      // Pass invalid options that might cause parser to throw
      const json = [{ name: 'John', age: 30 }]
      // Using an invalid field configuration that might cause issues
      expect(() => {
        jsonToCsv(json, {
          fields: 'invalid' as unknown as Record<string, unknown>,
        })
      }).toThrow()
    })
  })

  describe('array filtering', () => {
    it('should filter out null values from array', () => {
      const json = [
        { name: 'John', age: 30 },
        null,
        { name: 'Jane', age: 25 },
      ] as unknown as Record<string, unknown>[]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age"')
      expect(result).toContain('"John",30')
      expect(result).toContain('"Jane",25')
    })

    it('should filter out undefined values from array', () => {
      const json = [
        { name: 'John', age: 30 },
        undefined,
        { name: 'Jane', age: 25 },
      ] as unknown as Record<string, unknown>[]
      const result = jsonToCsv(json, {})
      expect(result).toContain('"name","age"')
      expect(result).toContain('"John",30')
      expect(result).toContain('"Jane",25')
    })
  })
})

