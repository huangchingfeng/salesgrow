// 客戶研究 Prompt Template

import type { ClientResearchInput, SupportedLocale } from '../types'

const LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'Respond entirely in English.',
  'zh-TW': '請全部使用繁體中文（台灣用語）回覆。',
  'zh-CN': '请全部使用简体中文回复。',
  'ja': 'すべて日本語で回答してください。',
  'ko': '모든 답변을 한국어로 작성해 주세요.',
  'th': 'กรุณาตอบเป็นภาษาไทยทั้งหมด',
  'vi': 'Vui lòng trả lời hoàn toàn bằng tiếng Việt.',
  'ms': 'Sila jawab sepenuhnya dalam Bahasa Melayu.',
  'id': 'Mohon jawab sepenuhnya dalam Bahasa Indonesia.',
}

export function buildClientResearchPrompt(input: ClientResearchInput) {
  const systemPrompt = `You are a professional business analyst specializing in B2B sales intelligence.
Your job is to help sales professionals understand potential clients before reaching out.
Be specific, actionable, and data-driven. Avoid generic statements.

${LOCALE_INSTRUCTIONS[input.locale]}

IMPORTANT: Return your response as valid JSON matching this exact structure:
{
  "companyOverview": "2-3 paragraph company overview",
  "recentNews": ["news item 1", "news item 2", "..."],
  "painPoints": ["pain point 1", "pain point 2", "..."],
  "icebreakers": ["icebreaker topic 1", "icebreaker topic 2", "..."],
  "keyContacts": [
    { "role": "e.g. CTO", "suggestedApproach": "how to approach this person" }
  ],
  "industry": "industry category",
  "companySize": "estimated size"
}`

  const userPrompt = `Research the following company for a B2B sales approach:

Company: ${input.company}
${input.website ? `Website: ${input.website}` : ''}

Please provide:
1. **Company Overview**: What they do, their market position, key products/services, founding year, headquarters
2. **Recent News**: 3-5 recent developments, product launches, partnerships, or industry trends affecting them
3. **Pain Points**: 3-5 potential business challenges they might face based on their industry and size
4. **Icebreakers**: 3-5 conversation starters that show you've done your homework
5. **Key Contacts**: Suggest 2-3 roles to target and how to approach each
6. **Industry**: Their primary industry category
7. **Company Size**: Estimated employee count and revenue range if available`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.5,
    maxTokens: 4096,
    responseFormat: 'json' as const,
  }
}
