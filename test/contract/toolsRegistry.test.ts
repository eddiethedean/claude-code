import { describe, expect, it, vi } from 'vitest'

const mkTool = (name: string) =>
  ({
    name,
    isEnabled: () => true,
    isConcurrencySafe: () => true,
    isReadOnly: () => true,
    maxResultSizeChars: 0,
  }) as any

describe('tools registry contracts (src/tools.ts)', () => {
  it('filterToolsByDenyRules and assembleToolPool enforce deny + dedup + ordering', async () => {
    vi.resetModules()

    // Ensure Node never tries to load Bun-only specifiers during this import.
    vi.doMock('bun:bundle', () => ({ feature: () => false }))

    // Keep environment-driven branches off.
    vi.doMock('../../src/utils/envUtils.js', () => ({
      isEnvTruthy: () => false,
      isBareMode: () => false,
    }))
    vi.doMock('../../src/utils/toolSearch.js', () => ({
      isToolSearchEnabledOptimistic: () => false,
    }))
    vi.doMock('../../src/utils/tasks.js', () => ({
      isTodoV2Enabled: () => false,
      // Some tool modules reference schemas from utils/tasks at import time.
      TaskStatusSchema: () => ({}) as any,
    }))
    vi.doMock('../../src/utils/embeddedTools.js', () => ({
      hasEmbeddedSearchTools: () => false,
    }))
    vi.doMock('../../src/utils/shell/shellToolUtils.js', () => ({
      isPowerShellToolEnabled: () => false,
      SHELL_TOOL_NAMES: [] as const,
    }))
    vi.doMock('../../src/utils/agentSwarmsEnabled.js', () => ({
      isAgentSwarmsEnabled: () => false,
    }))
    vi.doMock('../../src/utils/worktreeModeEnabled.js', () => ({
      isWorktreeModeEnabled: () => false,
    }))

    // Deny-rule matcher used by filterToolsByDenyRules.
    vi.doMock('../../src/utils/permissions/permissions.js', () => ({
      getDenyRuleForTool: (_ctx: any, tool: any) => {
        if (tool.name === 'Denied') return { toolName: 'Denied' }
        if (tool.mcpInfo?.serverName === 'blocked') return { toolName: tool.name }
        return null
      },
    }))

    // REPL constants and synthetic output name referenced by tools.ts.
    vi.doMock('../../src/tools/REPLTool/constants.js', () => ({
      REPL_TOOL_NAME: 'REPL',
      REPL_ONLY_TOOLS: new Set<string>(),
      isReplModeEnabled: () => false,
    }))
    vi.doMock('../../src/tools/SyntheticOutputTool/SyntheticOutputTool.js', () => ({
      SYNTHETIC_OUTPUT_TOOL_NAME: 'synthetic_output',
    }))

    // Mock the direct imports of built-in tools.
    vi.doMock('../../src/tools/AgentTool/AgentTool.js', () => ({ AgentTool: mkTool('B_Agent') }))
    vi.doMock('../../src/tools/TaskOutputTool/TaskOutputTool.js', () => ({
      TaskOutputTool: mkTool('B_TaskOutput'),
    }))
    vi.doMock('../../src/tools/BashTool/BashTool.js', () => ({ BashTool: mkTool('Bash') }))
    vi.doMock('../../src/tools/FileReadTool/FileReadTool.js', () => ({ FileReadTool: mkTool('Read') }))
    vi.doMock('../../src/tools/FileEditTool/FileEditTool.js', () => ({ FileEditTool: mkTool('Edit') }))
    vi.doMock('../../src/tools/FileWriteTool/FileWriteTool.js', () => ({ FileWriteTool: mkTool('Write') }))
    vi.doMock('../../src/tools/GlobTool/GlobTool.js', () => ({ GlobTool: mkTool('Glob') }))
    vi.doMock('../../src/tools/GrepTool/GrepTool.js', () => ({ GrepTool: mkTool('Grep') }))
    vi.doMock('../../src/tools/NotebookEditTool/NotebookEditTool.js', () => ({
      NotebookEditTool: mkTool('NotebookEdit'),
    }))
    vi.doMock('../../src/tools/WebFetchTool/WebFetchTool.js', () => ({ WebFetchTool: mkTool('WebFetch') }))
    vi.doMock('../../src/tools/WebSearchTool/WebSearchTool.js', () => ({
      WebSearchTool: mkTool('WebSearch'),
    }))
    vi.doMock('../../src/tools/TodoWriteTool/TodoWriteTool.js', () => ({ TodoWriteTool: mkTool('TodoWrite') }))
    vi.doMock('../../src/tools/TaskStopTool/TaskStopTool.js', () => ({ TaskStopTool: mkTool('TaskStop') }))
    vi.doMock('../../src/tools/BriefTool/BriefTool.js', () => ({ BriefTool: mkTool('Brief') }))
    vi.doMock('../../src/tools/TaskGetTool/TaskGetTool.js', () => ({ TaskGetTool: mkTool('TaskGet') }))
    vi.doMock('../../src/tools/TaskCreateTool/TaskCreateTool.js', () => ({
      TaskCreateTool: mkTool('TaskCreate'),
    }))
    vi.doMock('../../src/tools/TaskUpdateTool/TaskUpdateTool.js', () => ({
      TaskUpdateTool: mkTool('TaskUpdate'),
    }))
    vi.doMock('../../src/tools/TaskListTool/TaskListTool.js', () => ({ TaskListTool: mkTool('TaskList') }))
    vi.doMock('../../src/tools/EnterPlanModeTool/EnterPlanModeTool.js', () => ({
      EnterPlanModeTool: mkTool('EnterPlan'),
    }))
    vi.doMock('../../src/tools/ExitPlanModeTool/ExitPlanModeV2Tool.js', () => ({
      ExitPlanModeV2Tool: mkTool('ExitPlan'),
    }))
    vi.doMock('../../src/tools/AskUserQuestionTool/AskUserQuestionTool.js', () => ({
      AskUserQuestionTool: mkTool('AskUserQuestion'),
    }))
    vi.doMock('../../src/tools/SendMessageTool/SendMessageTool.js', () => ({
      SendMessageTool: mkTool('SendMessage'),
    }))
    vi.doMock('../../src/tools/SkillTool/SkillTool.js', () => ({ SkillTool: mkTool('SkillTool') }))
    vi.doMock('../../src/tools/ToolSearchTool/ToolSearchTool.js', () => ({
      ToolSearchTool: mkTool('ToolSearch'),
    }))
    vi.doMock('../../src/tools/ListMcpResourcesTool/ListMcpResourcesTool.js', () => ({
      ListMcpResourcesTool: mkTool('ListMcpResources'),
    }))
    vi.doMock('../../src/tools/ReadMcpResourceTool/ReadMcpResourceTool.js', () => ({
      ReadMcpResourceTool: mkTool('ReadMcpResource'),
    }))

    const mod = await import('../../src/tools.js')

    const permissionContext = { mode: 'default' } as any
    const deniedFiltered = mod.filterToolsByDenyRules(
      [mkTool('Ok'), mkTool('Denied')],
      permissionContext,
    )
    expect(deniedFiltered.map((t: any) => t.name)).toEqual(['Ok'])

    const mcpTools = [
      { ...mkTool('Zed'), mcpInfo: { serverName: 'ok', toolName: 'zed' } },
      { ...mkTool('Bash'), mcpInfo: { serverName: 'ok', toolName: 'bash' } }, // conflicts with built-in
      { ...mkTool('Nope'), mcpInfo: { serverName: 'blocked', toolName: 'nope' } }, // denied
    ]
    const pool = mod.assembleToolPool(permissionContext, mcpTools as any)
    const names = pool.map((t: any) => t.name)

    expect(names).toContain('Bash')
    expect(names.filter(n => n === 'Bash')).toHaveLength(1)
    expect(names).toContain('Zed')
    expect(names).not.toContain('Nope')

    const merged = mod.getMergedTools(permissionContext, mcpTools as any)
    expect(merged.length).toBeGreaterThan(pool.length)
  })
})

