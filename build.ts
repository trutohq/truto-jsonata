const PRESETS = [
  'core',
  'datetime',
  'markdown',
  'html',
  'data-formats',
  'ai',
]
const presetEntrypoints = PRESETS.map(n => `src/presets/${n}.ts`)

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
})

await Bun.build({
  entrypoints: ['./src/index.ts', ...presetEntrypoints],
  outdir: './dist/esm',
  root: './src',
  format: 'esm',
  sourcemap: 'external',
  packages: 'external',
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
})

export {}
