// 跟進訊息產生器 Prompt Template

import type { FollowUpInput, SupportedLocale } from '../types'

const LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'Write the follow-up message in English.',
  'zh-TW': '請使用繁體中文（台灣用語）撰寫跟進訊息。',
  'zh-CN': '请使用简体中文撰写跟进消息。',
  'ja': 'フォローアップメッセージは日本語（敬語）で作成してください。',
  'ko': '후속 메시지를 한국어(존댓말)로 작성해 주세요.',
  'th': 'กรุณาเขียนข้อความติดตามเป็นภาษาไทย',
  'vi': 'Vui lòng viết tin nhắn theo dõi bằng tiếng Việt.',
  'ms': 'Sila tulis mesej susulan dalam Bahasa Melayu.',
  'id': 'Mohon tulis pesan tindak lanjut dalam Bahasa Indonesia.',
}

export function buildFollowUpPrompt(input: FollowUpInput) {
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(input.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const urgencyContext = daysSinceContact > 30
    ? 'It has been over a month since last contact. The follow-up should re-establish connection without being pushy.'
    : daysSinceContact > 14
      ? 'It has been 2+ weeks. A timely follow-up is appropriate.'
      : daysSinceContact > 7
        ? 'About a week has passed. Follow up with new value or information.'
        : 'Recent contact. Only follow up if there is a specific reason.'

  const historyText = input.interactionHistory
    .map((h) => `- [${h.date}] ${h.type}: ${h.summary}`)
    .join('\n')

  const systemPrompt = `You are an expert sales follow-up strategist. You craft timely, relevant follow-up messages that add value and move deals forward.

Key principles:
- Never follow up just to "check in" — always provide value
- Reference specific details from previous interactions
- Suggest a clear next step
- Match the urgency to the relationship stage

${urgencyContext}

${LOCALE_INSTRUCTIONS[input.locale]}

IMPORTANT: Return your response as valid JSON:
{
  "suggestedMessage": "the full follow-up message text",
  "bestContactTime": "suggested day/time to send",
  "urgency": "high" | "medium" | "low",
  "reason": "why this follow-up timing and content is recommended",
  "alternativeApproaches": ["alternative approach 1", "alternative approach 2"]
}`

  const userPrompt = `Generate a follow-up message for:

Client: ${input.clientName}
Company: ${input.company}
Last Contact: ${input.lastContactDate} (${daysSinceContact} days ago)

Interaction History:
${historyText}

Please suggest:
1. A personalized follow-up message that references their history
2. Best time/day to send
3. Urgency level
4. Why this approach is recommended
5. 2-3 alternative approaches if the primary one doesn't work`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.6,
    maxTokens: 2048,
    responseFormat: 'json' as const,
  }
}
