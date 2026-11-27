import { DateTime } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'
import trutoJsonata from '../index'
import { toJsonataBlob } from '../functions/toJsonataBlob'
import { toJsonataDateTime } from '../functions/toJsonataDateTime'
import deepUnwrapNative from '../functions/deepUnwrapNative'
import toHostArg from '../functions/toHostArg'
import { evalTruto } from './helpers/jsonataEval'
import { patchJsonata } from '../../scripts/jsonata20NumberText'

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

// JSONata 2.2 changed these builtins. Expressions written for 2.0 rely on the
// old results, so the builds and these tests run a patched jsonata (see
// scripts/jsonata20NumberText.ts) and a 2.0 $toMillis.
describe('jsonata builtins behave as in 2.0', () => {
  const run = (expr: string, input: unknown = {}) =>
    trutoJsonata(expr).evaluate(input)

  it('turns numbers into text with 15 significant digits', async () => {
    expect(await run('1234567890123456 & ""')).toBe('1234567890123460')
    expect(await run('"id-" & x', { x: 9007199254740993 })).toBe(
      'id-9007199254740990'
    )
    expect(await run('$string(9007199254740993)')).toBe('9007199254740990')
    expect(await run('$string({"id": 1234567890123456})')).toBe(
      '{"id":1234567890123460}'
    )
    expect(await run('0.1 + 0.2 & ""')).toBe('0.3')
    expect(await run('{"a": 1234567890123456} ~> | $ | {"b": 1} |')).toEqual({
      a: 1234567890123460,
      b: 1,
    })
  })

  it('the build patch fails loudly if jsonata moves the line', () => {
    expect(() => patchJsonata('no such line')).toThrow(/expected 1 match/)
  })

  it('$toMillis gives NaN for the date text 2.0 let through', async () => {
    expect(await run('$toMillis("2024-01-15-16")')).toBeNaN()
    expect(await run('$toMillis("2024-13")')).toBeNaN()
    expect(await run('$toMillis("2024-01-15T10:00:00Z")')).toBe(1705312800000)
    expect(
      await run('$toMillis("15/01/2024", "[D01]/[M01]/[Y0001]")')
    ).toBe(1705276800000)
    await expect(run('$toMillis("2024-01-15x")')).rejects.toMatchObject({
      code: 'D3110',
    })
  })

  it('$toMillis stays fast on long date-like text', async () => {
    // 2.0's own check backtracked on text like this (the $toMillis DoS)
    const start = performance.now()
    for (const tail of ['!', '-0530!', 'T10:20:30!']) {
      const s = '2024' + '-01'.repeat(50_000) + tail
      await expect(run('$toMillis(s)', { s })).rejects.toMatchObject({
        code: 'D3110',
      })
    }
    expect(performance.now() - start).toBeLessThan(1000)
  })

  it('$teeStream fails with the 2.0 message on a bad argument', async () => {
    await expect(run('$teeStream("x")')).rejects.toThrow(
      'stream.tee is not a function'
    )
  })
})
