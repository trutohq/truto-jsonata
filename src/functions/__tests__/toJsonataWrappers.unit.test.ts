import { DepGraph } from 'dependency-graph'
import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { toJsonataArrayBuffer } from '../toJsonataArrayBuffer'
import { toJsonataBlob } from '../toJsonataBlob'
import { toJsonataDateTime } from '../toJsonataDateTime'
import { toJsonataDepGraph } from '../toJsonataDepGraph'
import { toJsonataReadableStream } from '../toJsonataReadableStream'
import { toJsonataUrl } from '../parseUrl'
import {
  NATIVE_ARRAY_BUFFER,
  NATIVE_BLOB,
  NATIVE_DEP_GRAPH,
  NATIVE_LUXON_DATE_TIME,
  NATIVE_READABLE_STREAM,
  NATIVE_URL,
  unwrapArrayBuffer,
  unwrapBlob,
  unwrapDateTime,
  unwrapDepGraph,
  unwrapReadableStream,
  unwrapUrl,
} from '../unwrapNative'

describe('toJsonataBlob', () => {
  const blob = new Blob(['hello'], { type: 'text/plain' })
  const wrapped = toJsonataBlob(blob)

  it('exposes size and type', () => {
    expect(wrapped.size).toBe(5)
    expect(wrapped.type).toBe('text/plain')
  })

  it('text() and arrayBuffer()', async () => {
    await expect(wrapped.text()).resolves.toBe('hello')
    const buf = await wrapped.arrayBuffer()
    expect(buf.byteLength).toBe(5)
  })

  it('slice() returns a smaller wrapped blob', () => {
    const part = wrapped.slice(0, 2)
    expect(part.size).toBe(2)
    expect(unwrapBlob(part)).toBeInstanceOf(Blob)
  })

  it('stream() returns a wrapped readable stream', () => {
    const stream = wrapped.stream()
    expect(stream.locked).toBe(false)
    expect(unwrapReadableStream(stream)).toBeInstanceOf(ReadableStream)
  })

  it('accepts extra own props while preserving the native symbol', () => {
    const named = toJsonataBlob(blob, { name: 'report.pdf' })
    expect((named as { name: string }).name).toBe('report.pdf')
    expect(unwrapBlob(named)).toBe(blob)
  })
})

describe('native symbols are non-enumerable across wrappers', () => {
  function makeGraph() {
    const graph = new DepGraph<string>()
    graph.addNode('a', 'data')
    return graph
  }

  it('native handle is a non-enumerable own symbol', () => {
    const cases: ReadonlyArray<[object, symbol]> = [
      [toJsonataArrayBuffer(new ArrayBuffer(2)), NATIVE_ARRAY_BUFFER],
      [toJsonataReadableStream(new ReadableStream()), NATIVE_READABLE_STREAM],
      [toJsonataDepGraph(makeGraph()), NATIVE_DEP_GRAPH],
      [toJsonataBlob(new Blob(['x'])), NATIVE_BLOB],
      [toJsonataUrl(new URL('https://x.test')), NATIVE_URL],
      [toJsonataDateTime(DateTime.now()), NATIVE_LUXON_DATE_TIME],
    ]
    for (const [obj, sym] of cases) {
      expect(Object.getOwnPropertySymbols(obj)).toContain(sym)
      expect(Object.getOwnPropertyDescriptor(obj, sym)?.enumerable).toBe(false)
    }
  })

  it('Object.keys excludes native handles', () => {
    expect(Object.keys(toJsonataArrayBuffer(new ArrayBuffer(2)))).toEqual([
      'byteLength',
      'slice',
    ])
  })

  it('instanceof-based unwrap returns undefined for spread copies', () => {
    expect(unwrapArrayBuffer({ ...toJsonataArrayBuffer(new ArrayBuffer(2)) })).toBeUndefined()
    expect(
      unwrapReadableStream({ ...toJsonataReadableStream(new ReadableStream()) })
    ).toBeUndefined()
    expect(unwrapBlob({ ...toJsonataBlob(new Blob(['x'])) })).toBeUndefined()
    expect(unwrapUrl({ ...toJsonataUrl(new URL('https://x.test')) })).toBeUndefined()
  })
})

describe('toJsonataArrayBuffer', () => {
  const buffer = new Uint8Array([1, 2, 3, 4]).buffer
  const wrapped = toJsonataArrayBuffer(buffer)

  it('exposes byteLength', () => {
    expect(wrapped.byteLength).toBe(4)
  })

  it('slice() returns a wrapped slice', () => {
    const part = wrapped.slice(1, 3)
    expect(part.byteLength).toBe(2)
    expect(unwrapArrayBuffer(part)?.byteLength).toBe(2)
  })
})

describe('toJsonataReadableStream', () => {
  it('tee and getReader', async () => {
    const native = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'))
        controller.close()
      },
    })
    const wrapped = toJsonataReadableStream(native)
    expect(wrapped.locked).toBe(false)

    const [a, b] = wrapped.tee()
    expect(a.locked).toBe(false)
    expect(b.locked).toBe(false)

    const reader = a.getReader()
    const { value, done } = await reader.read()
    expect(done).toBe(false)
    expect(value).toBeDefined()
    reader.releaseLock()
  })

  it('cancel', async () => {
    const wrapped = toJsonataReadableStream(new ReadableStream())
    await expect(wrapped.cancel()).resolves.toBeUndefined()
  })
})

describe('toJsonataDepGraph', () => {
  it('forwards all graph methods', () => {
    const graph = new DepGraph<{ id: string }>()
    graph.addNode('a', { id: 'a' })
    graph.addNode('b', { id: 'b' })
    graph.addDependency('b', 'a')
    const wrapped = toJsonataDepGraph(graph)

    expect(wrapped.overallOrder()).toEqual(['a', 'b'])
    expect(wrapped.dependenciesOf('b')).toEqual(['a'])
    expect(wrapped.dependantsOf('a')).toEqual(['b'])
    expect(wrapped.hasNode('a')).toBe(true)
    expect(wrapped.getNodeData('a')).toEqual({ id: 'a' })
    expect(wrapped.clone().overallOrder()).toEqual(['a', 'b'])
    expect(unwrapDepGraph(wrapped)).toBe(graph)
  })
})

describe('toJsonataDateTime', () => {
  it('forwards every bound Luxon method', () => {
    const dt = DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' })
    const wrapped = toJsonataDateTime(dt)

    expect(wrapped.year).toBe(2024)
    expect(wrapped.toISO()).toContain('2024-06-15')
    expect(wrapped.toUTC().toFormat('HH')).toBe('14')
    expect(wrapped.plus({ days: 1 }).day).toBe(16)
    expect(wrapped.minus({ days: 1 }).day).toBe(14)
    expect(wrapped.startOf('day').hour).toBe(0)
    expect(wrapped.endOf('month').day).toBe(30)
    expect(wrapped.setZone('UTC').zone).toBe('UTC')
    expect(wrapped.toMillis()).toBe(dt.toMillis())
    expect(wrapped.toJSDate()).toBeInstanceOf(Date)
    expect(
      wrapped
        .diff(DateTime.fromISO('2024-06-15T00:00:00.000Z', { zone: 'UTC' }), 'hours')
        .toObject().hours
    ).toBeCloseTo(14.5, 5)
    expect(unwrapDateTime(wrapped)?.toISO()).toBe(dt.toISO())
  })

  it('exposes the extended scalar getters', () => {
    const dt = DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' })
    const wrapped = toJsonataDateTime(dt)

    expect(wrapped.weekday).toBe(dt.weekday)
    expect(wrapped.quarter).toBe(2)
    expect(wrapped.ordinal).toBe(dt.ordinal)
    expect(wrapped.weekNumber).toBe(dt.weekNumber)
    expect(wrapped.daysInMonth).toBe(30)
    expect(wrapped.zoneName).toBe('UTC')
    expect(wrapped.zone).toBe('UTC')
    expect(wrapped.offset).toBe(0)
    expect(wrapped.isValid).toBe(true)
  })

  it('forwards the extended methods', () => {
    const dt = DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' })
    const wrapped = toJsonataDateTime(dt)

    expect(wrapped.toUnixInteger()).toBe(dt.toUnixInteger())
    expect(typeof wrapped.toISOTime()).toBe('string')
    expect(typeof wrapped.toRFC2822()).toBe('string')
    expect(typeof wrapped.toHTTP()).toBe('string')
    expect(wrapped.valueOf()).toBe(dt.valueOf())
    expect(wrapped.equals(DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' }))).toBe(true)
    expect(wrapped.hasSame(DateTime.fromISO('2024-06-15T00:00:00.000Z', { zone: 'UTC' }), 'day')).toBe(true)
    expect(wrapped.set({ hour: 0 }).hour).toBe(0)
  })

  it('JSON-serializes to an ISO string (backwards-compatible)', () => {
    const dt = DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' })
    const wrapped = toJsonataDateTime(dt)
    expect(JSON.parse(JSON.stringify(wrapped))).toBe(dt.toISO())
  })
})

describe('wrapDuration (via diff)', () => {
  const a = DateTime.fromISO('2024-06-15T14:30:00.000Z', { zone: 'UTC' })
  const b = DateTime.fromISO('2024-06-15T00:00:00.000Z', { zone: 'UTC' })
  const duration = toJsonataDateTime(a).diff(b)

  it('exposes object fields and toObject', () => {
    expect(typeof duration.toObject()).toBe('object')
  })

  it('forwards as/toMillis/shiftTo/toFormat', () => {
    expect(duration.as('hours')).toBeCloseTo(14.5, 5)
    expect(duration.toMillis()).toBeCloseTo(14.5 * 3600 * 1000, 0)
    expect(duration.shiftTo('minutes').toObject().minutes).toBeCloseTo(870, 0)
    expect(typeof duration.toFormat('hh:mm')).toBe('string')
  })

  it('JSON-serializes to an ISO duration string', () => {
    expect(typeof JSON.parse(JSON.stringify(duration))).toBe('string')
  })
})

describe('toJsonataUrl', () => {
  it('exposes URL fields and searchParams helpers', () => {
    const url = new URL('https://x.test/p?q=1&q=2#h')
    const wrapped = toJsonataUrl(url)

    expect(wrapped.pathname).toBe('/p')
    expect(wrapped.searchParams.get('q')).toBe('1')
    expect(wrapped.searchParams.has('q')).toBe(true)
    expect(wrapped.searchParams.getAll('q')).toEqual(['1', '2'])
    expect(unwrapUrl(wrapped)?.href).toBe(url.href)
  })

  it('exposes extended searchParams helpers', () => {
    const url = new URL('https://x.test/p?q=1&q=2&r=3')
    const wrapped = toJsonataUrl(url)

    expect(wrapped.searchParams.keys()).toEqual(['q', 'q', 'r'])
    expect(wrapped.searchParams.values()).toEqual(['1', '2', '3'])
    expect(wrapped.searchParams.entries()).toEqual([
      ['q', '1'],
      ['q', '2'],
      ['r', '3'],
    ])
    expect(wrapped.searchParams.size).toBe(3)
    expect(wrapped.searchParams.toString()).toBe('q=1&q=2&r=3')
  })

  it('toString and JSON serialization return href', () => {
    const url = new URL('https://x.test/p?q=1')
    const wrapped = toJsonataUrl(url)
    expect((wrapped as { toString(): string }).toString()).toBe(url.href)
    expect(JSON.parse(JSON.stringify(wrapped))).toBe(url.href)
  })
})
