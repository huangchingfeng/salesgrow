// AI Gateway - 智慧路由系統
// 根據任務類型和用戶方案選擇最佳模型，含快取、配額、fallback

import type {
  AIRequest,
  AIResponse,
  AIModel,
  AIProvider,
  ChatMessage,
  TokenUsage,
  CacheEntry,
  QuotaStatus,
  TaskType,
  UserPlan,
} from './types'
import { MODEL_CONFIGS, getModelsForTask, getQuotaLimit, estimateCost } from './models'

// --- 記憶體快取 ---

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 分鐘
const MAX_CACHE_SIZE = 500

function getCacheKey(messages: ChatMessage[], model: AIModel): string {
  const content = messages.map((m) => `${m.role}:${m.content}`).join('|')
  // 簡易 hash
  let hash = 0
  const str = `${model}:${content}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return `ai_cache_${hash.toString(36)}`
}

function getFromCache(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.createdAt > entry.ttlMs) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setCache(key: string, value: string, model: AIModel): void {
  // LRU：超過上限時刪除最舊的
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, {
    key,
    value,
    model,
    createdAt: Date.now(),
    ttlMs: CACHE_TTL_MS,
  })
}

// --- 配額追蹤（記憶體版，之後接 KV/DB）---

const quotaUsage = new Map<string, { count: number; resetAt: number }>()

function getQuotaKey(userId: string, task: TaskType): string {
  const today = new Date().toISOString().split('T')[0]
  return `quota:${userId}:${task}:${today}`
}

export function checkQuota(userId: string, task: TaskType, plan: UserPlan): QuotaStatus {
  const limit = getQuotaLimit(plan, task)
  if (limit === -1) {
    return { used: 0, limit: -1, remaining: -1, resetAt: getNextResetTime() }
  }

  const key = getQuotaKey(userId, task)
  const usage = quotaUsage.get(key)
  const now = Date.now()

  if (!usage || now > usage.resetAt) {
    return { used: 0, limit, remaining: limit, resetAt: getNextResetTime() }
  }

  return {
    used: usage.count,
    limit,
    remaining: Math.max(0, limit - usage.count),
    resetAt: new Date(usage.resetAt),
  }
}

function incrementQuota(userId: string, task: TaskType): void {
  const key = getQuotaKey(userId, task)
  const usage = quotaUsage.get(key)
  const now = Date.now()

  if (!usage || now > usage.resetAt) {
    quotaUsage.set(key, { count: 1, resetAt: getNextResetTime().getTime() })
  } else {
    usage.count++
  }
}

function getNextResetTime(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

// --- Token 估算 ---

function estimateTokens(text: string): number {
  // 粗估：英文 ~4 chars/token，中日韓 ~1.5 chars/token
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g
  const cjkCount = (text.match(cjkPattern) || []).length
  const otherCount = text.length - cjkCount
  return Math.ceil(cjkCount / 1.5 + otherCount / 4)
}

// --- Provider 呼叫實作 ---

async function callDeepSeek(
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  temperature: number,
  responseFormat?: 'json' | 'text'
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  }
  if (responseFormat === 'json') {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const inputTokens = data.usage?.prompt_tokens ?? estimateTokens(messages.map((m) => m.content).join(''))
  const outputTokens = data.usage?.completion_tokens ?? estimateTokens(content)

  return {
    content,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
    },
  }
}

async function callGemini(
  messages: ChatMessage[],
  _model: string,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

  // 轉換訊息格式為 Gemini 格式
  const systemInstruction = messages.find((m) => m.role === 'system')?.content
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const inputTokens = data.usageMetadata?.promptTokenCount ?? estimateTokens(messages.map((m) => m.content).join(''))
  const outputTokens = data.usageMetadata?.candidatesTokenCount ?? estimateTokens(content)

  return {
    content,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: estimateCost('gemini-2.0-flash', inputTokens, outputTokens),
    },
  }
}

async function callAnthropic(
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const systemMessage = messages.find((m) => m.role === 'system')?.content
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: chatMessages,
  }
  if (systemMessage) {
    body.system = systemMessage
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  const inputTokens = data.usage?.input_tokens ?? estimateTokens(messages.map((m) => m.content).join(''))
  const outputTokens = data.usage?.output_tokens ?? estimateTokens(content)

  return {
    content,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
    },
  }
}

// --- Provider 路由 ---

async function callModel(
  model: AIModel,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  responseFormat?: 'json' | 'text'
): Promise<{ content: string; usage: TokenUsage }> {
  const config = MODEL_CONFIGS[model]
  if (!config) throw new Error(`Unknown model: ${model}`)

  switch (config.provider) {
    case 'deepseek':
      return callDeepSeek(messages, model, maxTokens, temperature, responseFormat)
    case 'google':
      return callGemini(messages, model, maxTokens, temperature)
    case 'anthropic':
      return callAnthropic(messages, model, maxTokens, temperature)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

// --- 主要 Gateway ---

export async function aiGateway(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now()

  // 1. 配額檢查
  const quota = checkQuota(request.userId, request.task, request.userPlan)
  if (quota.limit !== -1 && quota.remaining <= 0) {
    throw new AIGatewayError(
      'QUOTA_EXCEEDED',
      `Daily quota exceeded for ${request.task}. Resets at ${quota.resetAt.toISOString()}`
    )
  }

  // 2. 取得模型清單（含 fallback）
  const models = getModelsForTask(request.task, request.userPlan) as AIModel[]
  if (models.length === 0) {
    throw new AIGatewayError('NO_MODEL', `No model available for task: ${request.task}`)
  }

  // 3. 檢查快取
  const primaryModel = models[0]
  const cacheKey = getCacheKey(request.messages, primaryModel)
  const cachedContent = getFromCache(cacheKey)

  if (cachedContent) {
    const config = MODEL_CONFIGS[primaryModel]
    return {
      content: cachedContent,
      model: primaryModel,
      provider: config.provider as AIProvider,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
      cached: true,
      latencyMs: Date.now() - startTime,
    }
  }

  // 4. Fallback chain：依序嘗試模型
  let lastError: Error | null = null

  for (const model of models) {
    const config = MODEL_CONFIGS[model]
    if (!config) continue

    // 檢查 API key 是否設定
    if (!process.env[config.apiKeyEnv]) {
      lastError = new Error(`${config.apiKeyEnv} not configured`)
      continue
    }

    try {
      const maxTokens = request.maxTokens ?? config.maxTokens
      const temperature = request.temperature ?? 0.7
      const result = await callModel(model, request.messages, maxTokens, temperature, request.responseFormat)

      // 更新配額
      incrementQuota(request.userId, request.task)

      // 寫入快取
      setCache(cacheKey, result.content, model)

      return {
        content: result.content,
        model,
        provider: config.provider as AIProvider,
        usage: result.usage,
        cached: false,
        latencyMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[AI Gateway] Model ${model} failed:`, lastError.message)
      // 繼續嘗試下一個模型
    }
  }

  throw new AIGatewayError(
    'ALL_MODELS_FAILED',
    `All models failed for task ${request.task}. Last error: ${lastError?.message}`
  )
}

// --- 錯誤類別 ---

export class AIGatewayError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AIGatewayError'
    this.code = code
  }
}

// --- 工具函式 ---

export function clearCache(): void {
  cache.clear()
}

export function getCacheStats(): { size: number; maxSize: number } {
  return { size: cache.size, maxSize: MAX_CACHE_SIZE }
}
