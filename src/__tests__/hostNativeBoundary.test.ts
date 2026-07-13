import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import trutoJsonata from '../index'
import { toJsonataUrl } from '../functions/parseUrl'

/**
 * The JSONata-2.0-compatible host boundary: `trutoJsonata(...).evaluate()`
 * mirrors native inputs (so expressions can read URL/Response/Blob/File/
 * ArrayBuffer/Date/DateTime/ReadableStream fields under JSONata 2.2's
 * own-property-only lookup) and
 * unwraps the JSONata-safe native wrappers out of the result (so callers get
 * real instances back). Date/Blob/File/ArrayBuffer are stamped in place;
 * URL/Response/DateTime/ReadableStream are swapped for mirrors. These tests
 * lock in the behaviour that lets host apps upgrade to 3.x by only bumping the
 * version — no per-call-site adaptation.
 *
 * See the "native coverage matrix" describe below — every host-native type that
 * crosses evaluate must have a row. Missing a row is how Date/ArrayBuffer
 * regressions slip through.
 */

describe('host boundary — output unwrapping (result → real natives)', () => {
  it('$jsonToParquet returns a real ArrayBuffer, not a wrapper', async () => {
    const result = await trutoJsonata('$jsonToParquet(rows)').evaluate({
      rows: [{ id: 1 }, { id: 2 }],
    })
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect((result as ArrayBuffer).byteLength).toBeGreaterThan(8)
  })

  it('$blob returns a real Blob', async () => {
    const result = await trutoJsonata(
      '$blob("hello", {"type": "text/plain"})'
    ).evaluate({})
    expect(result).toBeInstanceOf(Blob)
    expect(await (result as Blob).text()).toBe('hello')
  })

  it('$parseUrl returns a real URL (round-trips via the native symbol)', async () => {
    const result = await trutoJsonata('$parseUrl(u)').evaluate({
      u: 'https://api.example.com/files/doc.pdf?q=1',
    })
    expect(result).toBeInstanceOf(URL)
    expect((result as URL).pathname).toBe('/files/doc.pdf')
    expect((result as URL).searchParams.get('q')).toBe('1')
  })

  it('$dtFromIso returns a real Luxon DateTime', async () => {
    const result = await trutoJsonata('$dtFromIso(iso)').evaluate({
      iso: '2024-01-15T00:00:00.000Z',
    })
    expect(DateTime.isDateTime(result)).toBe(true)
    expect((result as DateTime).year).toBe(2024)
  })

  it('unwraps a wrapper nested inside a returned object', async () => {
    const result = (await trutoJsonata(
      '{ "file": $blob("x", {"type": "text/plain"}), "count": 2 }'
    ).evaluate({})) as { file: unknown; count: number }
    expect(result.file).toBeInstanceOf(Blob)
    expect(result.count).toBe(2)
  })

  it('unwraps a wrapper nested inside a returned array', async () => {
    const result = (await trutoJsonata(
      '[ $jsonToParquet([{"id": 1}]), "tail" ]'
    ).evaluate({})) as unknown[]
    expect(result[0]).toBeInstanceOf(ArrayBuffer)
    expect(result[1]).toBe('tail')
  })

  it('unwrapped binary result survives structuredClone (DO-stub RPC boundary)', async () => {
    // A wrapper carries function props (arrayBuffer/slice) that make
    // structuredClone throw DataCloneError. Proving the clone succeeds proves
    // the wrapper is gone.
    const parquet = await trutoJsonata('$jsonToParquet([{"id": 1}])').evaluate(
      {}
    )
    expect(() => structuredClone(parquet)).not.toThrow()
    const blob = await trutoJsonata(
      '$blob("hi", {"type": "text/plain"})'
    ).evaluate({})
    expect(() => structuredClone(blob)).not.toThrow()
    const nested = await trutoJsonata(
      '{ "bytes": $jsonToParquet([{"id": 1}]) }'
    ).evaluate({})
    expect(() => structuredClone(nested)).not.toThrow()
  })

  it('leaves plain JSON results untouched (identity preserved, zero-alloc)', async () => {
    const result = await trutoJsonata('payload').evaluate({
      payload: { a: 1, b: [2, 3], c: { d: 'e' } },
    })
    expect(result).toEqual({ a: 1, b: [2, 3], c: { d: 'e' } })
  })

  it('passes primitives / null / undefined through unchanged', async () => {
    await expect(trutoJsonata('n').evaluate({ n: 42 })).resolves.toBe(42)
    await expect(trutoJsonata('s').evaluate({ s: 'x' })).resolves.toBe('x')
    await expect(trutoJsonata('missing').evaluate({})).resolves.toBeUndefined()
    await expect(
      trutoJsonata('$exists(x) ? x : null').evaluate({})
    ).resolves.toBeNull()
  })
})

describe('host boundary — input mirroring (native inputs become readable)', () => {
  it('reads fields off a URL passed as a top-level input', async () => {
    const input = { u: new URL('https://user@api.example.com:8080/p/q?tag=1') }
    await expect(trutoJsonata('u.pathname').evaluate(input)).resolves.toBe(
      '/p/q'
    )
    await expect(trutoJsonata('u.origin').evaluate(input)).resolves.toBe(
      'https://api.example.com:8080'
    )
    await expect(
      trutoJsonata('u.searchParams.get("tag")').evaluate(input)
    ).resolves.toBe('1')
  })

  it('does not mutate the host URL input (copy-on-write)', async () => {
    const url = new URL('https://a.com/p')
    const input = { u: url }
    await trutoJsonata('u.pathname').evaluate(input)
    expect(input.u).toBe(url)
    expect(input.u).toBeInstanceOf(URL)
  })

  it('reads status / ok / headers off a Response passed as input', async () => {
    const input = {
      r: new Response('body', {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
      }),
    }
    await expect(trutoJsonata('r.status').evaluate(input)).resolves.toBe(201)
    await expect(trutoJsonata('r.ok').evaluate(input)).resolves.toBe(true)
    await expect(
      trutoJsonata('$lookup(r.headers, "content-type")').evaluate(input)
    ).resolves.toBe('application/json')
    await expect(
      trutoJsonata('r.headers.get("content-type")').evaluate(input)
    ).resolves.toBe('application/json')
    const headers = await trutoJsonata('r.headers').evaluate(input)
    expect(headers).toBe(input.r.headers)
    expect(headers).toBeInstanceOf(Headers)
  })

  it('preserves Response methods and native round-trip behavior', async () => {
    await expect(
      trutoJsonata('r.text()').evaluate({ r: new Response('body') })
    ).resolves.toBe('body')

    const response = new Response('body', { status: 201 })
    const result = await trutoJsonata('r').evaluate({ r: response })
    expect(result).toBe(response)
    expect(result).toBeInstanceOf(Response)
  })

  it('reads Blob getters nested deep in the input, keeping it a real Blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    const input = { body: { file: blob } }
    await expect(trutoJsonata('body.file.size').evaluate(input)).resolves.toBe(
      5
    )
    await expect(trutoJsonata('body.file.type').evaluate(input)).resolves.toBe(
      'text/plain'
    )
    // same instance, still a usable Blob for host consumers (FormData/fetch/R2)
    expect(input.body.file).toBe(blob)
    expect(input.body.file).toBeInstanceOf(Blob)
    const fd = new FormData()
    expect(() => fd.append('f', input.body.file)).not.toThrow()
  })

  it('reads File name/lastModified and ArrayBuffer byteLength from input', async () => {
    const file = new File(['data'], 'report.csv', {
      type: 'text/csv',
      lastModified: 1700000000000,
    })
    await expect(trutoJsonata('f.name').evaluate({ f: file })).resolves.toBe(
      'report.csv'
    )
    await expect(
      trutoJsonata('f.lastModified').evaluate({ f: file })
    ).resolves.toBe(1700000000000)

    const buf = new ArrayBuffer(16)
    await expect(
      trutoJsonata('data.byteLength').evaluate({ data: buf })
    ).resolves.toBe(16)
  })

  it('mirrors natives passed via the bindings argument too', async () => {
    const expr = trutoJsonata('$u.pathname')
    await expect(
      expr.evaluate({}, { u: new URL('https://a.com/deep/path') })
    ).resolves.toBe('/deep/path')
  })

  it('leaves an already-mirrored URL input (toJsonataUrl shape) intact', async () => {
    const wrapped = toJsonataUrl(new URL('https://a.com/pre?x=9'))
    const input = { u: wrapped }
    await expect(trutoJsonata('u.pathname').evaluate(input)).resolves.toBe(
      '/pre'
    )
    await expect(
      trutoJsonata('u.searchParams.get("x")').evaluate(input)
    ).resolves.toBe('9')
    expect(input.u).toBe(wrapped)
  })
})

describe('host boundary — Date (host `new Date()`, not Luxon)', () => {
  it('sync_job_run.started_at.toISOString() works (production parquet template idiom)', async () => {
    const started_at = new Date('2026-07-13T06:55:02.000Z')
    const result = await trutoJsonata(
      'sync_job_run.started_at.toISOString()'
    ).evaluate({ sync_job_run: { status: 'running', started_at } })
    expect(result).toBe('2026-07-13T06:55:02.000Z')
  })

  it('ternary watermark idiom: status completed ? started_at.toISOString()', async () => {
    const started_at = new Date('2026-07-13T06:55:02.000Z')
    const result = await trutoJsonata(
      "sync_job_run.status = 'completed' ? sync_job_run.started_at.toISOString()"
    ).evaluate({ sync_job_run: { status: 'completed', started_at } })
    expect(result).toBe('2026-07-13T06:55:02.000Z')
  })

  it('getTime works on a stamped Date input', async () => {
    const started_at = new Date('2026-07-13T06:55:02.000Z')
    await expect(
      trutoJsonata('started_at.getTime()').evaluate({ started_at })
    ).resolves.toBe(started_at.getTime())
  })

  it('a Date echoed through an expression stays the same real Date instance', async () => {
    const started_at = new Date('2026-07-13T06:55:02.000Z')
    const result = await trutoJsonata('started_at').evaluate({ started_at })
    expect(result).toBe(started_at)
    expect(result).toBeInstanceOf(Date)
  })

  it('stamps Date in place (same instance) so instanceof / isDate still work', async () => {
    const started_at = new Date('2026-07-13T06:55:02.000Z')
    const input = { started_at }
    await trutoJsonata('started_at.toISOString()').evaluate(input)
    expect(input.started_at).toBe(started_at)
    expect(input.started_at).toBeInstanceOf(Date)
    expect(Object.keys(input.started_at)).toEqual([])
  })

  it('stamped Date remains instanceof Date for mid-expression consumers', async () => {
    // Wrapping as a plain object would break lodash isDate / instanceof inside
    // $jsonToParquet and host-registered helpers — stamp must keep a real Date.
    const at = new Date('2024-01-15T00:00:00.000Z')
    const expr = trutoJsonata('$check(at)')
    expr.registerFunction('check', (v: unknown) => v instanceof Date)
    await expect(expr.evaluate({ at })).resolves.toBe(true)
    await expect(
      trutoJsonata('$jsonToParquet([{"id": 1, "at": at}])').evaluate({ at })
    ).resolves.toBeInstanceOf(ArrayBuffer)
  })

  it('clones a frozen Date to keep methods readable and Date identity semantics', async () => {
    const started_at = Object.freeze(new Date('2026-07-13T06:55:02.000Z'))
    const result = await trutoJsonata('started_at').evaluate({ started_at })
    expect(result).toBeInstanceOf(Date)
    expect((result as Date).toISOString()).toBe('2026-07-13T06:55:02.000Z')
    await expect(
      trutoJsonata('started_at.toISOString()').evaluate({ started_at })
    ).resolves.toBe('2026-07-13T06:55:02.000Z')
  })
})

describe('host boundary — ArrayBuffer re-entry (parquet → destination context)', () => {
  it('re-evaluating with a $jsonToParquet ArrayBuffer in context does not throw', async () => {
    // Sync V4 destination/run_if re-enters evaluate with transform output that
    // already contains a real ArrayBuffer. Stamping byteLength must not abort
    // (Workers: non-configurable byteLength → defineProperty throws).
    const parquet = await trutoJsonata('$jsonToParquet([{"id": 1}])').evaluate(
      {}
    )
    expect(parquet).toBeInstanceOf(ArrayBuffer)
    await expect(
      trutoJsonata(
        '$exists(payload.records) and $exists(payload.records[0].parquet)'
      ).evaluate({ payload: { records: [{ parquet }] } })
    ).resolves.toBe(true)
  })

  it('stamping does not throw when defineProperty rejects (Workers ArrayBuffer)', async () => {
    const buf = new ArrayBuffer(8)
    Object.defineProperty(buf, 'byteLength', {
      value: 8,
      writable: false,
      configurable: false,
      enumerable: true,
    })
    // Must not throw even though a second stamp cannot redefine byteLength
    await expect(
      trutoJsonata('$exists(data)').evaluate({ data: buf })
    ).resolves.toBe(true)
  })

  it('falls back to wrappers for frozen Blob/ArrayBuffer inputs', async () => {
    const blob = Object.freeze(new Blob(['hello'], { type: 'text/plain' }))
    const buffer = Object.freeze(new ArrayBuffer(8))
    await expect(
      trutoJsonata('[blob.size, buffer.byteLength]').evaluate({ blob, buffer })
    ).resolves.toEqual([5, 8])
    await expect(trutoJsonata('blob').evaluate({ blob })).resolves.toBe(blob)
    await expect(trutoJsonata('buffer').evaluate({ buffer })).resolves.toBe(
      buffer
    )
  })
})

describe('host boundary — cyclic inputs/results', () => {
  it('does not recurse forever and preserves cycles while mirroring natives', async () => {
    const input: Record<string, unknown> & {
      self?: unknown
      started_at?: Date
    } = {}
    input.self = input
    input.started_at = new Date('2026-07-13T06:55:02.000Z')

    await expect(
      trutoJsonata('started_at.toISOString()').evaluate(input)
    ).resolves.toBe('2026-07-13T06:55:02.000Z')

    const result = (await trutoJsonata('$').evaluate(input)) as typeof input
    expect(result.self).toBe(result)
    expect(result.started_at).toBeInstanceOf(Date)
  })
})

/**
 * Coverage matrix — every native that crosses the evaluate boundary.
 * If you add a new host-native type that expressions read via prototype
 * getters/methods, add a row here and a mirror/unwrap path in
 * mirrorNativeInput / unwrapNative. Missing a row is how Date.toISOString
 * and ArrayBuffer stamp regressions slip through.
 */
describe('host boundary — native coverage matrix', () => {
  const cases: Array<{
    name: string
    input: () => Record<string, unknown>
    expression: string
    assert: (result: unknown) => void | Promise<void>
  }> = [
    {
      name: 'URL',
      input: () => ({ u: new URL('https://a.com/p?q=1') }),
      expression: 'u.pathname',
      assert: r => expect(r).toBe('/p'),
    },
    {
      name: 'Response',
      input: () => ({ r: new Response('x', { status: 204 }) }),
      expression: 'r.status',
      assert: r => expect(r).toBe(204),
    },
    {
      name: 'Blob',
      input: () => ({ b: new Blob(['hi'], { type: 'text/plain' }) }),
      expression: 'b.size',
      assert: r => expect(r).toBe(2),
    },
    {
      name: 'File',
      input: () => ({
        f: new File(['x'], 'a.txt', { type: 'text/plain' }),
      }),
      expression: 'f.name',
      assert: r => expect(r).toBe('a.txt'),
    },
    {
      name: 'ArrayBuffer',
      input: () => ({ a: new ArrayBuffer(4) }),
      expression: 'a.byteLength',
      assert: r => expect(r).toBe(4),
    },
    {
      name: 'Uint8Array',
      input: () => ({ bytes: new Uint8Array([7, 8, 9]) }),
      expression: 'bytes.slice(1).length',
      assert: r => expect(r).toBe(2),
    },
    {
      name: 'DataView',
      input: () => ({
        view: new DataView(new Uint8Array([7, 8, 9]).buffer),
      }),
      expression: 'view.getUint8(1)',
      assert: r => expect(r).toBe(8),
    },
    {
      name: 'Date',
      input: () => ({ d: new Date('2024-01-15T00:00:00.000Z') }),
      expression: 'd.toISOString()',
      assert: r => expect(r).toBe('2024-01-15T00:00:00.000Z'),
    },
    {
      name: 'ReadableStream',
      input: () => ({ stream: new ReadableStream() }),
      expression: 'stream.locked',
      assert: r => expect(r).toBe(false),
    },
    {
      name: 'host Luxon DateTime',
      input: () => ({
        dt: DateTime.fromISO('2024-01-15T00:00:00.000Z', { zone: 'utc' }),
      }),
      expression: 'dt.year',
      assert: r => expect(r).toBe(2024),
    },
    {
      name: 'Luxon DateTime (via $dtFromIso output, not host Date)',
      input: () => ({ iso: '2024-01-15T00:00:00.000Z' }),
      expression: '$dtFromIso(iso).year',
      assert: r => expect(r).toBe(2024),
    },
  ]

  it.each(cases)('$name is readable without throwing', async c => {
    const result = await trutoJsonata(c.expression).evaluate(c.input())
    await c.assert(result)
  })
})

describe('host boundary — round trip', () => {
  it('a URL echoed through an expression comes back as a real URL', async () => {
    const result = await trutoJsonata('u').evaluate({
      u: new URL('https://a.com/echo/path?k=v'),
    })
    expect(result).toBeInstanceOf(URL)
    expect((result as URL).pathname).toBe('/echo/path')
    expect((result as URL).searchParams.get('k')).toBe('v')
  })
})

describe('host boundary — replicated backend scenarios', () => {
  it('dynamic-pagination: reads url + response, returns a real-URL next page', async () => {
    // Mirrors DynamicPagination.getCursorFromResponse: url + response mirrored
    // in, a $parseUrl-built next url returned out as a real URL.
    const expr = trutoJsonata(`{
      "status": response.status,
      "path": url.pathname,
      "nextUrl": $parseUrl(url.href & "&cursor=abc")
    }`)
    const result = (await expr.evaluate({
      url: new URL('https://api.example.com/items?page=1'),
      response: new Response('{}', { status: 200 }),
    })) as { status: number; path: string; nextUrl: unknown }
    expect(result.status).toBe(200)
    expect(result.path).toBe('/items')
    expect(result.nextUrl).toBeInstanceOf(URL)
    expect((result.nextUrl as URL).searchParams.get('cursor')).toBe('abc')
    expect((result.nextUrl as URL).searchParams.get('page')).toBe('1')
  })

  it('cursor built from $dtFromIso comes back as a real DateTime (not "[object Object]")', async () => {
    // Mirrors the DynamicPagination cursor path that TextEncoder-encodes the
    // result: a wrapper would encode to "[object Object]".
    const result = await trutoJsonata('$dtFromIso(body.created_at)').evaluate({
      body: { created_at: '2024-06-15T00:00:00.000Z' },
    })
    expect(DateTime.isDateTime(result)).toBe(true)
    expect((result as DateTime).toISODate()).toBe('2024-06-15')
  })

  it('raw request body: $getArrayBuffer result is real bytes, not a stringified wrapper', async () => {
    const result = await trutoJsonata(
      '$getArrayBuffer($blob(body.text, {"type": "text/plain"}))'
    ).evaluate({ body: { text: 'payload-bytes' } })
    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(new TextDecoder().decode(result as ArrayBuffer)).toBe(
      'payload-bytes'
    )
  })
})

describe('host boundary — evaluate interop (registerFunction / callback / echo)', () => {
  it('a function registered after trutoJsonata() is visible to the wrapped evaluate', async () => {
    // The backend registers per-eval helpers (e.g. $documentParserApiKey) on
    // the expression AFTER trutoJsonata() and before evaluate(); patching
    // evaluate must not shadow registerFunction or the environment it mutates.
    const expr = trutoJsonata('$greet(name)')
    expr.registerFunction('greet', (n: string) => `hi ${n}`)
    await expect(expr.evaluate({ name: 'ada' })).resolves.toBe('hi ada')
  })

  it('supports the callback form of evaluate and unwraps the callback value', async () => {
    const result = await new Promise((resolve, reject) => {
      trutoJsonata('$jsonToParquet(rows)').evaluate(
        { rows: [{ id: 1 }] },
        undefined,
        (err: unknown, value: unknown) => (err ? reject(err) : resolve(value))
      )
    })
    expect(result).toBeInstanceOf(ArrayBuffer)
  })

  it('a real native echoed from input returns the same instance (no double-processing)', async () => {
    const blob = new Blob(['x'], { type: 'text/plain' })
    const result = await trutoJsonata('b').evaluate({ b: blob })
    expect(result).toBe(blob)
    expect(result).toBeInstanceOf(Blob)
  })
})
