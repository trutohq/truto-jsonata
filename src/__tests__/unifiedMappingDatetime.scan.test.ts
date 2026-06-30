import fs from 'node:fs'
import path from 'node:path'
import trutoJsonata from '../index'
import vendoredExpressions from './fixtures/datetime-mapping-expressions.json'
import { describe, expect, it } from 'vitest'

const TRUTO_MODELS = path.resolve(
  import.meta.dirname,
  '../../../truto/src/unified-model/models'
)

const COMPLETE_CHAIN =
  /\$dtFrom(?:Iso|Format)\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g

/** Errors that indicate JSONata 2.2 / wrapper breakage (not missing mapping context). */
const REGRESSION_ERROR =
  /Attempted to invoke a non-function|Cannot read properties of undefined \(reading '(?:toFormat|toUTC|toISO|plus|minus|startOf|endOf|diff|toMillis)'\)/

function collectExpressions(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const expressions = new Set<string>()
  for (const file of fs.readdirSync(dir)) {
    if (!/\.ya?ml$/.test(file)) continue
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    for (const match of text.matchAll(COMPLETE_CHAIN)) {
      const expr = match[0].trim()
      if (!expr.includes('`') && !expr.includes('\\') && expr.length < 160) {
        expressions.add(expr)
      }
    }
  }
  return [...expressions].sort()
}

const SAMPLE_DATE = '2024-01-15T12:00:00.000Z'
const SAMPLE_DATE_LOCAL = '2024-01-15 12:00:00'
const SAMPLE_DATE_US = '01/15/2024'

/** Broad fixture so most unified-model field names resolve during smoke evaluation. */
const FIXTURE: Record<string, unknown> = {
  date_created: SAMPLE_DATE,
  date_updated: SAMPLE_DATE,
  created_at: SAMPLE_DATE,
  updated_at: SAMPLE_DATE,
  createdon: SAMPLE_DATE,
  modifiedon: SAMPLE_DATE,
  lastlogindate: SAMPLE_DATE,
  sys_created_on: SAMPLE_DATE_LOCAL,
  sys_updated_on: SAMPLE_DATE_LOCAL,
  datecreated: SAMPLE_DATE_US,
  lastmodifieddate: SAMPLE_DATE_US,
  start_date: '2024-01-15',
  end_date: '2024-01-31',
  startDate: '2024-01-15',
  due_date: SAMPLE_DATE,
  dueDate: '2024-01-15',
  query: { created_at: { gt: SAMPLE_DATE, gte: SAMPLE_DATE, lt: SAMPLE_DATE, lte: SAMPLE_DATE } },
  response: { created_at: SAMPLE_DATE, modified_at: SAMPLE_DATE, date_created: SAMPLE_DATE },
  schedule: { start_time: '09:00:00', stop_time: '17:00:00' },
  attributes: { date: SAMPLE_DATE },
  $start_date: '2024-01-15',
  $dateStr: '2024-01-15',
  $wm: '2024-01-15',
  args: { start_date: '2024-01-15' },
  last_login: SAMPLE_DATE_LOCAL,
  add_time: SAMPLE_DATE_LOCAL,
  close_date: SAMPLE_DATE_US,
  absence_date: '2024-01-15',
  accessCreationDateTime: SAMPLE_DATE_LOCAL,
  activated_on: SAMPLE_DATE_LOCAL,
  created_on: SAMPLE_DATE_LOCAL,
  last_updated: SAMPLE_DATE_LOCAL,
  started_on: SAMPLE_DATE_LOCAL,
  profile: { last_seen_on: SAMPLE_DATE_LOCAL },
  personal: { birthDate: SAMPLE_DATE_US },
  internal: { terminationDate: SAMPLE_DATE_US },
  work: { activeEffectiveDate: SAMPLE_DATE_US },
  payload: { headers: [{ name: 'Date', value: 'Mon, 15 Jan 2024 12:00:00 +0000' }] },
}

const scanAvailable = fs.existsSync(TRUTO_MODELS)
const scannedExpressions = scanAvailable ? collectExpressions(TRUTO_MODELS) : []

describe('Vendored unified-mapping datetime snippets (always runs)', () => {
  it.each(vendoredExpressions)(
    'evaluates without JSONata 2.2 wrapper regression: %s',
    async expression => {
      const result = await trutoJsonata(expression).evaluate(FIXTURE)
      expect(result, expression).toBeDefined()
    }
  )
})

describe.skipIf(!scanAvailable)(
  'Unified model YAML datetime smoke scan (local truto checkout)',
  () => {
    it(`has no JSONata 2.2 method-invocation regressions in ${scannedExpressions.length} snippets`, async () => {
      const regressions: string[] = []
      let parseErrors = 0

      for (const expression of scannedExpressions) {
        try {
          await trutoJsonata(expression).evaluate(FIXTURE)
        } catch (error) {
          const message = (error as Error).message
          if (message.includes('Syntax error') || message.includes('Expected ')) {
            parseErrors++
            continue
          }
          if (REGRESSION_ERROR.test(message)) {
            regressions.push(`${expression}\n  → ${message}`)
          }
        }
      }

      expect(
        regressions,
        `${regressions.length} regressions (${parseErrors} snippets skipped as incomplete parse captures)`
      ).toEqual([])
    })
  }
)
