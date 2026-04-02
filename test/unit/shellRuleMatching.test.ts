import { describe, expect, it } from 'vitest'
import {
  hasWildcards,
  matchWildcardPattern,
  parsePermissionRule,
  permissionRuleExtractPrefix,
} from '../../src/utils/permissions/shellRuleMatching.js'

describe('shellRuleMatching', () => {
  describe('permissionRuleExtractPrefix', () => {
    it('extracts legacy :* prefix', () => {
      expect(permissionRuleExtractPrefix('git:*')).toBe('git')
      expect(permissionRuleExtractPrefix('npm run:*')).toBe('npm run')
    })

    it('returns null when not legacy syntax', () => {
      expect(permissionRuleExtractPrefix('git *')).toBeNull()
      expect(permissionRuleExtractPrefix('git:\\*')).toBeNull()
    })
  })

  describe('hasWildcards', () => {
    it('treats :* suffix as legacy prefix, not wildcard', () => {
      expect(hasWildcards('git:*')).toBe(false)
    })

    it('detects unescaped *', () => {
      expect(hasWildcards('git *')).toBe(true)
      expect(hasWildcards('* run *')).toBe(true)
    })

    it('ignores escaped \\*', () => {
      expect(hasWildcards('echo \\*')).toBe(false)
    })
  })

  describe('matchWildcardPattern', () => {
    it('supports simple wildcard matching', () => {
      expect(matchWildcardPattern('git *', 'git status')).toBe(true)
      expect(matchWildcardPattern('git *', 'hg status')).toBe(false)
    })

    it("treats trailing ' *' as optional args when it is the only wildcard", () => {
      expect(matchWildcardPattern('git *', 'git')).toBe(true)
      expect(matchWildcardPattern('git *', 'git add')).toBe(true)
    })

    it('respects escaped asterisk and backslash', () => {
      expect(matchWildcardPattern('echo \\*', 'echo *')).toBe(true)
      expect(matchWildcardPattern('echo \\\\*', 'echo \\anything')).toBe(true)
    })

    it('is case insensitive when requested', () => {
      expect(matchWildcardPattern('GIT *', 'git status', true)).toBe(true)
      expect(matchWildcardPattern('GIT *', 'git status', false)).toBe(false)
    })
  })

  describe('parsePermissionRule', () => {
    it('parses legacy prefix rule', () => {
      expect(parsePermissionRule('git:*')).toEqual({ type: 'prefix', prefix: 'git' })
    })

    it('parses wildcard rule when it contains unescaped *', () => {
      expect(parsePermissionRule('git *')).toEqual({ type: 'wildcard', pattern: 'git *' })
    })

    it('parses exact rule otherwise', () => {
      expect(parsePermissionRule('git status')).toEqual({
        type: 'exact',
        command: 'git status',
      })
    })
  })
})

