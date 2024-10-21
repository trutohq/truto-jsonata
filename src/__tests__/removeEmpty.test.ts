import removeEmpty from '../functions/removeEmpty'
import { describe, expect, it } from 'vitest'

describe('removeEmpty', () => {
  it('should return undefined for an empty array', () => {
    expect(removeEmpty([])).toBeUndefined()
  })

  it('should return the same array if it is not empty', () => {
    const array = [1, 2, 3]
    expect(removeEmpty(array)).toBe(array)
  })

  it('should return the same array if it contains non-empty elements', () => {
    const array = [0, 'it', false]
    expect(removeEmpty(array)).toBe(array)
  })

  it('should return the same array if it contains at least one truthy value', () => {
    const array = [false, 0, 'non-empty', null, undefined]
    expect(removeEmpty(array)).toBe(array)
  })
})
