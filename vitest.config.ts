import { defineConfig } from 'vitest/config'
import { JSONATA_FILE, patchJsonata } from './scripts/jsonata20NumberText'

export default defineConfig({
  // Tests run the same patched jsonata the builds bundle.
  plugins: [
    {
      name: 'jsonata-2.0-number-text',
      transform(code, id) {
        return JSONATA_FILE.test(id.split('?')[0])
          ? patchJsonata(code)
          : undefined
      },
    },
  ],
  test: {
    setupFiles: ['./setupFetchMock.ts', './setupCrypto.ts'],
    server: { deps: { inline: ['jsonata'] } },
  },
})
