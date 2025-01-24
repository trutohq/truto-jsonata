import toNumber from '../functions/toNumber'
import { describe, expect, it } from 'vitest'

describe('toNumber', () => {
  it('should convert a valid numeric string to a number', () => {
    expect(toNumber('42')).toBe(42)
    expect(toNumber('3.14')).toBe(3.14)
  })

  it('should return NaN for an invalid numeric string', () => {
    expect(toNumber('abc')).toBeNaN()
    expect(toNumber('42abc')).toBeNaN()
  })

  it('should return 0 for an empty string', () => {
    expect(toNumber('')).toBe(0)
  })

  it('should correctly handle leading and trailing spaces in a numeric string', () => {
    expect(toNumber('  42  ')).toBe(42)
    expect(toNumber('  3.14  ')).toBe(3.14)
  })

  it('should handle special numeric values', () => {
    expect(toNumber('Infinity')).toBe(Infinity)
    expect(toNumber('-Infinity')).toBe(-Infinity)
    expect(toNumber('NaN')).toBeNaN()
  })

  it('should return NaN for null and undefined', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBeNaN()
  })

  it('should return NaN for non-string inputs like objects and arrays', () => {
    expect(toNumber({})).toBeNaN()
    expect(toNumber([])).toBe(0)
    expect(toNumber([1, 2, 3])).toBeNaN()
  })
})
