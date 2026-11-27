import type { BunPlugin } from 'bun'
import pkg from './package.json'
import { JSONATA_FILE, patchJsonata } from './scripts/jsonata20NumberText'

const PRESETS = [
  'core',
  'datetime',
  'markdown',
  'html',
  'data-formats',
  'ai',
]
const presetEntrypoints = PRESETS.map(n => `src/presets/${n}.ts`)

// Every build bundles a patched jsonata (see scripts/jsonata20NumberText.ts).
const jsonata20NumberText: BunPlugin = {
  name: 'jsonata-2.0-number-text',
  setup(build) {
    build.onLoad({ filter: JSONATA_FILE }, async ({ path }) => ({
      contents: patchJsonata(await Bun.file(path).text()),
      loader: 'js',
    }))
  },
}

// CJS: intentionally no packages:'external' — lodash-es, p-map, etc. are
// ESM-only and have no CJS counterpart. Externalising them would cause
// ERR_REQUIRE_ESM on Node 18/20. Each preset .cjs file bundles its own
// transitive deps; CJS consumers needing multiple presets should prefer
// the full require('@truto/truto-jsonata') to avoid duplicating dep code.
await Bun.build({
  entrypoints: ['./src/index.ts', ...presetEntrypoints],
  outdir: './dist/cjs',
  root: './src',
  format: 'cjs',
  sourcemap: 'external',
  naming: '[dir]/[name].cjs',
  plugins: [jsonata20NumberText],
})

// ESM: every package stays external except jsonata, which is bundled so it
// carries the patch.
const external = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  .filter(name => name !== 'jsonata')
  .flatMap(name => [name, `${name}/*`])

await Bun.build({
  entrypoints: ['./src/index.ts', ...presetEntrypoints],
  outdir: './dist/esm',
  root: './src',
  format: 'esm',
  sourcemap: 'external',
  external,
  plugins: [jsonata20NumberText],
})

// Browser: bundles all deps inline (no packages:'external') so the output
// works in native ESM / CDN contexts without a bundler. Presets are included
// so @truto/truto-jsonata/presets/* resolves to self-contained browser
// artifacts via the 'browser' condition in package.json exports.
await Bun.build({
  entrypoints: ['./src/index.ts', ...presetEntrypoints],
  outdir: './dist/browser',
  root: './src',
  format: 'esm',
  target: 'browser',
  sourcemap: 'external',
  plugins: [jsonata20NumberText],
})

// Fail the build if any output still has jsonata 2.2's number text.
for (const file of [
  'dist/cjs/index.cjs',
  'dist/esm/index.js',
  'dist/browser/index.js',
]) {
  if ((await Bun.file(file).text()).includes('!Number.isInteger(val) ?')) {
    throw new Error(`${file} has unpatched jsonata number text`)
  }
}

export {}
