import { describe, expect, it, vi } from 'vitest'

describe('commands additional contracts (src/commands.ts)', () => {
  it('formatDescriptionWithSource annotates prompt commands by source', async () => {
    vi.resetModules()
    // Avoid auth/key requirements during module init (e.g. /login command).
    vi.doMock('../../src/utils/auth.js', () => ({
      isUsing3PServices: () => false,
      isClaudeAISubscriber: () => false,
      hasAnthropicApiKeyAuth: () => false,
      getClaudeAIOAuthTokens: () => null,
      isOverageProvisioningAllowed: () => false,
      isConsumerSubscriber: () => false,
    }))
    const { formatDescriptionWithSource } = await import('../../src/commands.js')

    expect(
      formatDescriptionWithSource({
        type: 'prompt',
        kind: 'workflow',
        description: 'Do thing',
        name: 'x',
        progressMessage: 'p',
        contentLength: 0,
        source: 'bundled',
        getPromptForCommand: async () => [],
      } as any),
    ).toBe('Do thing (workflow)')

    expect(
      formatDescriptionWithSource({
        type: 'prompt',
        description: 'Skill',
        name: 'x',
        progressMessage: 'p',
        contentLength: 0,
        source: 'plugin',
        pluginInfo: { pluginManifest: { name: 'myPlugin' } },
        getPromptForCommand: async () => [],
      } as any),
    ).toBe('(myPlugin) Skill')

    expect(
      formatDescriptionWithSource({
        type: 'prompt',
        description: 'Bundled',
        name: 'x',
        progressMessage: 'p',
        contentLength: 0,
        source: 'bundled',
        getPromptForCommand: async () => [],
      } as any),
    ).toBe('Bundled (bundled)')
  })

  it('clearCommandsCache causes expensive loaders to run again', async () => {
    const pluginCommandsCalls = { n: 0 }

    vi.resetModules()
    vi.doMock('../../src/utils/auth.js', () => ({
      isUsing3PServices: () => false,
      isClaudeAISubscriber: () => false,
      hasAnthropicApiKeyAuth: () => false,
      getClaudeAIOAuthTokens: () => null,
      isOverageProvisioningAllowed: () => false,
      isConsumerSubscriber: () => false,
    }))
    vi.doMock('../../src/utils/plugins/loadPluginCommands.js', () => ({
      getPluginCommands: async () => {
        pluginCommandsCalls.n++
        return []
      },
      clearPluginCommandCache: () => {},
      getPluginSkills: async () => [],
      clearPluginSkillsCache: () => {},
    }))
    vi.doMock('../../src/skills/loadSkillsDir.js', () => ({
      getSkillDirCommands: async () => [],
      clearSkillCaches: () => {},
      getDynamicSkills: () => [],
    }))
    vi.doMock('../../src/skills/bundledSkills.js', () => ({
      getBundledSkills: () => [],
    }))
    vi.doMock('../../src/plugins/builtinPlugins.js', () => ({
      getBuiltinPluginSkillCommands: () => [],
    }))

    const mod = await import('../../src/commands.js')

    await mod.getCommands(process.cwd())
    await mod.getCommands(process.cwd())
    expect(pluginCommandsCalls.n).toBe(1)

    mod.clearCommandsCache()
    await mod.getCommands(process.cwd())
    expect(pluginCommandsCalls.n).toBe(2)
  })

  it('getSkillToolCommands and getSlashCommandToolSkills enforce core invariants', async () => {
    vi.resetModules()
    vi.doMock('../../src/utils/auth.js', () => ({
      isUsing3PServices: () => false,
      isClaudeAISubscriber: () => false,
      hasAnthropicApiKeyAuth: () => false,
      getClaudeAIOAuthTokens: () => null,
      isOverageProvisioningAllowed: () => false,
      isConsumerSubscriber: () => false,
    }))
    const mod = await import('../../src/commands.js')

    const skillToolCmds = await mod.getSkillToolCommands(process.cwd())
    for (const c of skillToolCmds as any[]) {
      expect(c.type).toBe('prompt')
      expect(c.disableModelInvocation).not.toBe(true)
      expect(c.source).not.toBe('builtin')
    }

    const slashSkillCmds = await mod.getSlashCommandToolSkills(process.cwd())
    for (const c of slashSkillCmds as any[]) {
      expect(c.type).toBe('prompt')
      expect(c.source).not.toBe('builtin')
      expect(Boolean(c.hasUserSpecifiedDescription || c.whenToUse)).toBe(true)
    }
  })
})

