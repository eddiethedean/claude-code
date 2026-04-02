// Minimal stub for leaked-source gaps.
//
// The upstream codebase includes background-session management handlers behind
// `feature('BG_SESSIONS')`. This fork’s baseline tests mock these handlers, but
// Node/Vitest still needs the module to exist for resolution.

export async function psHandler() {
  throw new Error('bg.psHandler stub')
}
export async function logsHandler() {
  throw new Error('bg.logsHandler stub')
}
export async function attachHandler() {
  throw new Error('bg.attachHandler stub')
}
export async function killHandler() {
  throw new Error('bg.killHandler stub')
}
export async function handleBgFlag(args = []) {
  const g = globalThis
  if (Array.isArray(g.__CLAUDE_BG_CALLS)) {
    g.__CLAUDE_BG_CALLS.push(args)
    return
  }
  throw new Error('bg.handleBgFlag stub')
}

