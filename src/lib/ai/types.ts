// AI 系統型別定義

export type AIProvider = 'deepseek' | 'google' | 'anthropic'

export type AIModel =
  | 'deepseek-chat'
  | 'gemini-2.0-flash'
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'

export type UserPlan = 'free' | 'pro'

export type TaskType =
  | 'research'
  | 'outreach'
  | 'scoring'
  | 'summarize'
  | 'coach'
  | 'translate'
  | 'daily_tasks'
  | 'follow_up'
  | 'feedback'

export type SupportedLocale =
  | 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko'
  | 'th' | 'vi' | 'ms' | 'id'

// --- Model Config ---

export interface ModelConfig {
  id: AIModel
  provider: AIProvider
  displayName: string
  apiKeyEnv: string
  endpoint: string
  maxTokens: number
  inputPricePerMillion: number
  outputPricePerMillion: number
  capabilities: TaskType[]
}

export interface TaskModelMapping {
  task: TaskType
  free: AIModel[]
  pro: AIModel[]
}

// --- Gateway ---

export interface AIRequest {
  task: TaskType
  userPlan: UserPlan
  userId: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  responseFormat?: 'json' | 'text'
}

export interface AIResponse {
  content: string
  model: AIModel
  provider: AIProvider
  usage: TokenUsage
  cached: boolean
  latencyMs: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

// --- Quota ---

export interface QuotaConfig {
  plan: UserPlan
  task: TaskType
  dailyLimit: number // -1 = 無限
}

export interface QuotaStatus {
  used: number
  limit: number
  remaining: number
  resetAt: Date
}

// --- Cache ---

export interface CacheEntry {
  key: string
  value: string
  model: AIModel
  createdAt: number
  ttlMs: number
}

// --- Client Research ---

export interface ClientResearchInput {
  company: string
  website?: string
  locale: SupportedLocale
}

export interface ClientResearchOutput {
  companyOverview: string
  recentNews: string[]
  painPoints: string[]
  icebreakers: string[]
  keyContacts: {
    role: string
    suggestedApproach: string
  }[]
  industry: string
  companySize: string
}

// --- Outreach ---

export type OutreachPurpose =
  | 'cold_email'
  | 'follow_up'
  | 'introduction'
  | 'referral'
  | 'thank_you'
  | 'meeting_request'
  | 'proposal'
  | 'reconnect'

export type OutreachTone = 'formal' | 'friendly' | 'urgent' | 'consultative'

export interface OutreachInput {
  clientData: {
    name: string
    company: string
    role?: string
    industry?: string
    painPoints?: string[]
    previousInteractions?: string[]
  }
  purpose: OutreachPurpose
  tone: OutreachTone
  language: SupportedLocale
  product?: string
}

export interface OutreachOutput {
  subject: string
  body: string
  tips: string[]
}

// --- Email Scoring ---

export interface EmailScoreInput {
  emailContent: string
  language: SupportedLocale
}

export interface EmailScoreOutput {
  totalScore: number
  dimensions: {
    personalization: { score: number; maxScore: 25; feedback: string }
    valueProposition: { score: number; maxScore: 25; feedback: string }
    callToAction: { score: number; maxScore: 25; feedback: string }
    toneAppropriateness: { score: number; maxScore: 25; feedback: string }
  }
  improvements: string[]
  strengths: string[]
}

// --- Visit Summary ---

export interface VisitSummaryInput {
  transcript: string
  locale: SupportedLocale
}

export interface VisitSummaryOutput {
  summary: string
  clientReaction: 'positive' | 'neutral' | 'negative' | 'mixed'
  clientSentiment: string
  actionItems: {
    action: string
    deadline?: string
    priority: 'high' | 'medium' | 'low'
  }[]
  closeProbability: number
  keyQuotes: string[]
}

// --- Follow-up ---

export interface FollowUpInput {
  clientName: string
  company: string
  interactionHistory: {
    date: string
    type: string
    summary: string
  }[]
  lastContactDate: string
  locale: SupportedLocale
}

export interface FollowUpOutput {
  suggestedMessage: string
  bestContactTime: string
  urgency: 'high' | 'medium' | 'low'
  reason: string
  alternativeApproaches: string[]
}

// --- Daily Tasks ---

export interface DailyTasksInput {
  userLevel: number
  recentActivities: {
    type: string
    date: string
    details: string
  }[]
  clientList: {
    name: string
    company: string
    lastContact: string
    status: string
  }[]
  locale: SupportedLocale
}

export interface DailyTask {
  id: string
  title: string
  description: string
  type: 'outreach' | 'follow_up' | 'research' | 'practice' | 'admin'
  xpReward: number
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedMinutes: number
  relatedClient?: string
}

export interface DailyTasksOutput {
  tasks: DailyTask[]
  motivationalQuote: string
  focusArea: string
}

// --- Coach ---

export type CoachScenario =
  | 'cold_call'
  | 'objection_price'
  | 'objection_timing'
  | 'objection_competitor'
  | 'objection_no_budget'
  | 'objection_need_approval'
  | 'objection_already_have'
  | 'objection_too_complex'
  | 'objection_not_interested'
  | 'objection_send_info'
  | 'needs_discovery'
  | 'needs_deep_dive'
  | 'closing_assumptive'
  | 'closing_urgency'
  | 'closing_summary'
  | 'closing_alternative'
  | 'presentation'
  | 'presentation_demo'
  | 'follow_up_call'
  | 'follow_up_no_response'
  | 'referral_ask'
  | 'referral_introduction'
  | 'upsell'
  | 'cross_sell'
  | 'negotiation_discount'
  | 'negotiation_terms'
  | 'gate_keeper'
  | 'executive_pitch'
  | 'networking_event'
  | 'linkedin_outreach'

export type CoachDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type BusinessCulture =
  | 'taiwan'
  | 'japan'
  | 'korea'
  | 'usa'
  | 'europe'
  | 'southeast_asia'

export interface CoachScenarioConfig {
  id: CoachScenario
  name: Record<SupportedLocale, string>
  description: Record<SupportedLocale, string>
  difficulty: CoachDifficulty
  category: 'objection' | 'closing' | 'discovery' | 'presentation' | 'networking' | 'follow_up'
  aiRole: string
  aiPersonality: string
  expectedSkills: string[]
  maxTurns: number
}

export interface CoachSessionState {
  sessionId: string
  userId: string
  scenario: CoachScenario
  locale: SupportedLocale
  culture: BusinessCulture
  messages: ChatMessage[]
  turnCount: number
  maxTurns: number
  startedAt: number
  status: 'active' | 'completed' | 'abandoned'
}

export interface CoachFeedbackInput {
  scenario: CoachScenario
  conversation: ChatMessage[]
  locale: SupportedLocale
}

export interface CoachFeedbackOutput {
  totalScore: number
  dimensions: {
    opening: { score: number; maxScore: 20; feedback: string }
    needsDiscovery: { score: number; maxScore: 20; feedback: string }
    solutionPresentation: { score: number; maxScore: 20; feedback: string }
    objectionHandling: { score: number; maxScore: 20; feedback: string }
    closing: { score: number; maxScore: 20; feedback: string }
  }
  strengths: string[]
  improvements: string[]
  encouragement: string
  xpEarned: number
}

// --- API Route Types ---

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
  meta?: {
    model: AIModel
    latencyMs: number
    cached: boolean
  }
}
