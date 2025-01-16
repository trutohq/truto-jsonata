import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./setupFetchMock.ts', './setupCrypto.ts'],
  },
})
