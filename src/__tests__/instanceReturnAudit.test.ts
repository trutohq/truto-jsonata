import jsonata from 'jsonata'
import { DateTime } from 'luxon'
import trutoJsonata from '../index'
import { registerCoreExtensions } from '../presets/core'
import { describe, expect, it } from 'vitest'

/**
 * JSONata 2.2 blocks property/method access on prototype-based return values.
 * Functions that return plain JSON are unaffected.
 */
describe('instance return audit (JSONata 2.2)', () => {
  describe('fixed wrappers', () => {
    it('$parseUrl exposes .origin', async () => {
      const expr = trutoJsonata('$parseUrl("https://a.com/p").origin')
      await expect(expr.evaluate({})).resolves.toBe('https://a.com')
    })

    it('$dtFromIso exposes .toFormat', async () => {
      const expr = trutoJsonata('$dtFromIso("2024-01-15T00:00:00.000Z").toFormat("yyyy")')
      await expect(expr.evaluate({})).resolves.toBe('2024')
    })
  })

  describe('native instances break path access (documented)', () => {
    it('raw URL .origin is undefined', async () => {
      const expr = jsonata('$fn().origin')
      expr.registerFunction('fn', () => new URL('https://a.com/p'))
      await expect(expr.evaluate({})).resolves.toBeUndefined()
    })

    it('raw Luxon DateTime .year is undefined', async () => {
      const expr = jsonata('$fn().year')
      expr.registerFunction('fn', () => DateTime.fromISO('2024-01-15T00:00:00.000Z'))
      await expect(expr.evaluate({})).resolves.toBeUndefined()
    })

    it('raw Blob .type is undefined', async () => {
      const expr = jsonata('$fn().type')
      expr.registerFunction('fn', () => new Blob(['x'], { type: 'text/plain' }))
      await expect(expr.evaluate({})).resolves.toBeUndefined()
    })

    it('DepGraph method calls fail in JSONata expressions', async () => {
      const { DepGraph } = await import('dependency-graph')
      const g = new DepGraph()
      g.addNode('a')
      const expr = jsonata('$fn().overallOrder()')
      expr.registerFunction('fn', () => g)
      await expect(expr.evaluate({})).rejects.toMatchObject({
        code: 'T1006',
      })
    })
  })

  describe('safe in production (no JSONata path access on return value)', () => {
    it('$blob result is used as opaque body value', async () => {
      const expr = trutoJsonata('$blob("hi", {"type": "text/plain"})')
      const result = await expr.evaluate({})
      expect(result).toBeInstanceOf(Blob)
    })

    it('$jsonToParquet returns ArrayBuffer without chained access', async () => {
      const expr = trutoJsonata('$jsonToParquet([{"id": 1}])')
      const result = await expr.evaluate({})
      expect(result).toBeInstanceOf(ArrayBuffer)
    })

    it('$getArrayBuffer accepts Blob from $blob (JS interop, not JSONata paths)', async () => {
      const expr = registerCoreExtensions(
        jsonata(
          '($b := $blob("a", {"type": "text/plain"}); $type($getArrayBuffer($b)))'
        )
      )
      await expect(expr.evaluate({})).resolves.toBe('object')
    })

    it('$parseQuery returns plain object with own keys', async () => {
      const expr = trutoJsonata('$parseQuery("a=1&b=2", {})')
      const result = (await expr.evaluate({})) as Record<string, string>
      expect(result.a).toBe('1')
      const expr2 = trutoJsonata('$parseQuery("a=1", {}).a')
      await expect(expr2.evaluate({})).resolves.toBe('1')
    })

    it('$stringifyQuery round-trip uses plain objects', async () => {
      const expr = trutoJsonata(
        '$stringifyQuery($parseQuery("x=1&y=2", {}), {"encode": false})'
      )
      await expect(expr.evaluate({})).resolves.toContain('x=1')
    })
  })

  describe('nested function calls (values pass in JS, not via JSONata paths)', () => {
    it('$getDataUri($blob(...)) works without accessing Blob properties in expression', async () => {
      const expr = trutoJsonata(
        '$substring($getDataUri($blob("a", {"type": "text/plain"}), "text/plain"), 0, 5)'
      )
      await expect(expr.evaluate({})).resolves.toBe('data:')
    })
  })
})
