import { describe, expect, it, vi } from 'vitest'

describe('CLI golden: --bg', () => {
  it('dispatches to bg handler fast-path and does not load full CLI', async () => {
    const origArgv = process.argv
    const bgCalls: any[] = []
    const mainImport: any[] = []

    try {
      vi.resetModules()
      vi.doMock('bun:bundle', () => ({
        feature: (name: string) => name === 'BG_SESSIONS',
      }))
      vi.doMock('../../src/utils/startupProfiler.ts', () => ({
        profileCheckpoint: () => {},
      }))
      vi.doMock('../../src/utils/config.ts', () => ({
        enableConfigs: () => {},
      }))
      vi.doMock('../../src/cli/bg.js', () => ({
        handleBgFlag: async (args: string[]) => {
          bgCalls.push(args)
        },
      }))
      // If full CLI is loaded, we'll know.
      vi.doMock('../../src/main.ts', () => ({
        main: async () => {
          mainImport.push('loaded')
        },
      }))

      process.argv = ['node', 'cli.tsx', 'anything', '--bg']
      await import('../../src/entrypoints/cli.tsx')
      await new Promise<void>(r => setTimeout(r, 0))

      expect(bgCalls).toEqual([['anything', '--bg']])
      expect(mainImport).toEqual([])
    } finally {
      process.argv = origArgv
    }
  })
})

