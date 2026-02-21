// AI Coach 核心引擎 — 管理教練 session 生命週期

import type {
  CoachScenario,
  CoachSessionState,
  SupportedLocale,
  BusinessCulture,
  ChatMessage,
  CoachFeedbackOutput,
} from '../types'
import type { SalesProfile } from '@/lib/db/schema'
import { aiGateway, cleanJsonResponse } from '../gateway'
import { buildCoachRoleplayPrompt, buildInitialClientMessage } from '../prompts/coach-roleplay'
import { buildCoachFeedbackPrompt } from '../prompts/coach-feedback'
import { getScenarioById } from './scenarios'
import { getCoachSystemPrompt } from './personality'
import { calculateWeightedScore, calculateXpReward } from './scoring'

// 記憶體中的 active sessions
const activeSessions = new Map<string, CoachSessionState>()
// 每個 session 對應的業務員檔案
const sessionProfiles = new Map<string, SalesProfile>()

/**
 * 開始新的教練 session
 */
export function startCoachSession(
  sessionId: string,
  userId: string,
  scenario: CoachScenario,
  locale: SupportedLocale,
  culture: BusinessCulture = 'taiwan',
  salesProfile?: SalesProfile | null
): { session: CoachSessionState; initialMessage: string } {
  const scenarioConfig = getScenarioById(scenario)
  const maxTurns = scenarioConfig?.maxTurns ?? 8

  // 產生客戶的開場白
  const initialMessage = buildInitialClientMessage(scenario, culture, locale)

  const session: CoachSessionState = {
    sessionId,
    userId,
    scenario,
    locale,
    culture,
    messages: [
      { role: 'assistant', content: initialMessage },
    ],
    turnCount: 1,
    maxTurns,
    startedAt: Date.now(),
    status: 'active',
  }

  activeSessions.set(sessionId, session)
  if (salesProfile) {
    sessionProfiles.set(sessionId, salesProfile)
  }

  return { session, initialMessage }
}

/**
 * 處理使用者的回應，取得 AI 客戶的回覆
 */
export async function processUserMessage(
  sessionId: string,
  userId: string,
  userMessage: string,
  userPlan: 'free' | 'pro' = 'free'
): Promise<{ reply: string; session: CoachSessionState; isComplete: boolean }> {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Unauthorized')
  if (session.status !== 'active') throw new Error('Session is not active')

  // 加入使用者訊息
  session.messages.push({ role: 'user', content: userMessage })
  session.turnCount++

  // 檢查是否到達最大回合
  const isComplete = session.turnCount >= session.maxTurns

  // 用 AI gateway 產生客戶回覆
  const profile = sessionProfiles.get(sessionId) ?? null
  const promptResult = buildCoachRoleplayPrompt(session, session.scenario, session.culture, session.locale, profile)

  const response = await aiGateway({
    task: 'coach',
    userPlan,
    userId,
    messages: [
      { role: 'system', content: promptResult.systemPrompt },
      ...session.messages,
    ],
    temperature: promptResult.temperature,
    maxTokens: promptResult.maxTokens,
  })

  // 加入 AI 回覆
  session.messages.push({ role: 'assistant', content: response.content })

  if (isComplete) {
    session.status = 'completed'
  }

  return { reply: response.content, session, isComplete }
}

/**
 * 產生教練回饋
 */
export async function generateFeedback(
  sessionId: string,
  userId: string,
  userPlan: 'free' | 'pro' = 'free'
): Promise<CoachFeedbackOutput> {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Unauthorized')

  session.status = 'completed'

  const promptResult = buildCoachFeedbackPrompt({
    scenario: session.scenario,
    conversation: session.messages,
    locale: session.locale,
  })

  const response = await aiGateway({
    task: 'feedback',
    userPlan,
    userId,
    messages: promptResult.messages,
    temperature: promptResult.temperature,
    maxTokens: promptResult.maxTokens,
    responseFormat: promptResult.responseFormat,
  })

  let feedback: CoachFeedbackOutput
  try {
    feedback = JSON.parse(response.content) as CoachFeedbackOutput
  } catch {
    // Anthropic fallback 可能回傳帶 markdown code block 的 JSON
    try {
      feedback = JSON.parse(cleanJsonResponse(response.content)) as CoachFeedbackOutput
    } catch {
      console.error('[Coach Engine] Failed to parse feedback JSON:', response.content.slice(0, 200))
      throw new Error('AI 回饋解析失敗，請重試')
    }
  }

  // 用加權算法調整分數
  const scenarioConfig = getScenarioById(session.scenario)
  if (scenarioConfig) {
    const weightedScore = calculateWeightedScore(feedback, scenarioConfig.category)
    feedback.totalScore = weightedScore
    feedback.xpEarned = calculateXpReward(weightedScore)
  }

  return feedback
}

/**
 * 取得 session 狀態
 */
export function getSession(sessionId: string): CoachSessionState | undefined {
  return activeSessions.get(sessionId)
}

/**
 * 結束 session
 */
export function endSession(sessionId: string): CoachSessionState | undefined {
  const session = activeSessions.get(sessionId)
  if (session) {
    session.status = 'completed'
  }
  return session
}

/**
 * 清除已完成的 sessions（記憶體管理）
 */
export function cleanupSessions(maxAgeMs: number = 60 * 60 * 1000): number {
  const now = Date.now()
  let cleaned = 0
  for (const [id, session] of activeSessions) {
    if (now - session.startedAt > maxAgeMs) {
      activeSessions.delete(id)
      sessionProfiles.delete(id)
      cleaned++
    }
  }
  return cleaned
}

/**
 * 取得 session 的持續時間（秒）
 */
export function getSessionDuration(sessionId: string): number {
  const session = activeSessions.get(sessionId)
  if (!session) return 0
  return Math.floor((Date.now() - session.startedAt) / 1000)
}
