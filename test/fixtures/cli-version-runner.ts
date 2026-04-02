// Runs the CLI entrypoint in the minimal --version fast path.
// This avoids importing the full TUI, and makes output snapshot-able.

// @ts-expect-error - MACRO is a build-time global in upstream builds
globalThis.MACRO = { VERSION: '0.0.0-test' }

process.argv = ['node', 'cli.tsx', '--version']

await import('../../src/entrypoints/cli.tsx')

