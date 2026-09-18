/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MapLibre's worker is an ES module that imports a shared chunk.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
