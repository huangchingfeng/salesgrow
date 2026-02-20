import { describe, it, expect } from 'vitest'

// 從 gamification router 提取的 XP 計算邏輯
// xpForLevel(level) = level * 100 + (level - 1) * 50
function xpForLevel(level: number): number {
  return level * 100 + (level - 1) * 50
}

// 模擬升級流程
function simulateLevelUp(currentLevel: number, currentXp: number) {
  let level = currentLevel
  let xp = currentXp
  let leveledUp = false

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level++
    leveledUp = true
  }

  return { level, xp, leveledUp }
}

// Streak 計算邏輯
function calculateStreak(
  lastStreakDate: string | null,
  currentDate: string,
  currentStreak: number
): { newStreak: number; streakBroken: boolean } {
  if (!lastStreakDate) {
    return { newStreak: 1, streakBroken: false }
  }

  const last = new Date(lastStreakDate)
  const current = new Date(currentDate)
  const diffMs = current.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // 同一天，不變
    return { newStreak: currentStreak, streakBroken: false }
  } else if (diffDays === 1) {
    // 連續
    return { newStreak: currentStreak + 1, streakBroken: false }
  } else {
    // 中斷，重計
    return { newStreak: 1, streakBroken: true }
  }
}

// 成就解鎖條件
const ACHIEVEMENT_CONDITIONS: Record<string, (stats: { level: number; streak: number; emailsSent: number; clientsResearched: number }) => boolean> = {
  first_login: () => true,
  level_5: (s) => s.level >= 5,
  level_10: (s) => s.level >= 10,
  streak_7: (s) => s.streak >= 7,
  streak_30: (s) => s.streak >= 30,
  emails_10: (s) => s.emailsSent >= 10,
  emails_100: (s) => s.emailsSent >= 100,
  research_5: (s) => s.clientsResearched >= 5,
  research_50: (s) => s.clientsResearched >= 50,
}

function checkAchievement(badgeId: string, stats: { level: number; streak: number; emailsSent: number; clientsResearched: number }): boolean {
  const condition = ACHIEVEMENT_CONDITIONS[badgeId]
  return condition ? condition(stats) : false
}

describe('Gamification - XP Calculation', () => {
  it('should calculate XP needed for level 1→2', () => {
    // level 1: 1*100 + 0*50 = 100 XP
    expect(xpForLevel(1)).toBe(100)
  })

  it('should calculate XP needed for level 2→3', () => {
    // level 2: 2*100 + 1*50 = 250 XP
    expect(xpForLevel(2)).toBe(250)
  })

  it('should calculate XP needed for level 3→4', () => {
    // level 3: 3*100 + 2*50 = 400 XP
    expect(xpForLevel(3)).toBe(400)
  })

  it('should calculate XP needed for level 4→5', () => {
    // level 4: 4*100 + 3*50 = 550 XP
    expect(xpForLevel(4)).toBe(550)
  })

  it('should calculate XP needed for level 5→6', () => {
    // level 5: 5*100 + 4*50 = 700 XP
    expect(xpForLevel(5)).toBe(700)
  })

  it('should increase XP requirement per level', () => {
    for (let i = 1; i < 20; i++) {
      expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i))
    }
  })
})

describe('Gamification - Level Up', () => {
  it('should not level up when XP is below threshold', () => {
    const result = simulateLevelUp(1, 50)
    expect(result.leveledUp).toBe(false)
    expect(result.level).toBe(1)
    expect(result.xp).toBe(50)
  })

  it('should level up from 1 to 2 at exactly 100 XP', () => {
    const result = simulateLevelUp(1, 100)
    expect(result.leveledUp).toBe(true)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(0)
  })

  it('should carry over extra XP after level up', () => {
    const result = simulateLevelUp(1, 130)
    expect(result.leveledUp).toBe(true)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(30)
  })

  it('should handle multi-level jumps', () => {
    // 100 + 250 = 350 XP to go from 1 to 3
    const result = simulateLevelUp(1, 400)
    expect(result.leveledUp).toBe(true)
    expect(result.level).toBe(3)
    expect(result.xp).toBe(50)
  })

  it('should stay at current level with 0 XP', () => {
    const result = simulateLevelUp(3, 0)
    expect(result.leveledUp).toBe(false)
    expect(result.level).toBe(3)
  })
})

describe('Gamification - Streak Calculation', () => {
  it('should start streak at 1 for first login', () => {
    const result = calculateStreak(null, '2026-02-20', 0)
    expect(result.newStreak).toBe(1)
    expect(result.streakBroken).toBe(false)
  })

  it('should increment streak for consecutive days', () => {
    const result = calculateStreak('2026-02-19', '2026-02-20', 5)
    expect(result.newStreak).toBe(6)
    expect(result.streakBroken).toBe(false)
  })

  it('should keep streak on same-day login', () => {
    const result = calculateStreak('2026-02-20', '2026-02-20', 5)
    expect(result.newStreak).toBe(5)
    expect(result.streakBroken).toBe(false)
  })

  it('should reset streak after missing a day', () => {
    const result = calculateStreak('2026-02-18', '2026-02-20', 10)
    expect(result.newStreak).toBe(1)
    expect(result.streakBroken).toBe(true)
  })

  it('should reset streak after missing multiple days', () => {
    const result = calculateStreak('2026-02-10', '2026-02-20', 30)
    expect(result.newStreak).toBe(1)
    expect(result.streakBroken).toBe(true)
  })

  it('should handle month boundaries', () => {
    const result = calculateStreak('2026-01-31', '2026-02-01', 15)
    expect(result.newStreak).toBe(16)
    expect(result.streakBroken).toBe(false)
  })
})

describe('Gamification - Achievement Unlock', () => {
  const baseStats = { level: 1, streak: 0, emailsSent: 0, clientsResearched: 0 }

  it('should unlock first_login for any user', () => {
    expect(checkAchievement('first_login', baseStats)).toBe(true)
  })

  it('should not unlock level_5 at level 4', () => {
    expect(checkAchievement('level_5', { ...baseStats, level: 4 })).toBe(false)
  })

  it('should unlock level_5 at level 5', () => {
    expect(checkAchievement('level_5', { ...baseStats, level: 5 })).toBe(true)
  })

  it('should unlock level_10 at level 10', () => {
    expect(checkAchievement('level_10', { ...baseStats, level: 10 })).toBe(true)
  })

  it('should unlock streak_7 at 7-day streak', () => {
    expect(checkAchievement('streak_7', { ...baseStats, streak: 7 })).toBe(true)
  })

  it('should not unlock streak_30 at 29 days', () => {
    expect(checkAchievement('streak_30', { ...baseStats, streak: 29 })).toBe(false)
  })

  it('should unlock emails_10 at 10 emails sent', () => {
    expect(checkAchievement('emails_10', { ...baseStats, emailsSent: 10 })).toBe(true)
  })

  it('should unlock research_50 at 50 clients researched', () => {
    expect(checkAchievement('research_50', { ...baseStats, clientsResearched: 50 })).toBe(true)
  })

  it('should return false for unknown badge', () => {
    expect(checkAchievement('nonexistent_badge', baseStats)).toBe(false)
  })
})
