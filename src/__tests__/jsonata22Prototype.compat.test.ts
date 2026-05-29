import jsonata from 'jsonata'
import trutoJsonata from '../index'
import { registerCoreExtensions } from '../presets/core'
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

describe('parseUrl JSONata 2.2', () => {
  const sample =
    'https://api.example.com/files/abc?mime_type=image%2Fpng&token=xyz'

  it('blocks .origin on raw URL from a custom function', async () => {
    const expr = jsonata('$parseUrl(u).origin')
    expr.registerFunction('parseUrl', (u: string) => new URL(u))
    await expect(expr.evaluate({ u: sample })).resolves.toBeUndefined()
  })

  it('allows .origin, .pathname, and .searchParams.get via truto parseUrl', async () => {
    const origin = registerCoreExtensions(jsonata('$parseUrl(u).origin'))
    await expect(origin.evaluate({ u: sample })).resolves.toBe(
      'https://api.example.com'
    )

    const pathname = registerCoreExtensions(jsonata('$parseUrl(u).pathname'))
    await expect(pathname.evaluate({ u: sample })).resolves.toBe('/files/abc')

    const mime = registerCoreExtensions(
      jsonata('$parseUrl(u).searchParams.get("mime_type")')
    )
    await expect(mime.evaluate({ u: sample })).resolves.toBe('image/png')
  })

  it('supports ticketing file_url assignment pattern', async () => {
    const expr = registerCoreExtensions(
      jsonata(
        '($u := $parseUrl(file_url); $u.pathname & $u.searchParams.get("mime_type"))'
      )
    )
    await expect(
      expr.evaluate({
        file_url:
          'https://cdn.example.com/a/b.pdf?mime_type=application%2Fpdf',
      })
    ).resolves.toBe('/a/b.pdfapplication/pdf')
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
