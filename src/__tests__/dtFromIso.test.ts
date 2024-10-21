import dtFromIso from '../functions/dtFromIso'
import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

describe('dtFromIso', () => {
  it('should convert a valid ISO string to a DateTime object', () => {
    const isoString = '2023-10-01T12:00:00.000Z'
    const result = dtFromIso(isoString)
    expect(result).toBeInstanceOf(DateTime)
  })

  it('should handle an invalid ISO string', () => {
    const invalidIsoString = 'invalid-date'
    const result = dtFromIso(invalidIsoString)
    expect(result.isValid).toBe(false)
  })

  it('should handle an empty string', () => {
    const emptyString = ''
    const result = dtFromIso(emptyString)
    expect(result.isValid).toBe(false)
  })

  it('should handle a null value', () => {
    const result = dtFromIso(null as unknown as string)
    expect(result.isValid).toBe(false)
  })

  it('should handle an undefined value', () => {
    const result = dtFromIso(undefined as unknown as string)
    expect(result.isValid).toBe(false)
  })
})
