import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // The leaked source references React compiler runtime, which isn't
      // published as an export in stable React packages. Tests don't need it.
      'react/compiler-runtime': new URL('./test/stubs/react-compiler-runtime.ts', import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})

