import { describe, it, expect } from 'vitest'
import parseQuery from '../functions/parseQuery'

describe('parseQuery', () => {
  it('parses a simple query string', () => {
    const result = parseQuery('foo=bar&baz=qux')
    expect(result).toEqual({ foo: 'bar', baz: 'qux' })
  })

  it('parses an empty query string', () => {
    const result = parseQuery('')
    expect(result).toEqual({})
  })

  it('parses a query string with arrays', () => {
    const result = parseQuery('foo=bar&foo=baz')
    expect(result).toEqual({ foo: ['bar', 'baz'] })
  })

  it('parses a query string with nested objects', () => {
    const result = parseQuery('user[name]=alice&user[age]=30')
    expect(result).toEqual({ user: { name: 'alice', age: '30' } })
  })

  it('handles malformed query strings gracefully', () => {
    const result = parseQuery('foo=bar&baz')
    expect(result).toEqual({ foo: 'bar', baz: '' })
  })
})
