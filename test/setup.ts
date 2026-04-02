import { vi } from 'vitest'

// The `bun:bundle` shim is provided via `vitest.config.ts` resolve.alias.

// Some internal Anthropic packages are referenced by the leaked source but are not
// available on the public npm registry. For baseline tests we stub them so that
// importing modules does not fail. Tests that care about sandbox behavior should
// target the adapter logic in this repo, not the external runtime.
vi.mock('@anthropic-ai/sandbox-runtime', () => {
  class SandboxViolationStore {}
  class SandboxManager {
    static isSandboxingEnabled() {
      return false
    }
    static areUnsandboxedCommandsAllowed() {
      return true
    }
    static isShellSandboxingEnabled() {
      return false
    }
    static isNetworkSandboxingEnabled() {
      return false
    }
    static isFsReadSandboxingEnabled() {
      return false
    }
    static isFsWriteSandboxingEnabled() {
      return false
    }
    static isAutoAllowBashIfSandboxedEnabled() {
      return false
    }
    static getFsWriteConfig() {
      return { allowOnly: [], denyWithinAllow: [] }
    }
  }

  const SandboxRuntimeConfigSchema = { parse: (x: unknown) => x }

  return {
    SandboxManager,
    SandboxRuntimeConfigSchema,
    SandboxViolationStore,
  }
})

// OpenTelemetry packages are used for analytics/telemetry, but baseline tests
// should not require pulling the full telemetry stack.
vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: (_attrs: unknown) => ({}),
}))
vi.mock('@opentelemetry/sdk-logs', () => ({
  BatchLogRecordProcessor: class {},
  LoggerProvider: class {
    addLogRecordProcessor() {}
    getLogger() {
      return {}
    }
  },
}))
vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
}))
vi.mock('@opentelemetry/api-logs', () => ({
  logs: {},
}))

vi.mock('@opentelemetry/core', () => ({
  ExportResultCode: { SUCCESS: 0, FAILED: 1 },
}))

