import { describe, expect, it } from 'vitest'
import { buildDeepLink, parseDeepLink } from '../../src/utils/deepLink/parseDeepLink.js'

describe('parseDeepLink/buildDeepLink', () => {
  it('parses basic open action', () => {
    expect(parseDeepLink('claude-cli://open')).toEqual({
      query: undefined,
      cwd: undefined,
      repo: undefined,
    })
  })

  it('accepts protocol without // and normalizes', () => {
    expect(parseDeepLink('claude-cli:open?q=hi')).toEqual({
      query: 'hi',
      cwd: undefined,
      repo: undefined,
    })
  })

  it('rejects unknown actions', () => {
    expect(() => parseDeepLink('claude-cli://wat')).toThrow(/Unknown deep link action/)
  })

  it('rejects non-absolute cwd', () => {
    expect(() => parseDeepLink('claude-cli://open?cwd=relative/path')).toThrow(
      /must be an absolute path/i,
    )
  })

  it('rejects control characters in query', () => {
    expect(() => parseDeepLink('claude-cli://open?q=hello%0Aworld')).toThrow(
      /disallowed control characters/i,
    )
  })

  it('round-trips buildDeepLink', () => {
    const url = buildDeepLink({ query: 'fix tests', cwd: '/tmp', repo: 'owner/repo' })
    expect(parseDeepLink(url)).toEqual({ query: 'fix tests', cwd: '/tmp', repo: 'owner/repo' })
  })
})

