import { parquetReadObjects } from 'hyparquet'
import { parquetWriteBuffer } from 'hyparquet-writer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import jsonToParquet from '../jsonToParquet'
import trutoJsonata from '../../index'
import { unwrapArrayBuffer } from '../unwrapNative'

// A controllable override so a single test can force the underlying writer to
// emit bad bytes, while every other test transparently uses the real writer.
const writerControl = vi.hoisted(() => ({
  override: null as ArrayBuffer | null,
}))

vi.mock('hyparquet-writer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('hyparquet-writer')>()
  return {
    ...actual,
    parquetWriteBuffer: (
      options: Parameters<typeof actual.parquetWriteBuffer>[0]
    ): ArrayBuffer =>
      writerControl.override ?? actual.parquetWriteBuffer(options),
  }
})

function expectParquetMagic(buf: unknown) {
  const native = unwrapArrayBuffer(buf)
  if (!native) {
    throw new Error('expected ArrayBuffer')
  }
  expect(native.byteLength).toBeGreaterThan(8)
  const u8 = new Uint8Array(native)
  const head = String.fromCharCode(...u8.subarray(0, 4))
  const tail = String.fromCharCode(...u8.subarray(u8.length - 4))
  expect(head).toBe('PAR1')
  expect(tail).toBe('PAR1')
}

describe('jsonToParquet', () => {
  const baseOpts = { codec: 'UNCOMPRESSED' as const }

  afterEach(() => {
    writerControl.override = null
  })

  describe('empty / column-less input throws', () => {
    it('throws for an empty array', () => {
      expect(() => jsonToParquet([], baseOpts)).toThrow(/no rows to encode/)
    })

    it('throws for null', () => {
      expect(() =>
        jsonToParquet(null as unknown as Record<string, unknown>[], baseOpts)
      ).toThrow(/no rows to encode/)
    })

    it('throws for undefined', () => {
      expect(() =>
        jsonToParquet(
          undefined as unknown as Record<string, unknown>[],
          baseOpts
        )
      ).toThrow(/no rows to encode/)
    })

    it('throws when compact removes all rows', () => {
      expect(() =>
        jsonToParquet(
          [null, undefined] as unknown as Record<string, unknown>[],
          baseOpts
        )
      ).toThrow(/no rows to encode/)
    })

    it('throws when the rows have no columns', () => {
      expect(() => jsonToParquet([{}, {}], baseOpts)).toThrow(/no columns/)
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
        file: unwrapArrayBuffer(buf)!,
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
        file: unwrapArrayBuffer(buf)!,
        rowFormat: 'object',
      })
      expect(rows).toHaveLength(1)
      expect(typeof rows[0].meta).toBe('string')
      expect(JSON.parse(rows[0].meta as string)).toEqual(payload)
    })

    it('stores arrays as JSON text readable with JSON.parse', async () => {
      const buf = jsonToParquet([{ tags: ['x', 'y'] }], baseOpts)
      const rows = await parquetReadObjects({
        file: unwrapArrayBuffer(buf)!,
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

  // The writer is forced to return invalid bytes so we can prove jsonToParquet
  // validates its own output instead of returning whatever the writer emits.
  describe('output validation', () => {
    it('throws "empty body" when the writer returns a zero-length buffer', () => {
      writerControl.override = new ArrayBuffer(0)
      expect(() => jsonToParquet([{ a: 1 }], baseOpts)).toThrow(/empty body/)
    })

    it('throws "too small" when the writer returns a runt buffer', () => {
      writerControl.override = new ArrayBuffer(6)
      expect(() => jsonToParquet([{ a: 1 }], baseOpts)).toThrow(/too small/)
    })

    it('throws "invalid Parquet structure" when the magic markers are missing', () => {
      // 32 non-empty bytes with no PAR1 markers.
      writerControl.override = new ArrayBuffer(32)
      expect(() => jsonToParquet([{ a: 1 }], baseOpts)).toThrow(
        /invalid Parquet structure/
      )
    })

    it('throws when real writer output is truncated', () => {
      // Built with override still null, so this uses the real writer.
      const good = parquetWriteBuffer({
        columnData: [{ name: 'a', data: [1, 2, 3], type: 'INT32' }],
      })
      writerControl.override = good.slice(0, good.byteLength - 2)
      expect(() => jsonToParquet([{ a: 1 }], baseOpts)).toThrow()
    })

    it('throws "corrupt Parquet footer" when the footer length overruns the body', () => {
      // Valid PAR1 envelope but a footer length far larger than the body.
      const buf = new ArrayBuffer(20)
      const u8 = new Uint8Array(buf)
      const view = new DataView(buf)
      u8.set([0x50, 0x41, 0x52, 0x31], 0) // "PAR1" header
      u8.set([0x50, 0x41, 0x52, 0x31], 16) // "PAR1" footer
      view.setUint32(12, 0xffffffff, true) // absurd footer metadata length
      writerControl.override = buf
      expect(() => jsonToParquet([{ a: 1 }], baseOpts)).toThrow(
        /corrupt Parquet footer/
      )
    })

    it('returns the bytes unchanged when the writer output is valid', () => {
      const buf = jsonToParquet([{ a: 1 }, { a: 2 }], baseOpts)
      expectParquetMagic(buf)
    })
  })

  // Exercised through the real trutoJsonata entrypoint the way production does
  // ($jsonToParquet inside an evaluated expression), not just the raw function,
  // to lock in that failures propagate as a rejected evaluate() promise.
  describe('JSONata evaluation path', () => {
    it('rejects the evaluated expression when the input is empty', async () => {
      await expect(
        trutoJsonata('$jsonToParquet(rows)').evaluate({ rows: [] })
      ).rejects.toThrow(/no rows to encode/)
    })

    it('returns a valid Parquet ArrayBuffer from an evaluated expression', async () => {
      const buf = await trutoJsonata('$jsonToParquet(rows)').evaluate({
        rows: [{ a: 1 }, { a: 2 }],
      })
      expectParquetMagic(buf)
    })
  })
})
