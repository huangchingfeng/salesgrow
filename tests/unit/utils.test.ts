import { describe, it, expect } from 'vitest'
import { cn, formatDate, truncate, sleep } from '@/lib/utils'

describe('cn - Class Name Merge', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active')
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('should merge tailwind conflicting classes', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('should handle array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle object inputs', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })
})

describe('formatDate', () => {
  it('should format Date object in English', () => {
    const result = formatDate(new Date('2026-02-20'), 'en')
    expect(result).toContain('Feb')
    expect(result).toContain('20')
    expect(result).toContain('2026')
  })

  it('should format date string', () => {
    const result = formatDate('2026-02-20', 'en')
    expect(result).toContain('2026')
  })

  it('should default to English locale', () => {
    const result = formatDate('2026-02-20')
    expect(result).toContain('Feb')
  })

  it('should format in Japanese locale', () => {
    const result = formatDate('2026-02-20', 'ja')
    expect(result).toContain('2026')
  })

  it('should format in Korean locale', () => {
    const result = formatDate('2026-06-15', 'ko')
    expect(result).toContain('2026')
  })

  it('should handle different months', () => {
    const jan = formatDate('2026-01-01', 'en')
    const dec = formatDate('2026-12-31', 'en')
    expect(jan).toContain('Jan')
    expect(dec).toContain('Dec')
  })
})

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('should truncate long strings', () => {
    expect(truncate('hello world foo bar', 10)).toBe('hello worl...')
  })

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('should handle length of 0', () => {
    expect(truncate('hello', 0)).toBe('...')
  })

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('should handle unicode characters', () => {
    const result = truncate('你好世界測試', 3)
    expect(result).toBe('你好世...')
  })
})

describe('sleep', () => {
  it('should return a promise', () => {
    const result = sleep(0)
    expect(result).toBeInstanceOf(Promise)
  })

  it('should resolve after specified ms', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })
})
