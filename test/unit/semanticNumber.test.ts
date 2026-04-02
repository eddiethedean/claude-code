import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { semanticNumber } from '../../src/utils/semanticNumber.js'

describe('semanticNumber', () => {
  it('accepts numbers', () => {
    const s = semanticNumber()
    expect(s.parse(30)).toBe(30)
    expect(s.parse(-5)).toBe(-5)
    expect(s.parse(3.14)).toBeCloseTo(3.14)
  })

  it('coerces numeric string literals only', () => {
    const s = semanticNumber()
    expect(s.parse('30')).toBe(30)
    expect(s.parse('-5')).toBe(-5)
    expect(s.parse('3.14')).toBeCloseTo(3.14)
  })

  it('rejects non-numeric strings (no broad coercion)', () => {
    const s = semanticNumber()
    expect(() => s.parse('')).toThrow()
    expect(() => s.parse(' 30 ')).toThrow() // regex is strict; trimming is not performed here
    expect(() => s.parse('30px')).toThrow()
    expect(() => s.parse('NaN')).toThrow()
  })

  it('works with optional inner schema', () => {
    const s = semanticNumber(z.number().optional())
    expect(s.parse(undefined)).toBeUndefined()
    expect(s.parse('42')).toBe(42)
  })
})

