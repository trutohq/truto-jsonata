/**
 * Extract complete JSONata chains for wrapper-returning functions from unified-model YAML.
 * Run: bun run scripts/extractWrapperMappingSnippets.ts [modelsDir]
 */
import fs from 'node:fs'
import path from 'node:path'
import trutoJsonata from '../src/index'

const DEFAULT_MODELS = path.resolve(
  import.meta.dirname,
  '../../../truto/src/unified-model/models'
)

const OUT_DIR = path.resolve(
  import.meta.dirname,
  '../src/__tests__/fixtures'
)

const CHAINS = {
  datetime:
    /\$dtFrom(?:Iso|Format)\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g,
  parseUrl: /\$parseUrl\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g,
  blob: /\$blob\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g,
  base64ToBlob:
    /\$base64ToBlob\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g,
  dependencyGraph:
    /\$dependencyGraph\([^`;\n]+?\)(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g,
  blobConsumers: /\$get(?:ArrayBuffer|DataUri)\([^`;\n]{0,200}\)/g,
} as const

const REGRESSION_ERROR =
  /Attempted to invoke a non-function|Cannot read properties of undefined \(reading '(?:toFormat|toUTC|toISO|plus|minus|startOf|endOf|diff|toMillis|origin|pathname|searchParams|type|size|byteLength)'\)/

const DATETIME_FIXTURE: Record<string, unknown> = {
  date_created: '2024-01-15T12:00:00.000Z',
  date_updated: '2024-01-15T12:00:00.000Z',
  created_at: '2024-01-15T12:00:00.000Z',
  updated_at: '2024-01-15T12:00:00.000Z',
  createdon: '2024-01-15T12:00:00.000Z',
  modifiedon: '2024-01-15T12:00:00.000Z',
  lastlogindate: '2024-01-15T12:00:00.000Z',
  sys_created_on: '2024-01-15 12:00:00',
  sys_updated_on: '2024-01-15 12:00:00',
  datecreated: '01/15/2024',
  lastmodifieddate: '01/15/2024',
  start_date: '2024-01-15',
  end_date: '2024-01-31',
  due_date: '2024-01-15T12:00:00.000Z',
  query: {
    created_at: {
      gt: '2024-01-15T00:00:00.000Z',
      gte: '2024-01-15T00:00:00.000Z',
      lt: '2024-01-15T23:59:59.000Z',
      lte: '2024-01-15T23:59:59.000Z',
    },
    start_date: '2024-01-15',
    end_date: '2024-01-31',
    file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
  },
  rawQuery: {
    created_at: { gt: '2024-01-15T00:00:00.000Z', gte: '2024-01-15T00:00:00.000Z' },
    updated_at: {
      gte: '2024-01-15T00:00:00.000Z',
      lt: '2024-01-15T23:59:59.000Z',
      lte: '2024-01-15T23:59:59.000Z',
    },
    file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
  },
  response: {
    created_at: '2024-01-15T12:00:00.000Z',
    modified_at: '2024-01-15T12:00:00.000Z',
    date_created: '2024-01-15T12:00:00.000Z',
    data: 'SGVsbG8=',
  },
  profile: { last_seen_on: '2024-01-15 12:00:00' },
  personal: { birthDate: '01/15/2024' },
  schedule: { stop_time: '17:00:00' },
  last_login: '2024-01-15 12:00:00',
  created_on: '2024-01-15 12:00:00',
  last_updated: '2024-01-15 12:00:00',
  started_on: '2024-01-15 12:00:00',
  accessCreationDateTime: '2024-01-15 12:00:00',
  startDate: '2024-01-15',
  url: 'https://api.example.com/v1/record/99',
  file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
  body: { file: 'aGVsbG8=' },
}

function collect(dir: string, re: RegExp): string[] {
  const expressions = new Set<string>()
  for (const file of fs.readdirSync(dir)) {
    if (!/\.ya?ml$/.test(file)) continue
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    for (const match of text.matchAll(re)) {
      const expr = match[0].trim()
      if (!expr.includes('`') && !expr.includes('\\') && expr.length < 200) {
        expressions.add(expr)
      }
    }
  }
  return [...expressions].sort()
}

function chainKey(expr: string): string {
  return [...expr.matchAll(/\.([a-zA-Z_][\w]*)/g)]
    .map(m => m[1])
    .join('.')
}

function pickDiverse(expressions: string[], max: number): string[] {
  const byKey = new Map<string, string>()
  for (const expr of expressions) {
    const key = chainKey(expr)
    if (!byKey.has(key)) byKey.set(key, expr)
  }
  const diverse = [...byKey.values()].sort((a, b) => a.length - b.length)
  return diverse.slice(0, max)
}

async function smokeFilter(
  expressions: string[],
  fixture: Record<string, unknown>
): Promise<string[]> {
  const ok: string[] = []
  for (const expression of expressions) {
    try {
      trutoJsonata(expression)
    } catch {
      continue
    }
    try {
      await trutoJsonata(expression).evaluate(fixture)
      ok.push(expression)
    } catch (error) {
      const message = (error as Error).message
      if (REGRESSION_ERROR.test(message)) continue
      if (
        message.includes('Syntax error') ||
        message.includes('Expected ')
      ) {
        continue
      }
      ok.push(expression)
    }
  }
  return ok
}

const CURATED_DATETIME = [
  "$dtFromIso(created_at).toUTC().toISO()",
  "$dtFromFormat(sys_created_on, 'yyyy-MM-dd HH:mm:ss').toISO()",
  "$dtFromFormat('2024-01-15', 'yyyy-MM-dd').endOf('month').toFormat('yyyy-MM-dd')",
  "$dtFromFormat('12:30:00', 'hh:mm:ss').diff($dtFromIso('2024-01-15T00:00:00.000Z').startOf('day'), ['minutes']).toObject().minutes",
  "$dtFromIso(created_at).weekday",
  "$dtFromIso(created_at).zoneName",
  "$dtFromIso(created_at).toUnixInteger()",
]

const CURATED_PARSE_URL = [
  "$parseUrl(url).origin",
  "$parseUrl(url).pathname",
  "$parseUrl(rawQuery.file_url).searchParams.get('mime_type')",
  "$parseUrl(url).origin & $parseUrl(url).pathname",
]

const CURATED_INSTANCE = [
  "$blob('hello', {'type': 'text/plain'}).type",
  "$base64ToBlob('SGVsbG8=').size",
  "$dependencyGraph([{'id':'b','parent_id':'a'},{'id':'a'}], 'parent_id', 'id').overallOrder()",
  "$jsonToParquet([{'id': 1}]).byteLength",
  "($b := $blob('a', {'type': 'text/plain'}); $getArrayBuffer($b))",
  "($b := $blob('a', {'type': 'text/plain'}); $substring($getDataUri($b, 'text/plain'), 0, 5))",
]

async function main() {
  const modelsDir = process.argv[2] ?? DEFAULT_MODELS
  if (!fs.existsSync(modelsDir)) {
    console.error(`Models dir not found: ${modelsDir}`)
    process.exit(1)
  }

  const datetimeRaw = collect(modelsDir, CHAINS.datetime)
  const parseUrlRaw = collect(modelsDir, CHAINS.parseUrl)
  const instanceRaw = [
    ...collect(modelsDir, CHAINS.blob),
    ...collect(modelsDir, CHAINS.base64ToBlob),
    ...collect(modelsDir, CHAINS.dependencyGraph),
    ...collect(modelsDir, CHAINS.blobConsumers),
  ]

  console.log('Raw counts:', {
    datetime: datetimeRaw.length,
    parseUrl: parseUrlRaw.length,
    instance: instanceRaw.length,
  })

  const datetimeOk = await smokeFilter(datetimeRaw, DATETIME_FIXTURE)
  const parseUrlOk = await smokeFilter(parseUrlRaw, DATETIME_FIXTURE)
  const instanceOk = await smokeFilter(instanceRaw, DATETIME_FIXTURE)

  const datetime = [
    ...new Set([
      ...pickDiverse(datetimeOk, 35),
      ...CURATED_DATETIME,
    ]),
  ].sort()

  const parseUrl = [
    ...new Set([...pickDiverse(parseUrlOk, 12), ...CURATED_PARSE_URL]),
  ].sort()

  const instanceReturns = [
    ...new Set([...instanceOk, ...CURATED_INSTANCE]),
  ].sort()

  fs.writeFileSync(
    path.join(OUT_DIR, 'datetime-mapping-expressions.json'),
    JSON.stringify(datetime, null, 2) + '\n'
  )
  fs.writeFileSync(
    path.join(OUT_DIR, 'parseUrl-mapping-expressions.json'),
    JSON.stringify(parseUrl, null, 2) + '\n'
  )
  fs.writeFileSync(
    path.join(OUT_DIR, 'instance-return-mapping-expressions.json'),
    JSON.stringify(instanceReturns, null, 2) + '\n'
  )

  console.log(
    `Wrote ${datetime.length} datetime (${datetimeOk.length} from YAML), ${parseUrl.length} parseUrl (${parseUrlOk.length} from YAML), ${instanceReturns.length} instance-return (${instanceOk.length} from YAML)`
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
