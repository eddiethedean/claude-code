import { describe, expect, it, vi } from 'vitest'

function withFreshContextModule() {
  vi.resetModules()
  return import('../../src/context.js')
}

describe('context contracts (src/context.ts)', () => {
  it('getUserContext always includes currentDate and can skip CLAUDE.md discovery', async () => {
    const prevEnv = process.env
    process.env = { ...prevEnv, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' }
    try {
      vi.doMock('../../src/utils/claudemd.js', () => ({
        filterInjectedMemoryFiles: (x: any) => x,
        getClaudeMds: () => {
          throw new Error('should not be called when CLAUDE_CODE_DISABLE_CLAUDE_MDS=1')
        },
        getMemoryFiles: async () => {
          throw new Error('should not be called when CLAUDE_CODE_DISABLE_CLAUDE_MDS=1')
        },
      }))
      const mod = await withFreshContextModule()
      mod.getUserContext.cache?.clear?.()
      const ctx = await mod.getUserContext()
      expect(ctx.currentDate).toMatch(/^Today's date is /)
      expect(ctx).not.toHaveProperty('claudeMd')
    } finally {
      process.env = prevEnv
    }
  })

  it('getUserContext includes claudeMd when enabled', async () => {
    const prevEnv = process.env
    process.env = { ...prevEnv }
    delete process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS
    try {
      vi.doMock('../../src/utils/claudemd.js', () => ({
        filterInjectedMemoryFiles: (x: any) => x,
        getClaudeMds: () => 'CLAUDEMD_CONTENT',
        getMemoryFiles: async () => [],
      }))
      const mod = await withFreshContextModule()
      mod.getUserContext.cache?.clear?.()
      const ctx = await mod.getUserContext()
      expect(ctx.claudeMd).toBe('CLAUDEMD_CONTENT')
      expect(ctx.currentDate).toMatch(/^Today's date is /)
    } finally {
      process.env = prevEnv
    }
  })

  it('getSystemContext skips gitStatus when CLAUDE_CODE_REMOTE is true', async () => {
    const prevEnv = process.env
    process.env = { ...prevEnv, CLAUDE_CODE_REMOTE: 'true' }
    try {
      vi.doMock('../../src/utils/git.js', () => ({
        getIsGit: async () => {
          throw new Error('git should not be queried in remote mode')
        },
        getBranch: async () => 'main',
        getDefaultBranch: async () => 'main',
        gitExe: () => 'git',
      }))
      vi.doMock('../../src/utils/gitSettings.js', () => ({
        shouldIncludeGitInstructions: () => true,
      }))
      const mod = await withFreshContextModule()
      mod.getSystemContext.cache?.clear?.()
      const ctx = await mod.getSystemContext()
      expect(ctx).not.toHaveProperty('gitStatus')
    } finally {
      process.env = prevEnv
    }
  })

  it('getSystemContext includes gitStatus when enabled and git repo detected', async () => {
    const prevEnv = process.env
    process.env = { ...prevEnv, NODE_ENV: 'not-test' }
    delete process.env.CLAUDE_CODE_REMOTE
    try {
      vi.doMock('../../src/utils/gitSettings.js', () => ({
        shouldIncludeGitInstructions: () => true,
      }))
      vi.doMock('../../src/utils/git.js', () => ({
        getIsGit: async () => true,
        getBranch: async () => 'feat',
        getDefaultBranch: async () => 'main',
        gitExe: () => 'git',
      }))
      vi.doMock('../../src/utils/execFileNoThrow.js', () => ({
        execFileNoThrow: async (_exe: string, args: string[]) => {
          const key = args.join(' ')
          if (key.includes('status --short')) return { stdout: ' M README.md\n' }
          if (key.includes('log --oneline')) return { stdout: 'abc123 msg\n' }
          if (key.includes('config user.name')) return { stdout: 'Tester\n' }
          return { stdout: '' }
        },
      }))

      const mod = await withFreshContextModule()
      mod.getSystemContext.cache?.clear?.()
      const ctx = await mod.getSystemContext()
      expect(ctx).toHaveProperty('gitStatus')
      expect(ctx.gitStatus).toContain('Current branch: feat')
      expect(ctx.gitStatus).toContain('Main branch (you will usually use this for PRs): main')
    } finally {
      process.env = prevEnv
    }
  })
})

