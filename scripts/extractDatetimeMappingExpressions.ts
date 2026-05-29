/**
 * Scans Truto unified-model YAML/JSON for $dtFromIso / $dtFromFormat snippets.
 * Run from repo root: bun run scripts/extractDatetimeMappingExpressions.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const TRUTO_ROOT = path.resolve(import.meta.dirname, '../../../truto/truto')
const OUT = path.resolve(
  import.meta.dirname,
  '../src/__tests__/fixtures/unified-mapping-datetime-snippets.raw.json'
)

const SOURCE_DIRS = [
  path.join(TRUTO_ROOT, 'src/unified-model/models'),
  path.join(TRUTO_ROOT, 'src/sync-job'),
]

const SNIPPET_RE =
  /\$dtFrom(?:Iso|Format)\([^;\n]{0,400}?(?:\.[a-zA-Z_][\w]*(?:\([^)]*\))?)+/g

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(ya?ml|json)$/.test(entry.name)) files.push(full)
  }
  return files
}

function extractFromFile(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8')
  const matches = text.match(SNIPPET_RE) ?? []
  return matches.map((m) => m.trim())
}

function main() {
  const seen = new Set<string>()
  const snippets: { source: string; expression: string }[] = []

  for (const dir of SOURCE_DIRS) {
    for (const file of walk(dir)) {
      const rel = path.relative(TRUTO_ROOT, file)
      for (const expression of extractFromFile(file)) {
        const key = expression.replace(/\s+/g, ' ')
        if (seen.has(key)) continue
        seen.add(key)
        snippets.push({ source: rel, expression })
      }
    }
  }

  snippets.sort((a, b) => a.expression.localeCompare(b.expression))
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(snippets, null, 2) + '\n')
  console.log(
    `Wrote ${snippets.length} raw snippets to ${OUT} (review; curated cases live in datetime-mapping-cases.json)`
  )
}

main()
