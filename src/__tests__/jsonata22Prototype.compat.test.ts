import jsonata from 'jsonata'
import trutoJsonata from '../index'
import { registerDatetimeExtensions } from '../presets/datetime'
import mappingCases from './fixtures/datetime-mapping-cases.json'
import { describe, expect, it } from 'vitest'

describe('JSONata 2.2 prototype guards', () => {
  it('blocks $lookup on object constructor', async () => {
    const expr = jsonata('$lookup({"a": 1}, "constructor")')
    await expect(expr.evaluate({})).resolves.toBeUndefined()
  })

  it('blocks $lookup on object __proto__', async () => {
    const expr = jsonata('$lookup({"a": 1}, "__proto__")')
    await expect(expr.evaluate({})).resolves.toBeUndefined()
  })

  it('still allows $lookup on own properties', async () => {
    const expr = jsonata('$lookup({"year": 2024}, "year")')
    await expect(expr.evaluate({})).resolves.toBe(2024)
  })

  it('blocks .year on Luxon DateTime returned from a raw custom function', async () => {
    const { DateTime } = await import('luxon')
    const expr = jsonata('$fn().year')
    expr.registerFunction('fn', () => DateTime.fromISO('2024-01-15T00:00:00.000Z'))
    await expect(expr.evaluate({})).resolves.toBeUndefined()
  })

  it('allows .year on $dtFromIso via truto-jsonata wrapper', async () => {
    const expr = trutoJsonata('$dtFromIso("2024-01-15T00:00:00.000Z").year')
    await expect(expr.evaluate({})).resolves.toBe(2024)
  })
})

describe('Luxon forwarding for unified mapping patterns', () => {
  it.each([
    ['toUTC', '$dtFromIso("2024-01-15T00:00:00.000Z").toUTC()', 'object'],
    ['toISO', '$dtFromIso("2024-01-15T00:00:00.000Z").toISO()', 'string'],
    ['toFormat', '$dtFromIso("2024-01-15T00:00:00.000Z").toFormat("yyyy-MM-dd")', 'string'],
    ['toMillis', '$dtFromIso("2024-01-15T00:00:00.000Z").toMillis()', 'number'],
    ['toISODate', '$dtFromFormat("2024-01-15", "yyyy-MM-dd").toISODate()', 'string'],
    ['toSeconds', '$dtFromFormat("1667313600", "fromSeconds").toSeconds()', 'number'],
    ['plus+startOf', '$dtFromFormat("2024-01-15", "yyyy-MM-dd").plus({ "days": 1 }).startOf("day").toFormat("yyyy-MM-dd")', 'string'],
    ['minus', '$dtFromIso("2024-06-15T00:00:00.000Z").minus({ "month": 1 }).toFormat("yyyy-MM")', 'string'],
    ['endOf', '$dtFromFormat("2024-01-15", "yyyy-MM-dd").endOf("month").toFormat("yyyy-MM-dd")', 'string'],
    [
      'diff.toObject.minutes',
      '$dtFromFormat("12:30:00", "hh:mm:ss").diff($dtFromIso("2024-01-15T00:00:00.000Z").startOf("day"), ["minutes"]).toObject().minutes',
      'number',
    ],
    ['toUTC().toISO()', '$dtFromIso("2024-01-15T00:00:00.000Z").toUTC().toISO()', 'string'],
  ] as const)('forwards %s', async (_label, expression, expectType) => {
    const expr = registerDatetimeExtensions(jsonata(expression))
    const result = await expr.evaluate({})
    expect(result).toBeDefined()
    expect(typeof result).toBe(expectType)
  })

  it('forwards toJSDate()', async () => {
    const expr = registerDatetimeExtensions(
      jsonata('$dtFromIso("2024-01-15T00:00:00.000Z").toJSDate()')
    )
    const result = await expr.evaluate({})
    expect(result).toBeInstanceOf(Date)
  })
})

describe('Production unified-mapping datetime snippets', () => {
  it.each(mappingCases)('$name', async ({ expression, bindings, expectType }) => {
    const expr = trutoJsonata(expression)
    const result = await expr.evaluate(bindings)
    expect(result).toBeDefined()
    if (expectType === 'object') {
      expect(typeof result).toBe('object')
      expect(result).not.toBeNull()
    } else {
      expect(typeof result).toBe(expectType)
    }
  })
})
