import { describe, expect, it, vi } from 'vitest'

type PromptCmd = {
  type: 'prompt'
  name: string
  description: string
  source: 'builtin' | 'skills' | 'plugin' | 'bundled' | 'mcp' | 'commands_DEPRECATED'
  loadedFrom?: string
  disableModelInvocation?: boolean
  hasUserSpecifiedDescription?: boolean
  whenToUse?: string
  aliases?: string[]
  progressMessage: string
  contentLength: number
  getPromptForCommand: any
}

function mkPrompt(name: string, source: PromptCmd['source']): PromptCmd {
  return {
    type: 'prompt',
    name,
    description: name,
    source,
    progressMessage: 'p',
    contentLength: 0,
    getPromptForCommand: async () => [],
  }
}

describe('getCommands dynamic skill insertion (src/commands.ts)', () => {
  it('dedupes dynamic skills by name and inserts them before built-ins', async () => {
    vi.resetModules()

    // Force command list construction to be deterministic and small.
    vi.doMock('../../src/skills/loadSkillsDir.js', () => ({
      getSkillDirCommands: async () => [],
      clearSkillCaches: () => {},
      // Two dynamic skills, one collides with existing base commands
      getDynamicSkills: () => [mkPrompt('dyn1', 'skills'), mkPrompt('base1', 'skills')],
    }))

    vi.doMock('../../src/skills/bundledSkills.js', () => ({
      getBundledSkills: () => [],
    }))

    vi.doMock('../../src/plugins/builtinPlugins.js', () => ({
      getBuiltinPluginSkillCommands: () => [],
    }))

    vi.doMock('../../src/utils/plugins/loadPluginCommands.js', () => ({
      getPluginCommands: async () => [],
      clearPluginCommandCache: () => {},
      getPluginSkills: async () => [],
      clearPluginSkillsCache: () => {},
    }))

    // Make COMMANDS() small by mocking the underlying command modules that are
    // included in the COMMANDS() memoize list. We only need a couple, but
    // easiest is to make getCommands() not load a ton of real command deps.
    // Instead, we mock getCommands' inputs by mocking loadAllCommands via its
    // dependencies above, and by mocking isCommandEnabled to always true.
    vi.doMock('../../src/types/command.js', async (orig) => {
      const actual = await (orig as any)()
      return {
        ...actual,
        isCommandEnabled: () => true,
        getCommandName: (c: any) => c.name,
      }
    })

    // Stub auth/provider checks used by meetsAvailabilityRequirement to not filter.
    vi.doMock('../../src/utils/auth.js', () => ({
      isUsing3PServices: () => false,
      isClaudeAISubscriber: () => false,
      hasAnthropicApiKeyAuth: () => false,
    }))
    vi.doMock('../../src/utils/model/providers.js', () => ({
      isFirstPartyAnthropicBaseUrl: () => true,
    }))

    const mod = await import('../../src/commands.js')

    // Build a base command list through the real module: we can’t directly set
    // COMMANDS(), but we can ensure loadAllCommands returns *some* builtins by
    // using the module’s own COMMANDS() plus our empty external sources.
    const cmds = await mod.getCommands(process.cwd())

    const names = cmds.map((c: any) => c.name)
    expect(names).toContain('dyn1')

    // Dynamic skills should not be duplicated by the insertion logic.
    expect(names.filter(n => n === 'dyn1')).toHaveLength(1)
    // base1 is the “collision” candidate in this test; even if it exists in
    // base commands, the dynamic version should not introduce another copy.
    expect(names.filter(n => n === 'base1').length).toBeLessThanOrEqual(1)

    // Insertion rule: dynamic skills appear before the first built-in command.
    // Derive the built-in boundary using builtInCommandNames helper.
    const builtInNames: Set<string> = mod.builtInCommandNames()
    const firstBuiltInIdx = cmds.findIndex((c: any) => builtInNames.has(c.name))
    const dynIdx = cmds.findIndex((c: any) => c.name === 'dyn1')

    expect(firstBuiltInIdx).toBeGreaterThanOrEqual(0)
    expect(dynIdx).toBeGreaterThanOrEqual(0)
    expect(dynIdx).toBeLessThan(firstBuiltInIdx)
  })
})

