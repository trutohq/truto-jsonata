import jsonata from 'jsonata'
import { describe, expect, it } from 'vitest'
import { registerAiExtensions } from '../ai'
import { registerCoreExtensions } from '../core'
import { registerDataFormatsExtensions } from '../data-formats'
import { registerDatetimeExtensions } from '../datetime'
import { registerHtmlExtensions } from '../html'
import { registerMarkdownExtensions } from '../markdown'

describe('registerCoreExtensions', () => {
  it('groupBy groups an array by key', async () => {
    const expr = registerCoreExtensions(
      jsonata('$groupBy(items, "type")')
    )
    const result = await expr.evaluate({
      items: [
        { type: 'a', v: 1 },
        { type: 'b', v: 2 },
        { type: 'a', v: 3 },
      ],
    })
    expect(result).toEqual({ a: [{ type: 'a', v: 1 }, { type: 'a', v: 3 }], b: [{ type: 'b', v: 2 }] })
  })

  it('jsonParse parses a JSON string', async () => {
    const expr = registerCoreExtensions(jsonata('$jsonParse(s)'))
    const result = await expr.evaluate({ s: '{"x":1}' })
    expect(result).toEqual({ x: 1 })
  })

  it('compact removes falsy values', async () => {
    const expr = registerCoreExtensions(jsonata('$compact(arr)'))
    const result = await expr.evaluate({ arr: [0, 1, null, 2, false, 3] })
    expect(result).toEqual([1, 2, 3])
  })

  it('wrap wraps value with a delimiter', async () => {
    const expr = registerCoreExtensions(jsonata('$wrap(v, "`")'))
    const result = await expr.evaluate({ v: 'hello' })
    expect(result).toBe('`hello`')
  })

  it('orderBy sorts an array', async () => {
    const expr = registerCoreExtensions(jsonata('$orderBy(arr, "n", "desc")'))
    const result = await expr.evaluate({ arr: [{ n: 1 }, { n: 3 }, { n: 2 }] })
    expect(result).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }])
  })

  it('flattenDepth flattens to a given depth', async () => {
    const expr = registerCoreExtensions(jsonata('$flattenDepth(arr, 1)'))
    const result = await expr.evaluate({ arr: [[1, [2]], [3]] })
    expect(result).toEqual([1, [2], 3])
  })
})

describe('registerDatetimeExtensions', () => {
  it('dtFromIso parses an ISO string', async () => {
    const expr = registerDatetimeExtensions(
      jsonata('$dtFromIso("2024-01-15T00:00:00.000Z", "UTC").year')
    )
    const result = await expr.evaluate({})
    expect(result).toBe(2024)
  })

  it('does not register convertQueryToSql (moved to data-formats)', async () => {
    const expr = registerDatetimeExtensions(jsonata('$convertQueryToSql({})'))
    // JSONata throws when calling an unregistered function name
    await expect(expr.evaluate({})).rejects.toThrow('non-function')
  })
})

describe('registerDataFormatsExtensions', () => {
  it('convertQueryToSql is registered here, not in datetime', async () => {
    const expr = registerDataFormatsExtensions(
      jsonata('$convertQueryToSql({"field": "status", "operator": "eq", "value": "open"})')
    )
    const result = await expr.evaluate({})
    expect(typeof result).toBe('string')
    expect(result).toContain('status')
  })

  it('xmlToJs parses XML', async () => {
    const expr = registerDataFormatsExtensions(jsonata('$xmlToJs(x)'))
    const result = await expr.evaluate({ x: '<root><a>1</a></root>' }) as any
    expect(result).toBeDefined()
    expect(result.root).toBeDefined()
  })

  it('jsonToCsv converts array to CSV string', async () => {
    const expr = registerDataFormatsExtensions(jsonata('$jsonToCsv(rows)'))
    const result = await expr.evaluate({
      rows: [{ name: 'Alice', age: 30 }],
    })
    expect(typeof result).toBe('string')
    expect(result).toContain('Alice')
  })
})

describe('registerMarkdownExtensions', () => {
  it('convertMarkdownToHtml converts markdown heading', async () => {
    const expr = registerMarkdownExtensions(jsonata('$convertMarkdownToHtml(md)'))
    const result = await expr.evaluate({ md: '# Hello' }) as string
    expect(result).toContain('<h1')
    expect(result).toContain('Hello')
  })
})

describe('registerHtmlExtensions', () => {
  it('convertHtmlToMarkdown converts an H1 tag', async () => {
    const expr = registerHtmlExtensions(jsonata('$convertHtmlToMarkdown(h)'))
    const result = await expr.evaluate({ h: '<h1>Hello</h1>' }) as string
    expect(result.trim()).toContain('Hello')
  })
})

describe('registerAiExtensions', () => {
  it('recursiveCharacterTextSplitter splits text into chunks', async () => {
    const expr = registerAiExtensions(
      jsonata('$recursiveCharacterTextSplitter(text, 20, 0)')
    )
    const result = await expr.evaluate({ text: 'Hello world. This is a test.' }) as string[]
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})
