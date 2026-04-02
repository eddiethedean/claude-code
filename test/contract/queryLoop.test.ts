import { describe, expect, it, vi } from 'vitest'
import { asSystemPrompt } from '../../src/utils/systemPromptType.js'

type AnyMsg = any

function mkToolUse(id: string, name = 'FakeTool'): AnyMsg {
  return { type: 'tool_use', id, name, input: {} }
}

describe('query loop contracts (src/query.ts)', () => {
  const mkToolUseContext = (abortController: AbortController) =>
    ({
      abortController,
      agentId: null,
      addNotification: () => {},
      options: {
        tools: [],
        mainLoopModel: 'x',
        thinkingConfig: {} as any,
        isNonInteractiveSession: true,
        appendSystemPrompt: undefined,
        agentDefinitions: { activeAgents: [], allowedAgentTypes: [] },
      },
      getAppState: () => ({
        toolPermissionContext: { mode: 'default' },
        mcp: { tools: [], clients: [] },
        fastMode: false,
        effortValue: null,
        advisorModel: null,
      }),
    }) as any

  it('emits missing tool_result blocks on abort when tool_use was already produced', async () => {
    vi.resetModules()

    // Keep the query loop narrow and deterministic.
    vi.doMock('../../src/query/config.js', () => ({
      buildQueryConfig: () => ({
        sessionId: 'test',
        gates: {
          streamingToolExecution: false,
          emitToolUseSummaries: false,
          isAnt: false,
          fastModeEnabled: false,
        },
      }),
    }))
    vi.doMock('../../src/utils/attachments.js', async (importOriginal) => {
      const actual = await importOriginal<any>()
      return {
        ...actual,
        startRelevantMemoryPrefetch: () => ({
          [Symbol.dispose]() {},
        }),
      }
    })

    const toolUseId = 'tooluse_1'
    const abortController = new AbortController()
    abortController.abort('user_abort')

    const { query } = await import('../../src/query.js')

    const deps = {
      uuid: () => 'uuid',
      microcompact: async (m: AnyMsg[]) => ({ didCompact: false, messages: m }),
      autocompact: async () => ({ compactionResult: null, consecutiveFailures: 0 }),
      callModel: async function* () {
        yield {
          type: 'assistant',
          uuid: 'a1',
          message: {
            role: 'assistant',
            content: [mkToolUse(toolUseId)],
          },
        }
        throw new Error('model crashed after tool_use')
      },
    } as any

    const toolUseContext = mkToolUseContext(abortController)

    const yielded: AnyMsg[] = []
    const gen = query({
      messages: [],
      systemPrompt: asSystemPrompt(['base']),
      userContext: {},
      systemContext: {},
      canUseTool: async () => true,
      toolUseContext,
      querySource: 'sdk' as any,
      deps,
    })

    for await (const msg of gen) yielded.push(msg)

    // Expect a synthetic tool_result message matching the tool_use id.
    const toolResults = yielded.filter(
      m =>
        m?.type === 'user' &&
        Array.isArray(m.message?.content) &&
        m.message.content.some(
          (b: any) => b.type === 'tool_result' && b.tool_use_id === toolUseId,
        ),
    )
    expect(toolResults.length).toBeGreaterThan(0)
  })

  it('enforces maxTurns by emitting a max_turns_reached attachment message', async () => {
    vi.resetModules()

    vi.doMock('../../src/query/config.js', () => ({
      buildQueryConfig: () => ({
        sessionId: 'test',
        gates: {
          streamingToolExecution: false,
          emitToolUseSummaries: false,
          isAnt: false,
          fastModeEnabled: false,
        },
      }),
    }))
    vi.doMock('../../src/services/analytics/index.js', () => ({
      logEvent: () => {},
    }))
    vi.doMock('../../src/utils/attachments.js', async (importOriginal) => {
      const actual = await importOriginal<any>()
      return {
        ...actual,
        startRelevantMemoryPrefetch: () => ({
          [Symbol.dispose]() {},
        }),
      }
    })
    vi.doMock('../../src/utils/messages.js', async (importOriginal) => {
      const actual = await importOriginal<any>()
      return {
        ...actual,
        normalizeMessagesForAPI: (msgs: AnyMsg[]) => msgs,
      }
    })
    vi.doMock('../../src/services/tools/toolOrchestration.js', () => ({
      runTools: async function* (toolUseBlocks: AnyMsg[]) {
        for (const b of toolUseBlocks) {
          yield {
            message: {
              type: 'user',
              uuid: 'tool_result_msg',
              message: {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: b.id,
                    is_error: false,
                    content: 'ok',
                  },
                ],
              },
            },
          }
        }
      },
    }))

    const { query } = await import('../../src/query.js')

    let calls = 0
    const deps = {
      uuid: () => `uuid_${calls}`,
      microcompact: async (m: AnyMsg[]) => ({ didCompact: false, messages: m }),
      autocompact: async () => ({ compactionResult: null, consecutiveFailures: 0 }),
      callModel: async function* () {
        calls++
        yield {
          type: 'assistant',
          uuid: `a_${calls}`,
          message: {
            role: 'assistant',
            content: [mkToolUse(`tooluse_${calls}`)],
          },
        }
      },
    } as any

    const toolUseContext = mkToolUseContext(new AbortController())

    const yielded: AnyMsg[] = []
    const gen = query({
      messages: [],
      systemPrompt: asSystemPrompt(['base']),
      userContext: {},
      systemContext: {},
      canUseTool: async () => true,
      toolUseContext,
      querySource: 'sdk' as any,
      deps,
      maxTurns: 1,
    })

    for await (const msg of gen) yielded.push(msg)

    const maxTurnsMsg = yielded.find(
      m => m?.type === 'attachment' && m.attachment?.type === 'max_turns_reached',
    )
    expect(maxTurnsMsg).toBeTruthy()
    expect(maxTurnsMsg.attachment.maxTurns).toBe(1)
  })
})

