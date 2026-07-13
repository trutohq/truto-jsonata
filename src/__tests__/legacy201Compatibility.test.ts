import { DateTime } from 'luxon'
import oldTrutoJsonata from 'truto-jsonata-2-0-1'
import { describe, expect, it } from 'vitest'
import trutoJsonata from '../index'

type InputFactory = () => unknown

type CompatibilityCase = {
  name: string
  expression: string
  input?: InputFactory
}

async function normalize(value: unknown): Promise<unknown> {
  if (value instanceof URL) {
    return { native: 'URL', href: value.href }
  }
  if (value instanceof Response) {
    return {
      native: 'Response',
      status: value.status,
      headers: Object.fromEntries(value.headers.entries()),
    }
  }
  if (value instanceof Date) {
    return { native: 'Date', iso: value.toISOString() }
  }
  if (DateTime.isDateTime(value)) {
    return { native: 'DateTime', iso: value.toISO() }
  }
  if (value instanceof Blob) {
    return {
      native:
        typeof File !== 'undefined' && value instanceof File ? 'File' : 'Blob',
      type: value.type,
      size: value.size,
      text: await value.text(),
      ...(typeof File !== 'undefined' && value instanceof File
        ? { name: value.name, lastModified: value.lastModified }
        : {}),
    }
  }
  if (value instanceof ArrayBuffer) {
    return { native: 'ArrayBuffer', bytes: [...new Uint8Array(value)] }
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map(normalize))
  }
  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, nested]) => [
        key,
        await normalize(nested),
      ])
    )
    const prototype = Object.getPrototypeOf(value)
    return {
      objectPrototype:
        prototype === Object.prototype
          ? 'Object'
          : prototype === null
          ? 'null'
          : 'other',
      value: Object.fromEntries(entries),
    }
  }
  return value
}

async function evaluateBoth({
  expression,
  input = () => ({}),
}: CompatibilityCase) {
  const oldResult = await oldTrutoJsonata(expression).evaluate(input())
  const currentResult = await trutoJsonata(expression).evaluate(input())
  return {
    oldResult: await normalize(oldResult),
    currentResult: await normalize(currentResult),
  }
}

const LANGUAGE_CASES: CompatibilityCase[] = [
  {
    name: 'path, predicate, and object construction',
    expression: 'users[active].{"id": id, "label": name & ":" & id}',
    input: () => ({
      users: [
        { id: 1, name: 'Ada', active: true },
        { id: 2, name: 'Grace', active: false },
      ],
    }),
  },
  {
    name: 'map/filter/reduce callbacks',
    expression:
      '$reduce($map($filter(values, function($v){$v > 1}), function($v){$v * 2}), function($a,$v){$a+$v}, 0)',
    input: () => ({ values: [1, 2, 3] }),
  },
  {
    name: '$each missing input',
    expression: '$each(missing, function($v,$k){$k & $v})',
  },
  {
    name: '$sift missing input',
    expression: '$sift(missing, function($v){$v})',
  },
  {
    name: '$each context injection and callback arity',
    expression: 'o.$each(function($v,$k){$k & "=" & $v})',
    input: () => ({ o: { a: 1, b: 2 } }),
  },
  {
    name: '$sift effective boolean behavior',
    expression: '$sift(o, function($v){$v})',
    input: () => ({ o: { zero: 0, one: 1, empty: [], values: [0, 2] } }),
  },
  {
    name: '$append and $lookup production idiom',
    expression:
      '$append(["id is not null"], $lookup(filters, "owner") ? "owner = " & filters.owner)',
    input: () => ({ filters: { owner: '42' } }),
  },
  {
    name: '$zip repeating signature',
    expression: '$zip([1,2], ["a","b"], [true,false])',
  },
  {
    name: 'wildcard over ordinary data',
    expression: '{"a": 1, "b": {"c": 2}}.**',
  },
  {
    name: 'object transform',
    expression: 'items ~> |$|{"active": true}, ["legacy"]|',
    input: () => ({ items: [{ id: 1, legacy: true }] }),
  },
  {
    name: '$toMillis with fractional seconds',
    expression: '$toMillis("2020-01-01T00:00:00.123456Z")',
  },
  {
    name: '$formatNumber',
    expression: '$formatNumber(12345.67, "#,##0.00")',
  },
  {
    name: '$formatBase with a large integer',
    expression: '$formatBase(5890840712243076, 16)',
  },
  {
    name: '$pad with integer width',
    expression: '$pad("x", -4, "0")',
  },
]

const STRING_CASES: CompatibilityCase[] = [
  {
    name: 'large integer precision',
    expression: '$string(1000000000000000100)',
  },
  {
    name: 'nested large integer precision',
    expression: '$string({"id": 1000000000000000100})',
  },
  {
    name: 'context-injected string conversion',
    expression: 'id.$string()',
    input: () => ({ id: 1000000000000000100 }),
  },
  {
    name: 'prettified object',
    expression: '$string({"a": 1, "b": [2]}, true)',
  },
  {
    name: 'lambda conversion',
    expression: '$string(function($x){$x})',
  },
  {
    name: 'native-return wrapper string conversion',
    expression: '$string($blob("x", {"type":"text/plain"}))',
  },
  {
    name: 'native-return wrapper nested string conversion',
    expression: '$string({"blob": $blob("x", {"type":"text/plain"})})',
  },
]

const CUSTOM_FUNCTION_CASES: CompatibilityCase[] = [
  {
    name: '$groupBy',
    expression: '$groupBy(items, "type")',
    input: () => ({
      items: [
        { id: 1, type: 'a' },
        { id: 2, type: 'b' },
        { id: 3, type: 'a' },
      ],
    }),
  },
  {
    name: '$keyBy',
    expression: '$keyBy(items, "id")',
    input: () => ({
      items: [
        { id: 'a', v: 1 },
        { id: 'b', v: 2 },
      ],
    }),
  },
  {
    name: '$pick and $omit',
    expression: '{"picked": $pick(o, ["a","c"]), "omitted": $omit(o, ["b"])}',
    input: () => ({ o: { a: 1, b: 2, c: 3 } }),
  },
  {
    name: '$compact and $join',
    expression: '$join($compact(values), ",")',
    input: () => ({ values: [0, 1, false, 2, '', 3, null] }),
  },
  {
    name: '$orderBy',
    expression: '$orderBy(items, ["score","name"], ["desc","asc"])',
    input: () => ({
      items: [
        { name: 'b', score: 2 },
        { name: 'a', score: 2 },
        { name: 'c', score: 1 },
      ],
    }),
  },
  {
    name: '$find and $lofilter',
    expression:
      '{"first": $find(items, "active"), "all": $lofilter(items, "active")}',
    input: () => ({
      items: [
        { id: 1, active: false },
        { id: 2, active: true },
        { id: 3, active: true },
      ],
    }),
  },
  {
    name: '$values and $chunk',
    expression: '$chunk($values(o), 2)',
    input: () => ({ o: { a: 1, b: 2, c: 3 } }),
  },
  {
    name: '$difference',
    expression: '$difference([1,2,3,4], [2,4])',
  },
  {
    name: '$flatten variants',
    expression:
      '{"one": $flatten([1,[2,[3]]]), "two": $flattenDepth([1,[2,[3]]], 2), "all": $flattenDeep([1,[2,[3]]])}',
  },
  {
    name: '$parseQuery and $stringifyQuery',
    expression: '$stringifyQuery($parseQuery("a=1&b%5B%5D=x&b%5B%5D=y"))',
  },
  {
    name: '$mapValues',
    expression:
      '$mapValues(["Open","Closed"], {"open":"active","closed":"inactive"}, true)',
  },
  {
    name: '$firstNonEmpty',
    expression: '$firstNonEmpty(null, missing, "", 0, "fallback")',
  },
  {
    name: '$convertMarkdownToSlack',
    expression:
      '$convertMarkdownToSlack("**bold** and _italic_ and ~~strikethrough~~")',
  },
  {
    name: '$keys on native-return wrappers',
    expression: `{
      "blob": $keys($blob("x", {"type":"text/plain"})),
      "url": $keys($parseUrl("https://example.com/a?q=1")),
      "date": $keys($dtFromIso("2024-01-15T00:00:00Z"))
    }`,
  },
]

const NATIVE_CASES: CompatibilityCase[] = [
  {
    name: 'host URL property',
    expression: 'u.pathname',
    input: () => ({ u: new URL('https://example.com/a/b?q=1') }),
  },
  {
    name: 'host Response property',
    expression: 'r.status',
    input: () => ({ r: new Response(null, { status: 204 }) }),
  },
  {
    name: 'host Response headers method',
    expression: 'r.headers.get("x-test")',
    input: () => ({
      r: new Response('hello', { headers: { 'x-test': 'yes' } }),
    }),
  },
  {
    name: 'host Response headers enumeration',
    expression: '$keys(r.headers)',
    input: () => ({
      r: new Response('hello', { headers: { 'x-test': 'yes' } }),
    }),
  },
  {
    name: 'host Response headers round-trip',
    expression: 'r.headers',
    input: () => ({
      r: new Response('hello', { headers: { 'x-test': 'yes' } }),
    }),
  },
  {
    name: 'host Response text method',
    expression: 'r.text()',
    input: () => ({ r: new Response('hello') }),
  },
  {
    name: 'host Response round-trip',
    expression: 'r',
    input: () => ({
      r: new Response('hello', {
        status: 201,
        headers: { 'x-test': 'yes' },
      }),
    }),
  },
  {
    name: 'host Blob property',
    expression: 'b.size',
    input: () => ({ b: new Blob(['hello'], { type: 'text/plain' }) }),
  },
  {
    name: 'host File property',
    expression: 'f.name',
    input: () => ({
      f: new File(['x'], 'a.txt', {
        type: 'text/plain',
        lastModified: 1_700_000_000_000,
      }),
    }),
  },
  {
    name: 'host ArrayBuffer property',
    expression: 'b.byteLength',
    input: () => ({ b: new ArrayBuffer(8) }),
  },
  {
    name: 'host Uint8Array fields and returned view',
    expression:
      '{"length": bytes.length, "byteLength": bytes.byteLength, "sliceLength": bytes.slice(1).length, "keys": $keys(bytes)}',
    input: () => ({ bytes: new Uint8Array([7, 8, 9]) }),
  },
  {
    name: 'host DataView method',
    expression: 'view.getUint8(1)',
    input: () => ({
      view: new DataView(new Uint8Array([7, 8, 9]).buffer),
    }),
  },
  {
    name: 'host Date method',
    expression: 'sync_job_run.started_at.toISOString()',
    input: () => ({
      sync_job_run: {
        started_at: new Date('2026-07-13T06:55:02.000Z'),
      },
    }),
  },
  {
    name: 'host Date wildcard does not expose stamped methods',
    expression: 'started_at.*',
    input: () => ({
      started_at: new Date('2026-07-13T06:55:02.000Z'),
    }),
  },
  {
    name: 'host ReadableStream property',
    expression: 'stream.locked',
    input: () => ({ stream: new ReadableStream() }),
  },
  {
    name: 'host Luxon DateTime property',
    expression: 'dt.year',
    input: () => ({
      dt: DateTime.fromISO('2024-01-15T00:00:00.000Z', { zone: 'utc' }),
    }),
  },
  {
    name: '$parseUrl property chain',
    expression: '$parseUrl(u).searchParams.get("q")',
    input: () => ({ u: 'https://example.com/a?q=one' }),
  },
  {
    name: '$parseUrl result round-trip',
    expression: '$parseUrl(u)',
    input: () => ({ u: 'https://example.com/a?q=one' }),
  },
  {
    name: '$dtFromIso property and method chain',
    expression: '$dtFromIso(iso).toUTC().toISO()',
    input: () => ({ iso: '2024-01-15T00:00:00.000Z' }),
  },
  {
    name: '$dtFromIso result round-trip',
    expression: '$dtFromIso(iso)',
    input: () => ({ iso: '2024-01-15T00:00:00.000Z' }),
  },
  {
    name: '$blob property chain',
    expression: '$blob("hello", {"type":"text/plain"}).size',
  },
  {
    name: '$getArrayBuffer composition',
    expression: '$getArrayBuffer($blob("hello", {"type":"text/plain"}))',
  },
]

describe('published 2.0.1 compatibility oracle', () => {
  it.each([
    ...LANGUAGE_CASES,
    ...STRING_CASES,
    ...CUSTOM_FUNCTION_CASES,
    ...NATIVE_CASES,
  ])('$name', async testCase => {
    const { oldResult, currentResult } = await evaluateBoth(testCase)
    expect(currentResult).toEqual(oldResult)
  })

  it.each([
    {
      name: '$each explicit null',
      expression: '$each(x, function($v){$v})',
      input: { x: null },
    },
    {
      name: '$sift explicit null',
      expression: '$sift(x, function($v){$v})',
      input: { x: null },
    },
    {
      name: '$string non-finite number',
      expression: '$string(x)',
      input: { x: Infinity },
    },
    {
      name: '$string nested non-finite number',
      expression: '$string({"x": x})',
      input: { x: Infinity },
    },
  ])('$name preserves the legacy error code', async ({ expression, input }) => {
    const getCode = async (
      factory: typeof trutoJsonata | typeof oldTrutoJsonata
    ) => {
      try {
        await factory(expression).evaluate(input)
      } catch (error) {
        return (error as { code?: string }).code
      }
      return undefined
    }

    expect(await getCode(trutoJsonata)).toBe(await getCode(oldTrutoJsonata))
  })

  it('preserves the callback evaluate overload', async () => {
    const evaluateWithCallback = (
      factory: typeof trutoJsonata | typeof oldTrutoJsonata
    ) =>
      new Promise<{ returnValue: unknown; value: unknown }>(
        (resolve, reject) => {
          const expression = factory('{"id": id, "large": $string(large)}')
          const returnValue = expression.evaluate(
            { id: 1, large: 1000000000000000100 },
            {},
            (error: unknown, value: unknown) => {
              if (error) {
                reject(error)
                return
              }
              resolve({ returnValue, value })
            }
          )
        }
      )

    const legacy = await evaluateWithCallback(oldTrutoJsonata)
    const current = await evaluateWithCallback(trutoJsonata)
    expect(current.returnValue).toBeInstanceOf(Promise)
    expect(legacy.returnValue).toBeInstanceOf(Promise)
    expect(await normalize(current.value)).toEqual(
      await normalize(legacy.value)
    )
    expect(await normalize(await current.returnValue)).toEqual(
      await normalize(await legacy.returnValue)
    )
  })
})
