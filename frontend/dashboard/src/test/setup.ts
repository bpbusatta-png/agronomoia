import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sem `test.globals` no vite.config.ts, o auto-cleanup do testing-library
// (que depende de um `afterEach` global) nao dispara sozinho -- registrar
// aqui explicitamente para nao vazar DOM de um teste para o proximo.
afterEach(() => {
  cleanup()
})
