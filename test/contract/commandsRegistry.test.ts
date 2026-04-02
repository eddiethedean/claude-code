import { describe, expect, it, vi } from 'vitest'

type Cmd = {
  type: 'local' | 'local-jsx' | 'prompt'
  name: string
  description: string
  aliases?: string[]
  availability?: Array<'claude-ai' | 'console'>
}

async function importCommandsWithAuth({
  isClaudeAISubscriber,
  isUsing3PServices,
  isFirstPartyAnthropicBaseUrl,
}: {
  isClaudeAISubscriber: boolean
  isUsing3PServices: boolean
  isFirstPartyAnthropicBaseUrl: boolean
}) {
  vi.resetModules()
  vi.doMock('../../src/utils/auth.js', () => ({
    isUsing3PServices: () => isUsing3PServices,
    isClaudeAISubscriber: () => isClaudeAISubscriber,
  }))
  vi.doMock('../../src/utils/model/providers.js', () => ({
    isFirstPartyAnthropicBaseUrl: () => isFirstPartyAnthropicBaseUrl,
  }))
  return await import('../../src/commands.js')
}

describe('commands registry contracts (src/commands.ts)', () => {
  describe('meetsAvailabilityRequirement', () => {
    it('allows commands with no availability', async () => {
      const mod = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: true,
        isFirstPartyAnthropicBaseUrl: false,
      })

      const cmd: Cmd = {
        type: 'local',
        name: 'x',
        description: 'x',
      }
      expect(mod.meetsAvailabilityRequirement(cmd as any)).toBe(true)
    })

    it('claude-ai availability requires subscriber', async () => {
      const cmd: Cmd = {
        type: 'local',
        name: 'x',
        description: 'x',
        availability: ['claude-ai'],
      }

      const modNo = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })
      expect(modNo.meetsAvailabilityRequirement(cmd as any)).toBe(false)

      const modYes = await importCommandsWithAuth({
        isClaudeAISubscriber: true,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })
      expect(modYes.meetsAvailabilityRequirement(cmd as any)).toBe(true)
    })

    it('console availability requires: not subscriber, not 3P, and first-party base URL', async () => {
      const cmd: Cmd = {
        type: 'local',
        name: 'x',
        description: 'x',
        availability: ['console'],
      }

      // Fails if subscriber
      const modSubscriber = await importCommandsWithAuth({
        isClaudeAISubscriber: true,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })
      expect(modSubscriber.meetsAvailabilityRequirement(cmd as any)).toBe(false)

      // Fails if 3P services
      const mod3p = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: true,
        isFirstPartyAnthropicBaseUrl: true,
      })
      expect(mod3p.meetsAvailabilityRequirement(cmd as any)).toBe(false)

      // Fails if not first-party base URL
      const modNot1p = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: false,
      })
      expect(modNot1p.meetsAvailabilityRequirement(cmd as any)).toBe(false)

      // Succeeds only for the intended combo
      const modOk = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })
      expect(modOk.meetsAvailabilityRequirement(cmd as any)).toBe(true)
    })
  })

  describe('remote/bridge safety', () => {
    it('isBridgeSafeCommand: prompt true, local-jsx false, local allowlist only', async () => {
      const mod = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })

      const promptCmd: Cmd = {
        type: 'prompt',
        name: 'skill',
        description: 'd',
      }
      expect(mod.isBridgeSafeCommand(promptCmd as any)).toBe(true)

      const jsxCmd: Cmd = {
        type: 'local-jsx',
        name: 'jsx',
        description: 'd',
      }
      expect(mod.isBridgeSafeCommand(jsxCmd as any)).toBe(false)

      // Use one known allowlisted local command by identity, taken from the exported Set.
      const allowlistedLocal = Array.from(mod.BRIDGE_SAFE_COMMANDS).find(
        (c: any) => c?.type === 'local',
      )
      expect(allowlistedLocal).toBeTruthy()
      expect(mod.isBridgeSafeCommand(allowlistedLocal as any)).toBe(true)

      const randomLocal: Cmd = {
        type: 'local',
        name: 'not-allowlisted',
        description: 'd',
      }
      expect(mod.isBridgeSafeCommand(randomLocal as any)).toBe(false)
    })

    it('filterCommandsForRemoteMode keeps only REMOTE_SAFE_COMMANDS members', async () => {
      const mod = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })

      const remoteSafe = Array.from(mod.REMOTE_SAFE_COMMANDS)
      expect(remoteSafe.length).toBeGreaterThan(0)

      const extra: Cmd = { type: 'local', name: 'extra', description: 'x' }
      const filtered = mod.filterCommandsForRemoteMode([
        ...(remoteSafe as any),
        extra as any,
      ])

      expect(filtered).toHaveLength(remoteSafe.length)
      // Identity-based set membership should preserve the originals.
      expect(new Set(filtered)).toEqual(new Set(remoteSafe))
    })
  })

  describe('lookup helpers', () => {
    it('findCommand/hasCommand/getCommand respect aliases', async () => {
      const mod = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })

      const commands: Cmd[] = [
        { type: 'local', name: 'a', description: 'a', aliases: ['aa'] },
        { type: 'local', name: 'b', description: 'b' },
      ]

      expect(mod.findCommand('aa', commands as any)?.name).toBe('a')
      expect(mod.hasCommand('aa', commands as any)).toBe(true)
      expect(mod.getCommand('aa', commands as any).name).toBe('a')
    })

    it('getCommand throws for missing command', async () => {
      const mod = await importCommandsWithAuth({
        isClaudeAISubscriber: false,
        isUsing3PServices: false,
        isFirstPartyAnthropicBaseUrl: true,
      })

      const commands: Cmd[] = [{ type: 'local', name: 'a', description: 'a' }]
      expect(() => mod.getCommand('missing', commands as any)).toThrow(
        /Command missing not found/,
      )
    })
  })
})

