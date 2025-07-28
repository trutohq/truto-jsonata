await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist/cjs',
  format: 'cjs',
  sourcemap: "external",
})

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist/esm',
  format: 'esm',
  sourcemap: "external",
  "packages": "external"
})

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist/browser',
  format: 'esm',
  target: 'browser',
  sourcemap: "external",
})

export {}