import { describe, it, expect } from 'vitest'
import type { EmailScoreOutput } from '@/lib/ai/types'

// 模擬 email 評分計算邏輯（4 維度各 25 分）
function calculateEmailScore(dimensions: {
  personalization: number
  valueProposition: number
  callToAction: number
  toneAppropriateness: number
}): EmailScoreOutput {
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

  const p = clamp(dimensions.personalization, 0, 25)
  const v = clamp(dimensions.valueProposition, 0, 25)
  const c = clamp(dimensions.callToAction, 0, 25)
  const t = clamp(dimensions.toneAppropriateness, 0, 25)
  const total = p + v + c + t

  return {
    totalScore: total,
    dimensions: {
      personalization: { score: p, maxScore: 25, feedback: '' },
      valueProposition: { score: v, maxScore: 25, feedback: '' },
      callToAction: { score: c, maxScore: 25, feedback: '' },
      toneAppropriateness: { score: t, maxScore: 25, feedback: '' },
    },
    improvements: [],
    strengths: [],
  }
}

// 評分等級判定
function getScoreGrade(total: number): string {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  return 'D'
}

describe('Email Scoring - Score Calculation', () => {
  it('should calculate total from all 4 dimensions', () => {
    const result = calculateEmailScore({
      personalization: 20,
      valueProposition: 22,
      callToAction: 18,
      toneAppropriateness: 15,
    })
    expect(result.totalScore).toBe(75)
  })

  it('should handle perfect scores (all 25)', () => {
    const result = calculateEmailScore({
      personalization: 25,
      valueProposition: 25,
      callToAction: 25,
      toneAppropriateness: 25,
    })
    expect(result.totalScore).toBe(100)
  })

  it('should handle all zeros', () => {
    const result = calculateEmailScore({
      personalization: 0,
      valueProposition: 0,
      callToAction: 0,
      toneAppropriateness: 0,
    })
    expect(result.totalScore).toBe(0)
  })

  it('should clamp values above 25 to 25', () => {
    const result = calculateEmailScore({
      personalization: 30,
      valueProposition: 25,
      callToAction: 25,
      toneAppropriateness: 25,
    })
    expect(result.totalScore).toBe(100)
    expect(result.dimensions.personalization.score).toBe(25)
  })

  it('should clamp negative values to 0', () => {
    const result = calculateEmailScore({
      personalization: -5,
      valueProposition: 25,
      callToAction: 25,
      toneAppropriateness: 25,
    })
    expect(result.totalScore).toBe(75)
    expect(result.dimensions.personalization.score).toBe(0)
  })

  it('should have maxScore of 25 for each dimension', () => {
    const result = calculateEmailScore({
      personalization: 10,
      valueProposition: 10,
      callToAction: 10,
      toneAppropriateness: 10,
    })
    expect(result.dimensions.personalization.maxScore).toBe(25)
    expect(result.dimensions.valueProposition.maxScore).toBe(25)
    expect(result.dimensions.callToAction.maxScore).toBe(25)
    expect(result.dimensions.toneAppropriateness.maxScore).toBe(25)
  })
})

describe('Email Scoring - Edge Cases', () => {
  it('should handle boundary value of exactly 25', () => {
    const result = calculateEmailScore({
      personalization: 25,
      valueProposition: 0,
      callToAction: 0,
      toneAppropriateness: 0,
    })
    expect(result.totalScore).toBe(25)
    expect(result.dimensions.personalization.score).toBe(25)
  })

  it('should handle mixed high/low scores', () => {
    const result = calculateEmailScore({
      personalization: 25,
      valueProposition: 25,
      callToAction: 0,
      toneAppropriateness: 0,
    })
    expect(result.totalScore).toBe(50)
  })

  it('should handle decimal scores by clamping within range', () => {
    const result = calculateEmailScore({
      personalization: 12.5,
      valueProposition: 12.5,
      callToAction: 12.5,
      toneAppropriateness: 12.5,
    })
    expect(result.totalScore).toBe(50)
  })
})

describe('Email Scoring - Grade Classification', () => {
  it('should give A+ for 90-100', () => {
    expect(getScoreGrade(95)).toBe('A+')
    expect(getScoreGrade(90)).toBe('A+')
    expect(getScoreGrade(100)).toBe('A+')
  })

  it('should give A for 80-89', () => {
    expect(getScoreGrade(85)).toBe('A')
    expect(getScoreGrade(80)).toBe('A')
    expect(getScoreGrade(89)).toBe('A')
  })

  it('should give B+ for 70-79', () => {
    expect(getScoreGrade(75)).toBe('B+')
    expect(getScoreGrade(70)).toBe('B+')
  })

  it('should give B for 60-69', () => {
    expect(getScoreGrade(65)).toBe('B')
    expect(getScoreGrade(60)).toBe('B')
  })

  it('should give C for 50-59', () => {
    expect(getScoreGrade(55)).toBe('C')
    expect(getScoreGrade(50)).toBe('C')
  })

  it('should give D for below 50', () => {
    expect(getScoreGrade(49)).toBe('D')
    expect(getScoreGrade(0)).toBe('D')
    expect(getScoreGrade(25)).toBe('D')
  })
})

describe('Email Scoring - Output Structure', () => {
  it('should return correct structure', () => {
    const result = calculateEmailScore({
      personalization: 20,
      valueProposition: 15,
      callToAction: 20,
      toneAppropriateness: 18,
    })

    expect(result).toHaveProperty('totalScore')
    expect(result).toHaveProperty('dimensions')
    expect(result).toHaveProperty('improvements')
    expect(result).toHaveProperty('strengths')

    expect(result.dimensions).toHaveProperty('personalization')
    expect(result.dimensions).toHaveProperty('valueProposition')
    expect(result.dimensions).toHaveProperty('callToAction')
    expect(result.dimensions).toHaveProperty('toneAppropriateness')
  })

  it('should include score and maxScore in each dimension', () => {
    const result = calculateEmailScore({
      personalization: 20,
      valueProposition: 15,
      callToAction: 20,
      toneAppropriateness: 18,
    })

    for (const dim of Object.values(result.dimensions)) {
      expect(dim).toHaveProperty('score')
      expect(dim).toHaveProperty('maxScore')
      expect(dim).toHaveProperty('feedback')
      expect(dim.score).toBeGreaterThanOrEqual(0)
      expect(dim.score).toBeLessThanOrEqual(dim.maxScore)
    }
  })
})
