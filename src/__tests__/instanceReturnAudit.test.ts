import jsonata from 'jsonata'
import { DateTime } from 'luxon'
import trutoJsonata from '../index'
import { registerCoreExtensions } from '../presets/core'
import dependencyGraph from '../functions/dependencyGraph'
import {
  unwrapArrayBuffer,
  unwrapDepGraph,
} from '../functions/unwrapNative'
import { describe, expect, it } from 'vitest'

describe('instance return audit (JSONata 2.2)', () => {
  describe('native instances break path access without wrappers', () => {
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

    it('raw ArrayBuffer .byteLength is undefined', async () => {
      const expr = jsonata('$fn().byteLength')
      expr.registerFunction('fn', () => new ArrayBuffer(8))
      await expect(expr.evaluate({})).resolves.toBeUndefined()
    })
  })

  describe('wrapped returns expose own properties in JSONata', () => {
    it('$parseUrl', async () => {
      const expr = trutoJsonata('$parseUrl("https://a.com/p?q=1").searchParams.get("q")')
      await expect(expr.evaluate({})).resolves.toBe('1')
    })

    it('$dtFromIso', async () => {
      const expr = trutoJsonata('$dtFromIso("2024-01-15T00:00:00.000Z").year')
      await expect(expr.evaluate({})).resolves.toBe(2024)
    })

    it('$blob', async () => {
      const expr = trutoJsonata('$blob("hi", {"type": "text/plain"}).type')
      await expect(expr.evaluate({})).resolves.toBe('text/plain')
    })

    it('$base64ToBlob', async () => {
      const size = await trutoJsonata(
        '($b := $base64ToBlob("SGVsbG8="); $b.size)'
      ).evaluate({})
      expect(size).toBe(5)
    })

    it('$jsonToParquet', async () => {
      const expr = trutoJsonata('$jsonToParquet([{"id": 1}]).byteLength')
      const result = await expr.evaluate({})
      expect(typeof result).toBe('number')
      expect((result as number) > 0).toBe(true)
    })

    it('$dependencyGraph overallOrder', async () => {
      const expr = registerCoreExtensions(
        jsonata(
          '$dependencyGraph([{"id":"b","parent_id":"a"},{"id":"a"}], "parent_id", "id").overallOrder()'
        )
      )
      const order = await expr.evaluate({})
      expect(order).toEqual(['a', 'b'])
    })

  })

  describe('JS interop unwraps wrappers for consumers', () => {
    it('getArrayBuffer unwraps $blob', async () => {
      const expr = registerCoreExtensions(
        jsonata(
          '($b := $blob("a", {"type": "text/plain"}); $type($getArrayBuffer($b)))'
        )
      )
      await expect(expr.evaluate({})).resolves.toBe('object')
      const buf = await registerCoreExtensions(
        jsonata('($b := $blob("a", {"type": "text/plain"}); $getArrayBuffer($b))')
      ).evaluate({})
      expect(unwrapArrayBuffer(buf)?.byteLength).toBeGreaterThan(0)
    })

    it('getDataUri unwraps $blob', async () => {
      const expr = trutoJsonata(
        '$substring($getDataUri($blob("a", {"type": "text/plain"}), "text/plain"), 0, 5)'
      )
      await expect(expr.evaluate({})).resolves.toBe('data:')
    })

    it('dependencyGraph unit test shape', () => {
      const graph = dependencyGraph(
        [
          { id: 'b', parent_id: 'a' },
          { id: 'a', parent_id: null },
        ],
        'parent_id',
        'id'
      )
      expect(graph.overallOrder()).toEqual(['a', 'b'])
      expect(unwrapDepGraph(graph)?.overallOrder()).toEqual(['a', 'b'])
    })
  })
})
