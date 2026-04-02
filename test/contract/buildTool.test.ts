import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { buildTool, toolMatchesName, findToolByName } from '../../src/Tool.js'

describe('Tool contracts', () => {
  it('buildTool fills safe defaults and preserves name', async () => {
    const T = buildTool({
      name: 'Example',
      maxResultSizeChars: 123,
      inputSchema: z.object({}),
      async call() {
        return { data: { ok: true } }
      },
      async description() {
        return 'desc'
      },
      prompt: async () => 'prompt',
      renderToolUseMessage: () => null,
      mapToolResultToToolResultBlockParam: (content: unknown, toolUseID: string) => ({
        type: 'tool_result',
        tool_use_id: toolUseID,
        is_error: false,
        content: JSON.stringify(content),
      }),
    })

    expect(T.name).toBe('Example')
    expect(T.isEnabled()).toBe(true)
    expect(T.isConcurrencySafe({})).toBe(false)
    expect(T.isReadOnly({})).toBe(false)
    expect(T.isDestructive?.({})).toBe(false)

    const perm = await T.checkPermissions({ any: 'x' } as any, {} as any)
    expect(perm).toEqual({ behavior: 'allow', updatedInput: { any: 'x' } })
  })

  it('toolMatchesName matches primary name and aliases', () => {
    const tool = { name: 'A', aliases: ['B'] }
    expect(toolMatchesName(tool, 'A')).toBe(true)
    expect(toolMatchesName(tool, 'B')).toBe(true)
    expect(toolMatchesName(tool, 'C')).toBe(false)
  })

  it('findToolByName finds tools by alias', () => {
    const tools = [{ name: 'A', aliases: ['B'] }, { name: 'C' }] as any
    expect(findToolByName(tools, 'B')?.name).toBe('A')
  })
})

