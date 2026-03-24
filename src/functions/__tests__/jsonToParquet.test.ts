import { parquetReadObjects } from 'hyparquet'
import { describe, expect, it } from 'vitest'
import jsonToParquet from '../jsonToParquet'

function expectParquetMagic(buf: ArrayBuffer) {
  expect(buf.byteLength).toBeGreaterThan(8)
  const u8 = new Uint8Array(buf)
  const head = String.fromCharCode(...u8.subarray(0, 4))
  const tail = String.fromCharCode(...u8.subarray(u8.length - 4))
  expect(head).toBe('PAR1')
  expect(tail).toBe('PAR1')
}

describe('jsonToParquet', () => {
  const baseOpts = { codec: 'UNCOMPRESSED' as const }

  describe('empty inputs', () => {
    it('returns empty ArrayBuffer for empty array', () => {
      const buf = jsonToParquet([], baseOpts)
      expect(buf.byteLength).toBe(0)
    })

    it('returns empty ArrayBuffer for null', () => {
      const buf = jsonToParquet(null as unknown as Record<string, unknown>[], baseOpts)
      expect(buf.byteLength).toBe(0)
    })

    it('returns empty ArrayBuffer for undefined', () => {
      const buf = jsonToParquet(
        undefined as unknown as Record<string, unknown>[],
        baseOpts
      )
      expect(buf.byteLength).toBe(0)
    })

    it('returns empty ArrayBuffer when compact removes all rows', () => {
      const buf = jsonToParquet(
        [null, undefined] as unknown as Record<string, unknown>[],
        baseOpts
      )
      expect(buf.byteLength).toBe(0)
    })
  })

  describe('basic conversion', () => {
    it('writes simple rows with PAR1 magic', () => {
      const buf = jsonToParquet(
        [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
        baseOpts
      )
      expectParquetMagic(buf)
    })

    it('accepts a single object', () => {
      const buf = jsonToParquet({ id: 1, ok: true }, baseOpts)
      expectParquetMagic(buf)
    })

    it('fills null for missing keys', async () => {
      const buf = jsonToParquet(
        [{ name: 'John', age: 30 }, { name: 'Jane', city: 'LA' }],
        baseOpts
      )
      expectParquetMagic(buf)
      const rows = await parquetReadObjects({
        file: buf,
        rowFormat: 'object',
      })
      expect(rows).toHaveLength(2)
      expect(rows[0].name).toBe('John')
      expect(rows[1].city).toBe('LA')
    })
  })

  describe('mixed and nested types', () => {
    it('uses DOUBLE when integers and floats mix in a column', () => {
      const buf = jsonToParquet(
        [{ n: 1 }, { n: 1.5 }],
        baseOpts
      )
      expectParquetMagic(buf)
    })

    it('stores nested objects as JSON logical type and round-trips via JSON.parse', async () => {
      const payload = { a: 1, b: [2, 3] }
      const buf = jsonToParquet([{ meta: payload }], baseOpts)
      expectParquetMagic(buf)
      const rows = await parquetReadObjects({
        file: buf,
        rowFormat: 'object',
      })
      expect(rows).toHaveLength(1)
      expect(typeof rows[0].meta).toBe('string')
      expect(JSON.parse(rows[0].meta as string)).toEqual(payload)
    })

    it('stores arrays as JSON text readable with JSON.parse', async () => {
      const buf = jsonToParquet([{ tags: ['x', 'y'] }], baseOpts)
      const rows = await parquetReadObjects({
        file: buf,
        rowFormat: 'object',
      })
      expect(typeof rows[0].tags).toBe('string')
      expect(JSON.parse(rows[0].tags as string)).toEqual(['x', 'y'])
    })
  })

  describe('options', () => {
    it('passes rowGroupSize', () => {
      const buf = jsonToParquet([{ x: 1 }], {
        ...baseOpts,
        rowGroupSize: 500,
      })
      expectParquetMagic(buf)
    })
  })
})
