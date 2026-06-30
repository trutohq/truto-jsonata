import fs from 'node:fs'
import path from 'node:path'
import trutoJsonata from '../index'
import vendoredExpressions from './fixtures/parseUrl-mapping-expressions.json'
import { describe, expect, it } from 'vitest'

const TRUTO_MODELS = path.resolve(
  import.meta.dirname,
  '../../../truto/src/unified-model/models'
)

const PARSE_URL_CHAIN =
  /\$parseUrl\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g

const REGRESSION_ERROR = /Attempted to invoke a non-function/

function collectExpressions(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const expressions = new Set<string>()
  for (const file of fs.readdirSync(dir)) {
    if (!/\.ya?ml$/.test(file)) continue
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    for (const match of text.matchAll(PARSE_URL_CHAIN)) {
      const expr = match[0].trim()
      if (!expr.includes('`') && expr.length < 200) {
        expressions.add(expr)
      }
    }
  }
  return [...expressions].sort()
}

const FIXTURE = {
  url: 'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf&token=abc',
  file_url:
    'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf&token=abc',
  rawQuery: {
    file_url:
      'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf',
  },
  query: {
    file_url: 'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf',
  },
}

const scanAvailable = fs.existsSync(TRUTO_MODELS)
const expressions = scanAvailable ? collectExpressions(TRUTO_MODELS) : []

describe('Vendored unified-mapping parseUrl snippets (always runs)', () => {
  it.each(vendoredExpressions)(
    'evaluates without JSONata 2.2 wrapper regression: %s',
    async expression => {
      const result = await trutoJsonata(expression).evaluate(FIXTURE)
      expect(result, expression).toBeDefined()
    }
  )
})

describe.skipIf(!scanAvailable)(
  'Unified model YAML parseUrl smoke scan (local truto checkout)',
  () => {
    it(`has no parseUrl method-invocation regressions in ${expressions.length} snippets`, async () => {
      const regressions: string[] = []
      for (const expression of expressions) {
        try {
          await trutoJsonata(expression).evaluate(FIXTURE)
        } catch (error) {
          const message = (error as Error).message
          if (
            message.includes('Syntax error') ||
            message.includes('Expected ')
          ) {
            continue
          }
          if (REGRESSION_ERROR.test(message)) {
            regressions.push(`${expression}\n  → ${message}`)
          }
        }
      }
      expect(regressions, regressions.join('\n\n')).toEqual([])
    })
  }
)
