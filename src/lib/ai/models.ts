// AI 模型設定與任務映射

import type { ModelConfig, TaskModelMapping, QuotaConfig } from './types'

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    provider: 'deepseek',
    displayName: 'DeepSeek Chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    maxTokens: 8192,
    inputPricePerMillion: 0.14,
    outputPricePerMillion: 0.28,
    capabilities: ['research', 'outreach', 'scoring', 'summarize', 'translate', 'daily_tasks', 'follow_up'],
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    apiKeyEnv: 'GOOGLE_AI_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    maxTokens: 8192,
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
    capabilities: ['research', 'outreach', 'scoring', 'summarize', 'translate', 'daily_tasks', 'follow_up'],
  },
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 8192,
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    capabilities: ['research', 'outreach', 'scoring', 'summarize', 'coach', 'translate', 'daily_tasks', 'follow_up', 'feedback'],
  },
  'claude-sonnet-4-6': {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 16384,
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    capabilities: ['research', 'outreach', 'scoring', 'summarize', 'coach', 'translate', 'daily_tasks', 'follow_up', 'feedback'],
  },
}

// 任務→模型映射：根據用戶方案選擇模型（陣列順序 = 優先級）
export const TASK_MODEL_MAPPINGS: TaskModelMapping[] = [
  {
    task: 'research',
    free: ['gemini-2.0-flash', 'deepseek-chat'],
    pro: ['claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
  },
  {
    task: 'outreach',
    free: ['deepseek-chat', 'gemini-2.0-flash'],
    pro: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  {
    task: 'scoring',
    free: ['gemini-2.0-flash', 'deepseek-chat'],
    pro: ['claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
  },
  {
    task: 'summarize',
    free: ['deepseek-chat', 'gemini-2.0-flash'],
    pro: ['claude-haiku-4-5-20251001', 'deepseek-chat'],
  },
  {
    task: 'coach',
    free: ['deepseek-chat', 'gemini-2.0-flash'],
    pro: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
  {
    task: 'translate',
    free: ['gemini-2.0-flash', 'deepseek-chat'],
    pro: ['claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
  },
  {
    task: 'daily_tasks',
    free: ['gemini-2.0-flash', 'deepseek-chat'],
    pro: ['claude-haiku-4-5-20251001', 'gemini-2.0-flash'],
  },
  {
    task: 'follow_up',
    free: ['deepseek-chat', 'gemini-2.0-flash'],
    pro: ['claude-haiku-4-5-20251001', 'deepseek-chat'],
  },
  {
    task: 'feedback',
    free: ['deepseek-chat', 'gemini-2.0-flash'],
    pro: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  },
]

// 配額設定
export const QUOTA_CONFIGS: QuotaConfig[] = [
  // Free 用戶限制
  { plan: 'free', task: 'research', dailyLimit: 5 },
  { plan: 'free', task: 'outreach', dailyLimit: 10 },
  { plan: 'free', task: 'scoring', dailyLimit: 10 },
  { plan: 'free', task: 'summarize', dailyLimit: 3 },
  { plan: 'free', task: 'coach', dailyLimit: 2 },
  { plan: 'free', task: 'translate', dailyLimit: 20 },
  { plan: 'free', task: 'daily_tasks', dailyLimit: 3 },
  { plan: 'free', task: 'follow_up', dailyLimit: 5 },
  { plan: 'free', task: 'feedback', dailyLimit: 2 },
  // Pro 用戶無限制
  { plan: 'pro', task: 'research', dailyLimit: -1 },
  { plan: 'pro', task: 'outreach', dailyLimit: -1 },
  { plan: 'pro', task: 'scoring', dailyLimit: -1 },
  { plan: 'pro', task: 'summarize', dailyLimit: -1 },
  { plan: 'pro', task: 'coach', dailyLimit: -1 },
  { plan: 'pro', task: 'translate', dailyLimit: -1 },
  { plan: 'pro', task: 'daily_tasks', dailyLimit: -1 },
  { plan: 'pro', task: 'follow_up', dailyLimit: -1 },
  { plan: 'pro', task: 'feedback', dailyLimit: -1 },
]

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS[modelId]
}

export function getModelsForTask(task: string, plan: string): string[] {
  const mapping = TASK_MODEL_MAPPINGS.find((m) => m.task === task)
  if (!mapping) return []
  return plan === 'pro' ? mapping.pro : mapping.free
}

export function getQuotaLimit(plan: string, task: string): number {
  const config = QUOTA_CONFIGS.find((q) => q.plan === plan && q.task === task)
  return config?.dailyLimit ?? 0
}

export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[modelId]
  if (!config) return 0
  const inputCost = (inputTokens / 1_000_000) * config.inputPricePerMillion
  const outputCost = (outputTokens / 1_000_000) * config.outputPricePerMillion
  return inputCost + outputCost
}
