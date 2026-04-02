import { describe, expect, it, vi } from 'vitest'

describe('CLI golden: --version', () => {
  it('prints version fast-path', async () => {
    const origArgv = process.argv
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      // @ts-expect-error - MACRO is a build-time global in upstream builds
      globalThis.MACRO = { VERSION: '0.0.0-test' }
      process.argv = ['node', 'cli.tsx', '--version']

      // Ensure the module runs fresh with our argv/MACRO.
      vi.resetModules()
      await import('../../src/entrypoints/cli.tsx')

      expect(log.mock.calls.map(c => c.join(' '))).toEqual([
        '0.0.0-test (Claude Code)',
      ])
    } finally {
      log.mockRestore()
      process.argv = origArgv
    }
  })
})

