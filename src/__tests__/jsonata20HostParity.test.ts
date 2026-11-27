import { DateTime } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'
import trutoJsonata from '../index'
import { toJsonataBlob } from '../functions/toJsonataBlob'
import { toJsonataDateTime } from '../functions/toJsonataDateTime'
import deepUnwrapNative from '../functions/deepUnwrapNative'
import toHostArg from '../functions/toHostArg'
import { evalTruto } from './helpers/jsonataEval'

const ISO = '2024-03-10T12:34:56Z'

// Under JSONata 2.2, objects an expression builds have a null prototype and
// native results come back as wrappers. Truto functions were written against
// 2.0, where neither was true. These pin the 2.0 behaviour at that boundary.
describe('Truto functions get 2.0-shaped arguments', () => {
  it('$join coerces objects built in the expression like 2.0', async () => {
    expect(await evalTruto('$join([{"a": 1}, "x"], ",")')).toBe(
      '[object Object],x'
    )
    expect(await evalTruto('$join([$merge([{"a": 1}, {"b": 2}])])')).toBe(
      '[object Object]'
    )
  })

  it('$join of objects looked up through a filter predicate does not throw', async () => {
    expect(
      await evalTruto(
        '($m := {"a": "x", "b": "y"}; $join($map(["a", "b"], function($r) { $m[$r] }), ","))'
      )
    ).toBe('[object Object],[object Object]')
  })

  it('$wrap coerces a built object like 2.0', async () => {
    expect(await evalTruto('$wrap({"a": 1}, "<", ">")')).toBe(
      '<[object Object]>'
    )
  })

  it('$join and $wrap give a DateTime as its ISO text', async () => {
    expect(
      await evalTruto(`$join([$dtFromIso("${ISO}").toUTC(), "a"], ",")`)
    ).toBe('2024-03-10T12:34:56.000Z,a')
    expect(await evalTruto(`$wrap($dtFromIso("${ISO}").toUTC(), "'")`)).toBe(
      "'2024-03-10T12:34:56.000Z'"
    )
  })

  it('$jsToXml and $xmlToJs accept objects built in the expression', async () => {
    expect(await evalTruto('$jsToXml({"root": {"a": 1}})')).toContain(
      '<a>1</a>'
    )
    expect(await evalTruto('$xmlToJs("<a>1</a>", {"compact": true})')).toEqual({
      a: { _text: '1' },
    })
  })

  it('keeps partial application and callback arity working', async () => {
    // jsonata reads a native function's parameters from its source text
    expect(
      Array.from(
        (await evalTruto('$map(["a", "b"], $wrap(?, "<", ">"))')) as unknown[]
      )
    ).toEqual(['<a>', '<b>'])
    expect(
      await evalTruto('$map([{"a": 1, "b": 2}], $pick(?, ["a"]))')
    ).toEqual({ a: 1 })
  })

  it('does not walk or copy the same value again at every call in a loop', async () => {
    const rows = Array.from({ length: 2000 }, (_, id) => ({ id, a: { b: id } }))
    for (const loop of [
      // input, already host-shaped
      '$count($map(rows, function($r) { $find($$.rows, {"id": $r.id}) }))',
      // built in the expression, so copied once
      '($all := $map(rows, function($r) { {"id": $r.id, "x": $r.a} }); $count($map(rows, function($r) { $find($all, {"id": $r.id}) })))',
    ]) {
      const started = performance.now()
      expect(await trutoJsonata(loop).evaluate({ rows })).toBe(2000)
      // a walk or copy per call took seconds here
      expect(performance.now() - started).toBeLessThan(1000)
    }
  })

  it('sees what a transform writes after a function read the node', async () => {
    // $keys reads the matched node before the update is written into it
    expect(
      await evalTruto(
        '($t := {"a": {"x": 1}} ~> | a | {"n": $count($keys($)), "b": {"k": 1}} |; $jsToXml($t))'
      )
    ).toContain('<k>1</k>')
    expect(
      await evalTruto(
        '($t := x ~> | a | {"n": $count($keys($)), "b": {"k": 1}} |; $jsToXml($t))',
        { x: { a: { x: 1 } } }
      )
    ).toContain('<k>1</k>')
  })

  it('sees what a transform writes when the expression has its own $clone', async () => {
    expect(
      await evalTruto(
        '($clone := function($x) { $x }; $o := {"a": {"x": 1}}; $k := $keys($o.a); $t := $o ~> | a | {"b": {"k": 1}} |; $jsToXml($o))'
      )
    ).toContain('<k>1</k>')
    expect(
      await trutoJsonata(
        '($o := {"a": {"x": 1}}; $k := $keys($o.a); $t := $o ~> | a | {"b": {"k": 1}} |; $jsToXml($o))'
      ).evaluate({}, { clone: (x: unknown) => x })
    ).toContain('<k>1</k>')
  })

  it('keeps $clone and transform results the same', async () => {
    expect(
      await evalTruto(
        '$clone({"a": [1, 2.123456789012345678], "b": {"c": null}})'
      )
    ).toEqual({ a: [1, 2.12345678901235], b: { c: null } })
    expect(
      await evalTruto('{"a": {"x": 1}, "y": 2} ~> | a | {"z": 3}, ["x"] |')
    ).toEqual({ a: { z: 3 }, y: 2 })
  })

  it('keeps the jsonata sequence flag on arrays it copies', async () => {
    // a singleton sequence still collapses after the argument is copied
    expect(await evalTruto('$string([{"a": 1}])')).toBe('[{"a":1}]')
  })
})

describe('$each and $sift callbacks', () => {
  it('get DateTimes the expression can read', async () => {
    expect(
      await evalTruto(
        `$each({"d": $dtFromIso("${ISO}", "UTC")}, function($v) { $v.year & "-" & $v.toISODate() })`
      )
    ).toBe('2024-2024-03-10')
    expect(
      Object.keys(
        (await evalTruto(
          `$sift({"d": $dtFromIso("${ISO}", "UTC"), "e": 1}, function($v) { $v.year = 2024 })`
        )) as object
      )
    ).toEqual(['d'])
  })
})

describe('binary helpers take wrapped and raw bytes like 2.0', () => {
  it('$base64encode encodes the bytes of a $jsonToParquet result', async () => {
    const encoded = (await evalTruto(
      '$base64encode($jsonToParquet([{"a": 1}]))'
    )) as string
    // "PAR1" magic, not the text "[object Object]"
    expect(encoded.startsWith('UEFSMR')).toBe(true)
  })

  it('$getDataUri accepts an ArrayBuffer result and a string', async () => {
    expect(
      await evalTruto(
        '$getDataUri($jsonToParquet([{"a": 1}]), "application/octet-stream")'
      )
    ).toMatch(/^data:application\/octet-stream;base64,UEFSMR/)
    expect(await evalTruto('$getDataUri("hi", "text/plain")')).toBe(
      'data:text/plain;base64,aGk='
    )
    expect(await evalTruto('$getDataUri([1, 2], "a/b")')).toBe(
      'data:a/b;base64,AQI='
    )
  })

  it('$bufferToString returns a string unchanged and decodes an ArrayBuffer', async () => {
    expect(await evalTruto('$bufferToString("abc")')).toBe('abc')
    expect(
      await evalTruto(
        '$substring($bufferToString($jsonToParquet([{"a": 1}]), "latin1"), 0, 4)'
      )
    ).toBe('PAR1')
  })

  it('$digest hashes the bytes of a wrapped ArrayBuffer, not its text', async () => {
    const [ofBytes, ofText] = (await evalTruto(
      '[$digest($jsonToParquet([{"a": 1}])), $digest("[object Object]")]'
    )) as string[]
    expect(ofBytes).not.toBe(ofText)
  })
})

// Nested results carry jsonata's own `sequence` flag, as under 2.0; compare
// the plain JSON shape.
const plain = (value: unknown) => JSON.parse(JSON.stringify(value))

describe('$keys and $each return jsonata sequences like 2.0', () => {
  it('keeps one-key and empty results as array entries in $map', async () => {
    expect(
      plain(
        await evalTruto(
          '$map([{"c": 1}, {"d": 1}], function($o) { $keys($o) })'
        )
      )
    ).toEqual([['c'], ['d']])
    expect(
      plain(await evalTruto('$map([{"c": 1, "x": 2}, {}], $keys)'))
    ).toEqual([['c', 'x'], []])
    expect(
      plain(
        await evalTruto(
          '$map([{"c": 1}, {"d": 1}], function($o) { $each($o, function($v, $k) { $k }) })'
        )
      )
    ).toEqual([['c'], ['d']])
  })

  it('still collapses at the call site', async () => {
    expect(await evalTruto('$keys({"a": 1})')).toBe('a')
    expect(await evalTruto('$keys({})')).toBeUndefined()
  })
})

describe('Blob extra props reach the host', () => {
  it('puts name on the native Blob the host gets back', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    const native = deepUnwrapNative(
      toJsonataBlob(blob, { name: 'page.pdf' })
    ) as Blob & { name?: string }
    expect(native).toBe(blob)
    expect(native.name).toBe('page.pdf')
  })

  it("leaves a File's own name alone", () => {
    const file = new File(['x'], 'real.txt')
    toJsonataBlob(file, { name: 'other.txt' })
    expect(file.name).toBe('real.txt')
  })
})

describe('DateTime wrapper', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('computes getters only when an expression reads them', async () => {
    const zoneName = vi.spyOn(DateTime.prototype, 'offsetNameLong', 'get')
    expect(await evalTruto(`$dtFromIso("${ISO}", "UTC").year`)).toBe(2024)
    expect(zoneName).not.toHaveBeenCalled()
  })

  it('still lists, reads and serializes every member', async () => {
    const keys = Object.keys(toJsonataDateTime(DateTime.fromISO(ISO)))
    expect(keys).toContain('year')
    expect(keys).toContain('zone')
    expect(keys).toContain('toISO')
    expect(await evalTruto(`$dtFromIso("${ISO}", "UTC").zone`)).toBe('UTC')
    expect(await evalTruto(`$merge([$dtFromIso("${ISO}", "UTC")]).year`)).toBe(
      2024
    )
    expect(await evalTruto(`$string($dtFromIso("${ISO}", "UTC"))`)).toBe(
      '"2024-03-10T12:34:56.000Z"'
    )
  })

  it('can be frozen', () => {
    const wrapped = Object.freeze(toJsonataDateTime(DateTime.fromISO(ISO)))
    expect(Object.isFrozen(wrapped)).toBe(true)
    expect(wrapped.year).toBe(2024)
  })

  it('hands the host a real luxon DateTime', async () => {
    const result = (await evalTruto(`{"d": $dtFromIso("${ISO}")}`)) as {
      d: unknown
    }
    expect(DateTime.isDateTime(result.d)).toBe(true)
    expect(() => structuredClone(result)).not.toThrow()
  })
})

describe('input mirror', () => {
  it('passes plain input through without copying it', async () => {
    const input = { rows: [{ a: 1, b: { c: [1, 2] } }] }
    const result = await trutoJsonata('rows[0].b').evaluate(input)
    expect(result).toBe(input.rows[0].b)
  })
})

describe('cyclic values that change', () => {
  it('mirror: a back-reference reaches the readable copy', async () => {
    const input: Record<string, unknown> = { u: new URL('https://a.b/x') }
    input.self = input
    expect(await trutoJsonata('self.u.host').evaluate(input)).toBe('a.b')
  })

  it('unwrap: a back-reference reaches the host copy', () => {
    const node: Record<string, unknown> = Object.create(null)
    node.d = toJsonataDateTime(DateTime.fromISO(ISO))
    node.self = node
    const out = deepUnwrapNative(node) as Record<string, unknown>
    expect(out.self).toBe(out)
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect(DateTime.isDateTime(out.d)).toBe(true)
  })

  it('host args: a back-reference reaches the host copy', () => {
    const node: Record<string, unknown> = Object.create(null)
    node.self = node
    const out = toHostArg(node) as Record<string, unknown>
    expect(out.self).toBe(out)
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
  })
})
