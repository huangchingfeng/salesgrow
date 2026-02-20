import { describe, it, expect, beforeEach } from 'vitest'
import {
  getModelsForTask,
  getQuotaLimit,
  getModelConfig,
  estimateCost,
  TASK_MODEL_MAPPINGS,
  QUOTA_CONFIGS,
} from '@/lib/ai/models'
import { checkQuota } from '@/lib/ai/gateway'

describe('AI Routing - Model Selection', () => {
  it('should route free user research to gemini/deepseek', () => {
    const models = getModelsForTask('research', 'free')
    expect(models).toEqual(['gemini-2.0-flash', 'deepseek-chat'])
  })

  it('should route pro user research to claude-haiku/gemini', () => {
    const models = getModelsForTask('research', 'pro')
    expect(models).toEqual(['claude-haiku-4-5-20251001', 'gemini-2.0-flash'])
  })

  it('should route free user outreach to deepseek/gemini', () => {
    const models = getModelsForTask('outreach', 'free')
    expect(models).toEqual(['deepseek-chat', 'gemini-2.0-flash'])
  })

  it('should route pro user outreach to claude-sonnet/claude-haiku', () => {
    const models = getModelsForTask('outreach', 'pro')
    expect(models).toEqual(['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'])
  })

  it('should route pro user coach to claude-sonnet', () => {
    const models = getModelsForTask('coach', 'pro')
    expect(models[0]).toBe('claude-sonnet-4-6')
  })

  it('should return empty array for unknown task', () => {
    const models = getModelsForTask('nonexistent', 'free')
    expect(models).toEqual([])
  })

  it('should always have at least 2 models per task for fallback', () => {
    for (const mapping of TASK_MODEL_MAPPINGS) {
      expect(mapping.free.length).toBeGreaterThanOrEqual(2)
      expect(mapping.pro.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('AI Routing - Model Config', () => {
  it('should return config for deepseek-chat', () => {
    const config = getModelConfig('deepseek-chat')
    expect(config).toBeDefined()
    expect(config!.provider).toBe('deepseek')
    expect(config!.displayName).toBe('DeepSeek Chat')
  })

  it('should return config for gemini-2.0-flash', () => {
    const config = getModelConfig('gemini-2.0-flash')
    expect(config).toBeDefined()
    expect(config!.provider).toBe('google')
  })

  it('should return config for claude-haiku', () => {
    const config = getModelConfig('claude-haiku-4-5-20251001')
    expect(config).toBeDefined()
    expect(config!.provider).toBe('anthropic')
  })

  it('should return config for claude-sonnet', () => {
    const config = getModelConfig('claude-sonnet-4-6')
    expect(config).toBeDefined()
    expect(config!.provider).toBe('anthropic')
    expect(config!.maxTokens).toBe(16384)
  })

  it('should return undefined for unknown model', () => {
    const config = getModelConfig('unknown-model')
    expect(config).toBeUndefined()
  })
})

describe('AI Routing - Quota Check', () => {
  it('should limit free user research to 5/day', () => {
    const limit = getQuotaLimit('free', 'research')
    expect(limit).toBe(5)
  })

  it('should limit free user outreach to 10/day', () => {
    const limit = getQuotaLimit('free', 'outreach')
    expect(limit).toBe(10)
  })

  it('should limit free user coach to 2/day', () => {
    const limit = getQuotaLimit('free', 'coach')
    expect(limit).toBe(2)
  })

  it('should give pro user unlimited research (-1)', () => {
    const limit = getQuotaLimit('pro', 'research')
    expect(limit).toBe(-1)
  })

  it('should give pro user unlimited outreach (-1)', () => {
    const limit = getQuotaLimit('pro', 'outreach')
    expect(limit).toBe(-1)
  })

  it('should return 0 for unknown plan/task', () => {
    const limit = getQuotaLimit('enterprise', 'research')
    expect(limit).toBe(0)
  })

  it('should show full remaining quota for new free user', () => {
    const status = checkQuota('new-user-123', 'research', 'free')
    expect(status.used).toBe(0)
    expect(status.limit).toBe(5)
    expect(status.remaining).toBe(5)
  })

  it('should show unlimited remaining for pro user', () => {
    const status = checkQuota('pro-user-123', 'research', 'pro')
    expect(status.remaining).toBe(-1)
    expect(status.limit).toBe(-1)
  })

  it('should have quotas defined for all free tasks', () => {
    const freeTasks = QUOTA_CONFIGS.filter((q) => q.plan === 'free')
    expect(freeTasks.length).toBeGreaterThanOrEqual(9)
    for (const config of freeTasks) {
      expect(config.dailyLimit).toBeGreaterThan(0)
    }
  })

  it('should have all pro tasks set to unlimited', () => {
    const proTasks = QUOTA_CONFIGS.filter((q) => q.plan === 'pro')
    for (const config of proTasks) {
      expect(config.dailyLimit).toBe(-1)
    }
  })
})

describe('AI Routing - Fallback Chain', () => {
  it('should have different first models for free vs pro', () => {
    for (const mapping of TASK_MODEL_MAPPINGS) {
      // Free should use cheaper models first
      const freeFirst = mapping.free[0]
      const proFirst = mapping.pro[0]
      // Pro 使用的主要模型應是 Anthropic 的（較貴但較優質）
      if (mapping.task === 'outreach' || mapping.task === 'coach' || mapping.task === 'feedback') {
        expect(proFirst).toContain('claude')
      }
    }
  })

  it('should not use claude-sonnet for free users', () => {
    for (const mapping of TASK_MODEL_MAPPINGS) {
      expect(mapping.free).not.toContain('claude-sonnet-4-6')
    }
  })
})

describe('AI Routing - Cost Estimation', () => {
  it('should estimate cost for deepseek-chat', () => {
    const cost = estimateCost('deepseek-chat', 1000, 500)
    // input: 1000/1M * 0.14 = 0.00014
    // output: 500/1M * 0.28 = 0.00014
    expect(cost).toBeCloseTo(0.00028, 5)
  })

  it('should estimate cost for claude-sonnet', () => {
    const cost = estimateCost('claude-sonnet-4-6', 1000, 500)
    // input: 1000/1M * 3.00 = 0.003
    // output: 500/1M * 15.00 = 0.0075
    expect(cost).toBeCloseTo(0.0105, 4)
  })

  it('should return 0 for unknown model', () => {
    const cost = estimateCost('unknown-model', 1000, 500)
    expect(cost).toBe(0)
  })

  it('should return 0 for 0 tokens', () => {
    const cost = estimateCost('deepseek-chat', 0, 0)
    expect(cost).toBe(0)
  })

  it('should scale linearly with token count', () => {
    const cost1 = estimateCost('deepseek-chat', 1000, 1000)
    const cost2 = estimateCost('deepseek-chat', 2000, 2000)
    expect(cost2).toBeCloseTo(cost1 * 2, 8)
  })
})
