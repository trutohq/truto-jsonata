import convertCurrencyToSubunit from '../functions/convertCurrencyToSubunit'
import { describe, expect, it } from 'vitest'

describe('convertCurrencyToSubunit', () => {
  it('converts USD to cents correctly', () => {
    const result = convertCurrencyToSubunit('10', 'USD')
    expect(result).toBe(1000)
  })

  it('converts EUR to cents correctly', () => {
    const result = convertCurrencyToSubunit('10', 'EUR')
    expect(result).toBe(1000)
  })

  it('converts GBP to pence correctly', () => {
    const result = convertCurrencyToSubunit('10', 'GBP')
    expect(result).toBe(1000)
  })

  it('converts INR to paise correctly', () => {
    const result = convertCurrencyToSubunit('10', 'INR')
    expect(result).toBe(1000)
  })

  it('handles zero amount correctly', () => {
    const result = convertCurrencyToSubunit('0', 'USD')
    expect(result).toBe(0)
  })

  it('handles negative amount correctly', () => {
    const result = convertCurrencyToSubunit('-10', 'USD')
    expect(result).toBe(-1000)
  })

  it('handles large amount correctly', () => {
    const result = convertCurrencyToSubunit('1000000', 'USD')
    expect(result).toBe(100000000)
  })
})
