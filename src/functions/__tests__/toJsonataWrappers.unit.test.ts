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
    const dt = DateTime.fromISO('2024-06-15T14:30:00.000Z')
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
        .diff(DateTime.fromISO('2024-06-15T00:00:00.000Z'), 'hours')
        .toObject().hours
    ).toBeCloseTo(14.5, 5)
    expect(unwrapDateTime(wrapped)?.toISO()).toBe(dt.toISO())
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
})
