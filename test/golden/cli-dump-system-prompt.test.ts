import { describe, expect, it, vi } from 'vitest'

describe('CLI golden: --dump-system-prompt', () => {
  it('prints rendered system prompt and exits early', async () => {
    const origArgv = process.argv
    const calls: Array<{ model: string }> = []
    const mainImport: any[] = []

    try {
      vi.resetModules()
      vi.doMock('bun:bundle', () => ({
        feature: (name: string) => name === 'DUMP_SYSTEM_PROMPT',
      }))
      vi.doMock('../../src/utils/startupProfiler.ts', () => ({
        profileCheckpoint: () => {},
      }))
      vi.doMock('../../src/utils/config.ts', () => ({
        enableConfigs: () => {},
      }))
      vi.doMock('../../src/utils/model/model.ts', () => ({
        getMainLoopModel: () => 'default-model',
      }))
      vi.doMock('../../src/constants/prompts.ts', () => ({
        getSystemPrompt: async (_parts: any[], model: string) => {
          calls.push({ model })
          return [`model=${model}`, 'PROMPT_LINE_1', 'PROMPT_LINE_2']
        },
      }))
      vi.doMock('../../src/main.ts', () => ({
        main: async () => {
          mainImport.push('loaded')
        },
      }))

      process.argv = ['node', 'cli.tsx', '--dump-system-prompt', '--model', 'm1']
      await import('../../src/entrypoints/cli.tsx')
      await new Promise<void>(r => setTimeout(r, 0))

      expect(calls).toEqual([{ model: 'm1' }])
      expect(mainImport).toEqual([])
    } finally {
      process.argv = origArgv
    }
  })
})

