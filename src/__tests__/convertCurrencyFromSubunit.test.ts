import { describe, expect, it } from 'vitest'
import convertCurrencyFromSubunit from '../functions/convertCurrencyFromSubunit'

describe('convertCurrencyFromSubunit', () => {
  it('should return the same value if currency code is not found', () => {
    const result = convertCurrencyFromSubunit('100', 'XYZ')
    expect(result).toBe('100')
  })

  it('should convert subunit to main unit correctly for JPY', () => {
    const result = convertCurrencyFromSubunit('100', 'JPY')
    expect(result).toBe('100')
  })

  it('should handle small numbers correctly', () => {
    const result = convertCurrencyFromSubunit('1', 'USD')
    expect(result).toBe('0.01')
  })
})
