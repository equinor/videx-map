import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['canvas.setup.js'],
    // Jest-like globals
    globals: true,
    // Environment
    environment: 'jsdom',
  },
})