import { describe, it, expect } from 'vitest'
import stringifyQuery from '../functions/stringifyQuery'

describe('stringifyQuery', () => {
  it('should stringify a flat object', () => {
    const query = { a: 1, b: 'test', c: true }
    expect(stringifyQuery(query)).toBe('a=1&b=test&c=true')
  })

  it('should handle empty object', () => {
    expect(stringifyQuery({})).toBe('')
  })

  it('should handle nested objects', () => {
    const query = { a: { b: 2 } }
    expect(stringifyQuery(query)).toBe('a%5Bb%5D=2') // a[b]=2
  })

  it('should handle arrays', () => {
    const query = { a: [1, 2, 3] }
    expect(stringifyQuery(query)).toBe('a%5B0%5D=1&a%5B1%5D=2&a%5B2%5D=3') // a[0]=1&a[1]=2&a[2]=3
  })

  it('should handle null and undefined', () => {
    const query = { a: null, b: undefined, c: 1 }
    // qs omits undefined, includes null as empty string
    expect(stringifyQuery(query)).toBe('a=&c=1')
  })
})
