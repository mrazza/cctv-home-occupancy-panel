import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      },
      exclude: [
        '.nuxt/**',
        'dist/**',
        'node_modules/**',
        'tests/**',
        'vitest.config.ts',
        'nuxt.config.ts'
      ]
    }
  }
})
