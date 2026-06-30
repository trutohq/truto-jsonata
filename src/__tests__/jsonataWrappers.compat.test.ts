import { DepGraph } from 'dependency-graph'
import { DateTime } from 'luxon'
import { toJsonataArrayBuffer } from '../functions/toJsonataArrayBuffer'
import { toJsonataBlob } from '../functions/toJsonataBlob'
import { toJsonataDateTime } from '../functions/toJsonataDateTime'
import { toJsonataDepGraph } from '../functions/toJsonataDepGraph'
import { toJsonataReadableStream } from '../functions/toJsonataReadableStream'
import { toJsonataUrl } from '../functions/parseUrl'
import {
  unwrapArrayBuffer,
  unwrapBlob,
  unwrapDateTime,
  unwrapDepGraph,
  unwrapReadableStream,
  unwrapUrl,
} from '../functions/unwrapNative'
import jsonata from 'jsonata'
import teeStream from '../functions/teeStream'
import { registerCoreExtensions } from '../presets/core'
import { evalCore, evalDataFormats, evalDatetime } from './helpers/jsonataEval'
import { describe, expect, it } from 'vitest'

const SAMPLE_URL =
  'https://user:pass@api.example.com:8080/files/doc.pdf?mime_type=application%2Fpdf&token=abc#section'

describe('unwrapNative', () => {
  it('unwraps every wrapped native type', () => {
    const blob = new Blob(['x'], { type: 'text/plain' })
    const buffer = new ArrayBuffer(4)
    const stream = new ReadableStream()
    const graph = new DepGraph<string>()
    graph.addNode('a', 'data-a')
    const dt = toJsonataDateTime(
      DateTime.fromISO('2024-01-01T00:00:00.000Z')
    )
    const url = toJsonataUrl(new URL(SAMPLE_URL))

    expect(unwrapBlob(toJsonataBlob(blob))).toBe(blob)
    expect(unwrapArrayBuffer(toJsonataArrayBuffer(buffer))).toBe(buffer)
    expect(unwrapReadableStream(toJsonataReadableStream(stream))).toBe(stream)
    expect(unwrapDepGraph(toJsonataDepGraph(graph))?.getNodeData('a')).toBe(
      'data-a'
    )
    expect(unwrapDateTime(dt)?.year).toBe(2024)
    expect(unwrapUrl(url)?.hostname).toBe('api.example.com')
  })
})

describe('$parseUrl — all URL fields via JSONata', () => {
  const u = { u: SAMPLE_URL }

  it.each([
    ['href', SAMPLE_URL],
    ['origin', 'https://api.example.com:8080'],
    ['protocol', 'https:'],
    ['username', 'user'],
    ['password', 'pass'],
    ['host', 'api.example.com:8080'],
    ['hostname', 'api.example.com'],
    ['port', '8080'],
    ['pathname', '/files/doc.pdf'],
    ['hash', '#section'],
    ['search', '?mime_type=application%2Fpdf&token=abc'],
  ] as const)('property %s', async (prop, expected) => {
    await expect(evalCore(`$parseUrl(u).${prop}`, u)).resolves.toBe(expected)
  })

  it('searchParams.get', async () => {
    await expect(
      evalCore('$parseUrl(u).searchParams.get("mime_type")', u)
    ).resolves.toBe('application/pdf')
    await expect(
      evalCore('$parseUrl(u).searchParams.get("missing")', u)
    ).resolves.toBeNull()
  })

  it('searchParams.has', async () => {
    await expect(
      evalCore('$parseUrl(u).searchParams.has("token")', u)
    ).resolves.toBe(true)
    await expect(
      evalCore('$parseUrl(u).searchParams.has("nope")', u)
    ).resolves.toBe(false)
  })

  it('searchParams.getAll', async () => {
    const multi = 'https://x.test/a?tag=1&tag=2'
    await expect(
      evalCore('$parseUrl(u).searchParams.getAll("tag")', { u: multi })
    ).resolves.toEqual(['1', '2'])
  })
})

describe('$dtFromIso / $dtFromFormat — DateTime fields and methods via JSONata', () => {
  const iso = '2024-06-15T14:30:00.000Z'

  it.each([
    ['year', '$dtFromIso(iso).year', 2024],
    ['month', '$dtFromIso(iso).month', 6],
    ['day', '$dtFromIso(iso).day', 15],
    ['hour UTC', '$dtFromIso(iso).toUTC().hour', 14],
    ['minute UTC', '$dtFromIso(iso).toUTC().minute', 30],
    ['isValid true', '$dtFromIso(iso).isValid', true],
    ['isValid false', '$dtFromIso("bad").isValid', false],
  ] as const)('%s', async (_label, expression, expected) => {
    await expect(evalDatetime(expression, { iso })).resolves.toBe(expected)
  })

  it.each([
    ['toISO', '$dtFromIso(iso).toISO()', 'string'],
    ['toFormat', '$dtFromIso(iso).toFormat("yyyy-MM-dd")', 'string'],
    ['toMillis', '$dtFromIso(iso).toMillis()', 'number'],
    ['toISODate', '$dtFromIso(iso).toISODate()', 'string'],
    ['toSeconds', '$dtFromIso(iso).toSeconds()', 'number'],
    ['toUTC', '$dtFromIso(iso).toUTC().toISO()', 'string'],
    ['toJSDate', '$dtFromIso(iso).toJSDate()', 'object'],
  ] as const)('method %s returns %s', async (_name, expression, type) => {
    const result = await evalDatetime(expression, { iso })
    expect(result).toBeDefined()
    expect(typeof result).toBe(type)
  })

  it.each([
    [
      'plus',
      '$dtFromIso(iso).plus({"days": 1}).toFormat("yyyy-MM-dd")',
      '2024-06-16',
    ],
    [
      'minus',
      '$dtFromIso(iso).minus({"month": 1}).toFormat("yyyy-MM")',
      '2024-05',
    ],
    [
      'startOf',
      '$dtFromIso(iso).startOf("day").toFormat("yyyy-MM-dd")',
      '2024-06-15',
    ],
    [
      'endOf',
      '$dtFromIso(iso).endOf("month").toFormat("yyyy-MM-dd")',
      '2024-06-30',
    ],
    [
      'setZone arg',
      '$dtFromIso(iso, "UTC").toFormat("yyyy")',
      '2024',
    ],
    [
      'setZone method',
      '$dtFromIso(iso).setZone("UTC").toFormat("yyyy")',
      '2024',
    ],
  ] as const)('%s', async (_name, expression, expected) => {
    await expect(evalDatetime(expression, { iso })).resolves.toBe(expected)
  })

  it('diff and duration toObject.minutes', async () => {
    const minutes = await evalDatetime(
      '$dtFromIso("2024-01-15T12:30:00.000Z").diff($dtFromIso("2024-01-15T00:00:00.000Z"), ["minutes"]).toObject().minutes'
    )
    expect(minutes).toBe(750)
  })

  it('$dtFromFormat fromSeconds', async () => {
    await expect(
      evalDatetime('$dtFromFormat("1667313600", "fromSeconds").toISO()')
    ).resolves.toContain('2022')
  })
})

describe('$blob / $base64ToBlob — Blob fields and methods via JSONata', () => {
  it.each([
    ['size', '$blob("hello", {"type": "text/plain"}).size', 5],
    ['type', '$blob("hello", {"type": "text/plain"}).type', 'text/plain'],
    [
      'slice size',
      '$blob("hello", {"type": "text/plain"}).slice(0, 2).size',
      2,
    ],
  ] as const)('%s', async (_name, expression, expected) => {
    await expect(evalCore(expression)).resolves.toBe(expected)
  })

  it('text()', async () => {
    await expect(
      evalCore('$blob("hello", {"type": "text/plain"}).text()')
    ).resolves.toBe('hello')
  })

  it('arrayBuffer byteLength via nested call', async () => {
    const len = await evalCore(
      '$type($blob("ab", {"type": "text/plain"}).arrayBuffer())'
    )
    expect(len).toBe('object')
  })

  it('stream().locked', async () => {
    await expect(
      evalCore('$blob("x", {"type": "text/plain"}).stream().locked')
    ).resolves.toBe(false)
  })

  it('$base64ToBlob preserves type and size', async () => {
    await expect(
      evalCore('$base64ToBlob("SGVsbG8=", {"mimeType": "text/plain"}).type')
    ).resolves.toBe('text/plain')
    await expect(
      evalCore('$base64ToBlob("SGVsbG8=").size')
    ).resolves.toBe(5)
  })
})

describe('$jsonToParquet — ArrayBuffer fields via JSONata', () => {
  it('byteLength', async () => {
    const len = await evalDataFormats('$jsonToParquet([{"id": 1}]).byteLength')
    expect(typeof len).toBe('number')
    expect((len as number) > 0).toBe(true)
  })

  it('slice reduces byteLength', async () => {
    const full = (await evalDataFormats(
      '$jsonToParquet([{"id": 1}]).byteLength'
    )) as number
    const partial = (await evalDataFormats(
      '$jsonToParquet([{"id": 1}]).slice(0, 10).byteLength'
    )) as number
    expect(partial).toBe(10)
    expect(partial).toBeLessThan(full)
  })
})

describe('$teeStream / ReadableStream wrapper via JSONata', () => {
  async function evalWithTee(expression: string) {
    const expr = registerCoreExtensions(jsonata(expression))
    expr.registerFunction('teeFn', async () => teeStream(new ReadableStream()))
    return expr.evaluate({})
  }

  it('returns a two-element array', async () => {
    const branches = await evalWithTee('$teeFn()')
    expect(branches).toHaveLength(2)
  })

  it.each([
    ['locked on branch 0', '$teeFn()[0].locked', false],
    ['locked on branch 1', '$teeFn()[1].locked', false],
  ] as const)('%s', async (_label, expression, expected) => {
    await expect(evalWithTee(expression)).resolves.toBe(expected)
  })

  it('tee() on branch produces more streams', async () => {
    const nested = await evalWithTee('$teeFn()[0].tee()')
    expect(nested).toHaveLength(2)
    expect(nested[0].locked).toBe(false)
  })

  it('cancel on stream', async () => {
    const expr = registerCoreExtensions(jsonata('$streamFn().cancel()'))
    expr.registerFunction('streamFn', () =>
      toJsonataReadableStream(new ReadableStream())
    )
    await expect(expr.evaluate({})).resolves.toBeUndefined()
  })
})

describe('$dependencyGraph — DepGraph methods via JSONata', () => {
  const graphData = [
    { id: 'c', parent_id: 'b' },
    { id: 'b', parent_id: 'a' },
    { id: 'a', parent_id: null },
  ]

  it('overallOrder()', async () => {
    await expect(
      evalCore(
        '$dependencyGraph(nodes, "parent_id", "id").overallOrder()',
        { nodes: graphData }
      )
    ).resolves.toEqual(['a', 'b', 'c'])
  })

  it('overallOrder(true) leaves edges in result', async () => {
    const order = await evalCore(
      '$dependencyGraph(nodes, "parent_id", "id").overallOrder(true)',
      { nodes: graphData }
    )
    expect(order).toEqual(['a'])
  })

  it('dependenciesOf and dependantsOf', async () => {
    await expect(
      evalCore(
        '$dependencyGraph(nodes, "parent_id", "id").dependenciesOf("c")',
        { nodes: graphData }
      )
    ).resolves.toEqual(['a', 'b'])
    const dependants = await evalCore(
      '$dependencyGraph(nodes, "parent_id", "id").dependantsOf("a")',
      { nodes: graphData }
    )
    expect(dependants).toHaveLength(2)
    expect(dependants).toEqual(expect.arrayContaining(['b', 'c']))
  })

  it('hasNode and getNodeData', async () => {
    await expect(
      evalCore(
        '$dependencyGraph(nodes, "parent_id", "id").hasNode("a")',
        { nodes: graphData }
      )
    ).resolves.toBe(true)
    await expect(
      evalCore(
        '$dependencyGraph(nodes, "parent_id", "id").hasNode("z")',
        { nodes: graphData }
      )
    ).resolves.toBe(false)
    await expect(
      evalCore(
        '$dependencyGraph(nodes, "parent_id", "id").getNodeData("a").id',
        { nodes: graphData }
      )
    ).resolves.toBe('a')
  })

  it('clone() preserves overallOrder', async () => {
    const order = await evalCore(
      '($g := $dependencyGraph(nodes, "parent_id", "id"); $g2 := $g.clone(); $g2.overallOrder())',
      { nodes: graphData }
    )
    expect(order).toEqual(['a', 'b', 'c'])
  })
})

describe('wrapper symbols are not JSONata-visible', () => {
  it('does not expose native Blob via $keys', async () => {
    const keys = await evalCore('$keys($blob("x", {"type": "text/plain"}))')
    expect(keys).not.toContain('Symbol(nativeBlob)')
    expect(keys).toEqual(expect.arrayContaining(['size', 'type']))
  })
})
