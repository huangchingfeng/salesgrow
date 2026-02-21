// AI Coach 核心引擎 — Stateless 架構（適用 Serverless 環境）

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
import { calculateWeightedScore, calculateXpReward } from './scoring'

/**
 * 開始新的教練 session（純函數，不存任何 state）
 */
export function startCoachSession(
  scenario: CoachScenario,
  locale: SupportedLocale,
  culture: BusinessCulture = 'taiwan',
): { initialMessage: string; maxTurns: number } {
  const scenarioConfig = getScenarioById(scenario)
  const maxTurns = scenarioConfig?.maxTurns ?? 8

  // 產生客戶的開場白
  const initialMessage = buildInitialClientMessage(scenario, culture, locale)

  return { initialMessage, maxTurns }
}

/**
 * 處理使用者的回應，取得 AI 客戶的回覆（Stateless）
 */
export async function processUserMessage(params: {
  userId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  scenario: CoachScenario
  locale: SupportedLocale
  culture: BusinessCulture
  maxTurns: number
  userPlan: 'free' | 'pro'
  salesProfile?: SalesProfile | null
}): Promise<{ reply: string; turnCount: number; isComplete: boolean }> {
  const { userId, messages, scenario, locale, culture, maxTurns, userPlan, salesProfile } = params

  // 從 messages 計算 turnCount（user 訊息數 + assistant 訊息數）
  const turnCount = messages.length

  // 檢查是否到達最大回合
  const isComplete = turnCount >= maxTurns

  // 建構臨時 session state 物件給 buildCoachRoleplayPrompt
  const tempSession: CoachSessionState = {
    sessionId: '',
    userId,
    scenario,
    locale,
    culture,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    turnCount,
    maxTurns,
    startedAt: 0,
    status: 'active',
  }

  const promptResult = buildCoachRoleplayPrompt(tempSession, scenario, culture, locale, salesProfile ?? null)

  const response = await aiGateway({
    task: 'coach',
    userPlan,
    userId,
    messages: [
      { role: 'system', content: promptResult.systemPrompt },
      ...messages,
    ],
    temperature: promptResult.temperature,
    maxTokens: promptResult.maxTokens,
  })

  return { reply: response.content, turnCount: turnCount + 1, isComplete }
}

/**
 * 產生教練回饋（Stateless）
 */
export async function generateFeedback(params: {
  userId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  scenario: CoachScenario
  locale: SupportedLocale
  userPlan: 'free' | 'pro'
}): Promise<CoachFeedbackOutput> {
  const { userId, messages, scenario, locale, userPlan } = params

  const promptResult = buildCoachFeedbackPrompt({
    scenario,
    conversation: messages,
    locale,
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
  const scenarioConfig = getScenarioById(scenario)
  if (scenarioConfig) {
    const weightedScore = calculateWeightedScore(feedback, scenarioConfig.category)
    feedback.totalScore = weightedScore
    feedback.xpEarned = calculateXpReward(weightedScore)
  }

  return feedback
}
