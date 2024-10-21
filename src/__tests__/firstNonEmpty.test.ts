import firstNonEmpty from '../functions/firstNonEmpty'
import { describe, expect, it } from 'vitest'

describe('firstNonEmpty', () => {
  it('should return the first non-empty string', () => {
    expect(firstNonEmpty(null, 'hello', 'world')).toBe('hello')
  })
})
