import { DateTime, Duration } from 'luxon'
import { describe, expect, it } from 'vitest'
import { toJsonataNative } from '../functions/toJsonataNative'
import { evalTruto } from './helpers/jsonataEval'

// JSONata 2.0 read every member of a native value, own or inherited, and saw
// only its own keys when it listed, compared or serialized it. The values
// Truto functions return must behave the same way under JSONata 2.2.
// toUTC() keeps the text the same whatever the machine's zone
const D = '$dtFromIso("2024-03-10T12:34:56.789Z").toUTC()'
const D2 = '$dtFromIso("2024-03-09T10:00:00Z").toUTC()'
const LUXON_KEYS = Object.keys(DateTime.fromISO('2024-03-10T12:34:56.789Z'))

describe('DateTime results read like the luxon DateTime', () => {
  it('calls every method', async () => {
    expect(await evalTruto(`${D}.toObject()`)).toEqual({
      year: 2024,
      month: 3,
      day: 10,
      hour: 12,
      minute: 34,
      second: 56,
      millisecond: 789,
    })
    expect(await evalTruto(`${D}.toString()`)).toBe(
      '2024-03-10T12:34:56.789Z'
    )
    expect(await evalTruto(`${D}.get('year')`)).toBe(2024)
    expect(await evalTruto('$dtFromIso("garbage").toObject()')).toEqual({})
    expect(
      await evalTruto(
        '$dtFromFormat("10/03/2024 08:05", "dd/MM/yyyy HH:mm").toObject().hour'
      )
    ).toBe(8)
  })

  it('reads own fields and nested luxon objects', async () => {
    expect(await evalTruto(`${D}.ts`)).toBe(1710074096789)
    expect(await evalTruto(`${D}.c.year`)).toBe(2024)
    expect(await evalTruto(`${D}.o`)).toBe(0)
    expect(await evalTruto(`${D}.zone.name`)).toBe('UTC')
    expect(await evalTruto(`${D}.loc.locale`)).toBe('en-US')
    expect(await evalTruto(`${D}.year`)).toBe(2024)
  })

  it('gives toJSDate() as a Date the expression can call', async () => {
    expect(await evalTruto(`${D}.toJSDate().toISOString()`)).toBe(
      '2024-03-10T12:34:56.789Z'
    )
    expect(await evalTruto(`${D}.toJSDate().getTime()`)).toBe(1710074096789)
    expect(await evalTruto(`$string(${D}.toJSDate())`)).toBe(
      '"2024-03-10T12:34:56.789Z"'
    )
    expect(await evalTruto(`${D}.toJSDate()`)).toBeInstanceOf(Date)
  })
})

describe('native wrappers give data, not functions', () => {
  class Box {
    v = 1
    fn() {
      return () => 1
    }
    nested() {
      return { a: 1, f: () => 1 }
    }
    shared() {
      return Object.getPrototypeOf({})
    }
  }
  const call = (w: Record<string, unknown>, key: string) =>
    (w[key] as () => unknown)()

  it('drops functions and shared objects from member results', () => {
    const w = toJsonataNative(new Box())
    expect(w.v).toBe(1)
    expect(call(w, 'fn')).toBeUndefined()
    expect(call(w, 'nested')).toEqual({ a: 1 })
    expect(call(w, 'shared')).toBeUndefined()
    expect(w.constructor).toBeUndefined()
  })

  it('keeps the members that return data', async () => {
    expect(await evalTruto(`${D}.get('year')`)).toBe(2024)
    expect(await evalTruto(`${D}.loc.locale`)).toBe('en-US')
  })
})

describe('Duration and Interval results read like luxon', () => {
  it('reads Duration members', async () => {
    expect(await evalTruto(`${D}.diff(${D2}, 'days').toHuman()`)).toBe(
      '1.108 days'
    )
    expect(await evalTruto(`${D}.diff(${D2}, 'hours').hours`)).toBeCloseTo(
      26.5824,
      3
    )
    expect(
      await evalTruto(`${D}.diff(${D2}, 'days').values.days`)
    ).toBeCloseTo(1.1076, 3)
    expect(
      await evalTruto(`$dtFromIso("garbage").diff(${D2}, 'days').days`)
    ).toBeNaN()
    expect(
      Duration.isDuration(await evalTruto(`${D}.diff(${D2}, 'days')`))
    ).toBe(true)
  })

  it('reads Interval members', async () => {
    expect(await evalTruto(`${D2}.until(${D}).length('hours')`)).toBeCloseTo(
      26.5824,
      3
    )
    expect(await evalTruto(`${D2}.until(${D}).start.toISO()`)).toBe(
      '2024-03-09T10:00:00.000Z'
    )
  })

  it('passes a Duration result back to luxon', async () => {
    expect(await evalTruto(`${D}.plus(${D}.diff(${D2})).toISO()`)).toBe(
      '2024-03-11T15:09:53.578Z'
    )
    expect(await evalTruto(`${D}.minus(${D}.diff(${D2}, 'days')).toISO()`)).toBe(
      '2024-03-09T10:00:00.000Z'
    )
  })
})

describe('DateTime results compare like 2.0', () => {
  it('two equal DateTimes are equal', async () => {
    expect(await evalTruto(`${D} = ${D}`)).toBe(true)
    expect(await evalTruto(`${D} != ${D}`)).toBe(false)
    expect(await evalTruto(`${D} = ${D2}`)).toBe(false)
    expect(await evalTruto(`$count($distinct([${D}, ${D}]))`)).toBe(1)
  })
})

describe('DateTime results list the luxon keys', () => {
  it('wildcard, $keys, $each, $sift and $merge see the own keys', async () => {
    expect(await evalTruto(`$count(${D}.*)`)).toBe(LUXON_KEYS.length)
    const list = async (expr: string) => [
      ...((await evalTruto(expr)) as string[]),
    ]
    expect(await list(`$keys(${D})`)).toEqual(LUXON_KEYS)
    expect(await list(`$each(${D}, function($v, $k){ $k })`)).toEqual(
      LUXON_KEYS
    )
    expect(
      await evalTruto(`$each(${D}, function($v,$k){$k & "=" & $string($v)})[0]`)
    ).toBe('ts=1710074096789')
    expect(await list(`$keys($sift(${D}, function($v){ $v }))`)).toEqual([
      'ts',
      '_zone',
      'loc',
      'c',
      'isLuxonDateTime',
    ])
    expect(await evalTruto(`$merge([${D}]).ts`)).toBe(1710074096789)
    expect(await evalTruto(`$merge([${D}]).year`)).toBeUndefined()
  })
})

describe('binary results read like the native ArrayBuffer and Blob', () => {
  it('reads byteLength and Blob methods', async () => {
    expect(await evalTruto(`$getArrayBuffer($blob('hello')).byteLength`)).toBe(
      5
    )
    expect(await evalTruto(`$blob('x').arrayBuffer().byteLength`)).toBe(1)
    expect(
      await evalTruto(
        `$base64ToBlob("aGVsbG8=", {"mimeType":"text/plain"}).arrayBuffer().byteLength`
      )
    ).toBe(5)
    expect(await evalTruto(`$blob('hello', {"type":"text/plain"}).type`)).toBe(
      'text/plain'
    )
    expect(await evalTruto(`$blob('hello').slice(1).size`)).toBe(4)
    expect(await evalTruto(`$blob('hello').text()`)).toBe('hello')
    expect(
      await evalTruto(`$jsonToParquet([{"a":1}]).byteLength > 0`)
    ).toBe(true)
  })

  it('serializes as {} and is false as a condition', async () => {
    for (const value of [
      `$blob('x')`,
      `$base64ToBlob("aGVsbG8=")`,
      `$jsonToParquet([{"a":1}])`,
      `$getArrayBuffer($blob('hello'))`,
    ]) {
      expect(await evalTruto(`"" & ${value}`)).toBe('{}')
      expect(await evalTruto(`${value} ? 'y' : 'n'`)).toBe('n')
    }
  })

  it('hands the host the native values', async () => {
    const result = (await evalTruto(
      `{"b": $blob('x'), "a": $getArrayBuffer($blob('hello'))}`
    )) as { b: unknown; a: unknown }
    expect(result.b).toBeInstanceOf(Blob)
    expect(result.a).toBeInstanceOf(ArrayBuffer)
  })
})

describe('binary input keeps its input shape', () => {
  // Only values Truto functions return change; what the caller passes in, and
  // a Response body read in the expression, read as before.
  const input = () => ({
    ab: Object.freeze(new TextEncoder().encode('hello').buffer),
    file: Object.freeze(new File(['hello'], 'a.txt', { type: 'text/plain' })),
    resp: new Response('resp body'),
  })

  it('reads a frozen ArrayBuffer, a frozen File and a Response body', async () => {
    expect(await evalTruto('ab.byteLength', input())).toBe(5)
    expect(await evalTruto('ab ? 1 : 0', input())).toBe(1)
    expect(await evalTruto('"" & ab', input())).toBe(
      '{"byteLength":5,"slice":""}'
    )
    expect(await evalTruto('$type(ab.transfer)', input())).toBeUndefined()
    expect(await evalTruto('file.name', input())).toBe('a.txt')
    expect(await evalTruto('file.size', input())).toBe(5)
    expect(
      await evalTruto('resp.arrayBuffer().byteLength', input())
    ).toBe(9)
    expect(await evalTruto('resp.blob() ? 1 : 0', input())).toBe(1)
  })
})

describe('$parseUrl results read like the native URL', () => {
  it('is false as a condition and serializes as its href', async () => {
    expect(await evalTruto(`$parseUrl("https://a.example/p?q=1") ? 1 : 0`)).toBe(
      0
    )
    expect(await evalTruto(`$string($parseUrl("https://a.example/p?q=1"))`)).toBe(
      '"https://a.example/p?q=1"'
    )
    expect(
      await evalTruto(`$parseUrl("https://a.example/p?q=1").searchParams.get("q")`)
    ).toBe('1')
    expect(await evalTruto(`$parseUrl("https://a.example/p?q=1").host`)).toBe(
      'a.example'
    )
  })
})

describe('a stream reads like the native stream', () => {
  const s = () =>
    new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('hi'))
        c.close()
      },
    })

  it('serializes as {} and is false as a condition', async () => {
    expect(await evalTruto(`s & ""`, { s: s() })).toBe('{}')
    expect(await evalTruto(`s ? "y" : "n"`, { s: s() })).toBe('n')
    expect(await evalTruto(`s.getReader() & ""`, { s: s() })).toBe('{}')
    expect(await evalTruto(`$keys(s)`, { s: s() })).toBeUndefined()
  })

  it('still reads, tees and locks', async () => {
    expect(await evalTruto(`s.locked`, { s: s() })).toBe(false)
    expect(
      await evalTruto(`( $r := s.getReader(); s.locked )`, { s: s() })
    ).toBe(true)
    expect(
      await evalTruto(`( $r := s.getReader(); $r.read().done )`, { s: s() })
    ).toBe(false)
    expect(await evalTruto(`$count(s.tee())`, { s: s() })).toBe(2)
  })
})

describe('$merge, $spread, $each and $sift walk a native like 2.0 for..in', () => {
  it('reach the enumerable members a URL and a Blob inherit', async () => {
    expect(
      await evalTruto(`$merge([$parseUrl("https://a.example/a/b"), {"z":1}]).pathname`)
    ).toBe('/a/b')
    expect(await evalTruto(`$merge([$blob('hello')]).size`)).toBe(5)
    expect(
      await evalTruto(`$count($spread($parseUrl("https://a.example/a/b")))`)
    ).toBeGreaterThan(5)
    expect(
      await evalTruto(`$each($blob('x'), function($v, $k){ $k })`)
    ).toContain('size')
    expect(
      await evalTruto(`$sift($blob('x'), function($v, $k){ $k = "type" })`)
    ).toEqual({ type: '' })
  })

  it('reach the members a stream inherits', async () => {
    const s = () => new ReadableStream()
    expect(
      await evalTruto(`$each(s, function($v, $k){ $k })`, { s: s() })
    ).toEqual(expect.arrayContaining(['locked', 'getReader', 'pipeTo']))
    expect(await evalTruto(`$merge([{"a":1}, s])`, { s: s() })).toMatchObject({
      a: 1,
      locked: false,
    })
  })

  it('keep plain objects and DateTimes as before', async () => {
    expect(await evalTruto(`$merge([{"a":1}, {"b":2}])`)).toEqual({ a: 1, b: 2 })
    expect(await evalTruto(`$spread({"a":1, "b":2})`)).toEqual([{ a: 1 }, { b: 2 }])
    expect(await evalTruto(`$merge([${D}]).ts`)).toBe(1710074096789)
  })
})

describe('Truto functions get a lambda as 2.0 passed it', () => {
  const inLambda = (call: string) => `(function($z){ ${call} })(0)`
  const input = { obj: { a: 1 }, arr: [1, 2] }

  it('serializes the lambda instead of throwing on a cycle', async () => {
    const xml = await evalTruto(inLambda('$jsToXml(function($v){$v})'), input)
    expect(xml).toContain('<_jsonata_lambda>true</_jsonata_lambda>')
    const csv = await evalTruto(inLambda('$jsonToCsv(function($v){$v})'), input)
    expect(csv).toContain('"_jsonata_lambda","input","environment"')
    const query = await evalTruto(
      inLambda('$stringifyQuery(function($v){$v})'),
      input
    )
    expect(query).toContain('_jsonata_lambda=true')
    const chunks = await evalTruto(
      inLambda(
        '$recursiveCharacterTextSplitter(function($v){$v}, {"chunkSize":500,"chunkOverlap":0})'
      ),
      input
    )
    expect((chunks as string[])[0]).toMatch(/"_jsonata_lambda": ?true/)
    const parquet = await evalTruto(
      inLambda('$jsonToParquet(function($v){$v})'),
      input
    )
    expect(parquet).toBeInstanceOf(ArrayBuffer)
    const mapped = (await evalTruto(
      inLambda('$mapValues(function($v){$v}, {"a":"alpha"})'),
      input
    )) as Record<string, unknown>
    expect(mapped._jsonata_lambda).toBe(true)
  })

  it('a lambda a Truto function returns still runs', async () => {
    expect(
      await evalTruto(
        inLambda('$firstNonEmpty(function($v){ $v + 1 })(41)'),
        input
      )
    ).toBe(42)
    // inside an array too, against the input it closed over
    const d = DateTime.fromISO('2024-03-10T12:34:56.789Z', { zone: 'utc' })
    expect(
      await evalTruto(
        inLambda('($f := $firstNonEmpty([function(){ d.toISO() }])[0]; $f())'),
        { d }
      )
    ).toBe('2024-03-10T12:34:56.789Z')
  })

  it('reads input the caller changed between two evaluations', async () => {
    const data: Record<string, unknown> = { a: 1 }
    const expr = inLambda('$jsToXml(function($v){ a })')
    expect(await evalTruto(expr, data)).toContain('<a>1</a>')
    data.a = 2
    expect(await evalTruto(expr, data)).toContain('<a>2</a>')
  })
})
