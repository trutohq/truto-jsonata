import dtFromFormat from '../functions/dtFromFormat'
import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

describe('dtFromFormat', () => {
  it('should parse RFC2822 format', () => {
    const date = 'Tue, 01 Nov 2022 12:00:00 +0000'
    const format = 'RFC2822'
    const result = dtFromFormat(date, format)
    expect(result.toISO()).toBe(DateTime.fromRFC2822(date).toISO())
  })

  it('should parse ISO format', () => {
    const date = '2022-11-01T12:00:00.000Z'
    const format = 'ISO'
    const result = dtFromFormat(date, format)
    expect(result.toISO()).toBe(DateTime.fromISO(date).toISO())
  })

  it('should parse fromSeconds format', () => {
    const date = '1667313600'
    const format = 'fromSeconds'
    const result = dtFromFormat(date, format)
    expect(result.toISO()).toBe(DateTime.fromSeconds(parseInt(date)).toISO())
  })

  it('should parse custom format', () => {
    const date = '01-11-2022 12:00'
    const format = 'dd-MM-yyyy HH:mm'
    const result = dtFromFormat(date, format)
    expect(result.toISO()).toBe(DateTime.fromFormat(date, format).toISO())
  })

  it('should return invalid DateTime for incorrect format', () => {
    const date = 'invalid date'
    const format = 'ISO'
    const result = dtFromFormat(date, format)
    expect(result.isValid).toBe(false)
  })
})
