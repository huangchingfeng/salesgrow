// AI Coach 話術評分算法

import type { CoachScenario, CoachFeedbackOutput } from '../types'

// 根據場景調整各維度權重
const SCENARIO_WEIGHTS: Record<string, Record<string, number>> = {
  // 異議處理場景：加重異議處理權重
  objection: {
    opening: 0.10,
    needsDiscovery: 0.15,
    solutionPresentation: 0.15,
    objectionHandling: 0.45,
    closing: 0.15,
  },
  // 成交場景：加重結束語權重
  closing: {
    opening: 0.10,
    needsDiscovery: 0.10,
    solutionPresentation: 0.25,
    objectionHandling: 0.15,
    closing: 0.40,
  },
  // 探索場景：加重需求探索權重
  discovery: {
    opening: 0.15,
    needsDiscovery: 0.40,
    solutionPresentation: 0.15,
    objectionHandling: 0.15,
    closing: 0.15,
  },
  // 簡報場景：加重方案呈現權重
  presentation: {
    opening: 0.15,
    needsDiscovery: 0.10,
    solutionPresentation: 0.40,
    objectionHandling: 0.20,
    closing: 0.15,
  },
  // 社交場景：平均分配，加重開場和關係建立
  networking: {
    opening: 0.25,
    needsDiscovery: 0.25,
    solutionPresentation: 0.15,
    objectionHandling: 0.10,
    closing: 0.25,
  },
  // 跟進場景：加重開場和結尾
  follow_up: {
    opening: 0.25,
    needsDiscovery: 0.20,
    solutionPresentation: 0.15,
    objectionHandling: 0.10,
    closing: 0.30,
  },
}

// 預設權重（均等分配）
const DEFAULT_WEIGHTS: Record<string, number> = {
  opening: 0.20,
  needsDiscovery: 0.20,
  solutionPresentation: 0.20,
  objectionHandling: 0.20,
  closing: 0.20,
}

export function getScenarioWeights(category: string): Record<string, number> {
  return SCENARIO_WEIGHTS[category] ?? DEFAULT_WEIGHTS
}

// 計算加權總分
export function calculateWeightedScore(
  feedback: CoachFeedbackOutput,
  category: string
): number {
  const weights = getScenarioWeights(category)
  const { dimensions } = feedback

  const weightedScore =
    (dimensions.opening.score / dimensions.opening.maxScore) * weights.opening * 100 +
    (dimensions.needsDiscovery.score / dimensions.needsDiscovery.maxScore) * weights.needsDiscovery * 100 +
    (dimensions.solutionPresentation.score / dimensions.solutionPresentation.maxScore) * weights.solutionPresentation * 100 +
    (dimensions.objectionHandling.score / dimensions.objectionHandling.maxScore) * weights.objectionHandling * 100 +
    (dimensions.closing.score / dimensions.closing.maxScore) * weights.closing * 100

  return Math.round(weightedScore)
}

// 根據總分計算 XP 獎勵
export function calculateXpReward(totalScore: number): number {
  if (totalScore >= 86) return 75
  if (totalScore >= 71) return 50
  if (totalScore >= 51) return 35
  if (totalScore >= 31) return 20
  return 10
}

// 根據分數取得等級標籤
export function getScoreGrade(totalScore: number): {
  grade: string
  label: Record<string, string>
} {
  if (totalScore >= 90) {
    return {
      grade: 'S',
      label: {
        'en': 'Master', 'zh-TW': '大師級', 'zh-CN': '大师级',
        'ja': 'マスター', 'ko': '마스터',
      },
    }
  }
  if (totalScore >= 80) {
    return {
      grade: 'A',
      label: {
        'en': 'Excellent', 'zh-TW': '優秀', 'zh-CN': '优秀',
        'ja': '優秀', 'ko': '우수',
      },
    }
  }
  if (totalScore >= 65) {
    return {
      grade: 'B',
      label: {
        'en': 'Good', 'zh-TW': '良好', 'zh-CN': '良好',
        'ja': '良好', 'ko': '양호',
      },
    }
  }
  if (totalScore >= 50) {
    return {
      grade: 'C',
      label: {
        'en': 'Average', 'zh-TW': '普通', 'zh-CN': '普通',
        'ja': '普通', 'ko': '보통',
      },
    }
  }
  return {
    grade: 'D',
    label: {
      'en': 'Needs Practice', 'zh-TW': '需要練習', 'zh-CN': '需要练习',
      'ja': '要練習', 'ko': '연습 필요',
    },
  }
}

// 判斷最弱的維度（建議重點練習）
export function getWeakestDimension(feedback: CoachFeedbackOutput): string {
  const { dimensions } = feedback
  const scores = [
    { name: 'opening', ratio: dimensions.opening.score / dimensions.opening.maxScore },
    { name: 'needsDiscovery', ratio: dimensions.needsDiscovery.score / dimensions.needsDiscovery.maxScore },
    { name: 'solutionPresentation', ratio: dimensions.solutionPresentation.score / dimensions.solutionPresentation.maxScore },
    { name: 'objectionHandling', ratio: dimensions.objectionHandling.score / dimensions.objectionHandling.maxScore },
    { name: 'closing', ratio: dimensions.closing.score / dimensions.closing.maxScore },
  ]
  scores.sort((a, b) => a.ratio - b.ratio)
  return scores[0].name
}
