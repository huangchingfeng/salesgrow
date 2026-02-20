// Email 評分 Prompt Template

import type { EmailScoreInput, SupportedLocale } from '../types'

const LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'Provide all feedback in English.',
  'zh-TW': '請使用繁體中文（台灣用語）提供所有回饋。',
  'zh-CN': '请使用简体中文提供所有反馈。',
  'ja': 'すべてのフィードバックを日本語で提供してください。',
  'ko': '모든 피드백을 한국어로 제공해 주세요.',
  'th': 'กรุณาให้ข้อเสนอแนะทั้งหมดเป็นภาษาไทย',
  'vi': 'Vui lòng cung cấp tất cả phản hồi bằng tiếng Việt.',
  'ms': 'Sila berikan semua maklum balas dalam Bahasa Melayu.',
  'id': 'Mohon berikan semua umpan balik dalam Bahasa Indonesia.',
}

export function buildEmailScorerPrompt(input: EmailScoreInput) {
  const systemPrompt = `You are an expert B2B sales email analyst. You evaluate outreach emails across 4 key dimensions.

Score each dimension from 0-25 points:

1. **Personalization (0-25)**:
   - 0-5: Generic template, no personalization
   - 6-12: Mentions company name but nothing specific
   - 13-18: References specific details about the recipient or their company
   - 19-25: Deeply personalized with relevant insights showing genuine research

2. **Value Proposition (0-25)**:
   - 0-5: No clear value offered
   - 6-12: Mentions features but not benefits
   - 13-18: Clear benefit stated but not compelling
   - 19-25: Compelling, specific value tied to recipient's likely needs

3. **Call to Action (0-25)**:
   - 0-5: No CTA or multiple confusing CTAs
   - 6-12: Vague CTA ("let me know")
   - 13-18: Clear CTA but could be more specific
   - 19-25: Single, specific, low-friction CTA with clear next step

4. **Tone Appropriateness (0-25)**:
   - 0-5: Inappropriate or offensive tone
   - 6-12: Too casual or too stiff for the context
   - 13-18: Generally appropriate but inconsistent
   - 19-25: Perfect tone for the audience, consistent throughout

${LOCALE_INSTRUCTIONS[input.language]}

IMPORTANT: Return your response as valid JSON:
{
  "totalScore": 75,
  "dimensions": {
    "personalization": { "score": 18, "maxScore": 25, "feedback": "specific feedback" },
    "valueProposition": { "score": 20, "maxScore": 25, "feedback": "specific feedback" },
    "callToAction": { "score": 15, "maxScore": 25, "feedback": "specific feedback" },
    "toneAppropriateness": { "score": 22, "maxScore": 25, "feedback": "specific feedback" }
  },
  "improvements": ["improvement 1", "improvement 2"],
  "strengths": ["strength 1", "strength 2"]
}`

  const userPrompt = `Please analyze and score this sales email:

---
${input.emailContent}
---

Provide detailed scoring across all 4 dimensions with specific, actionable feedback.`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.3,
    maxTokens: 2048,
    responseFormat: 'json' as const,
  }
}
