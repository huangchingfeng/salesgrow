// 拜訪摘要 Prompt Template

import type { VisitSummaryInput, SupportedLocale } from '../types'

const LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'Provide the summary entirely in English.',
  'zh-TW': '請全部使用繁體中文（台灣用語）回覆。',
  'zh-CN': '请全部使用简体中文回复。',
  'ja': 'すべて日本語で回答してください。',
  'ko': '모든 답변을 한국어로 작성해 주세요.',
  'th': 'กรุณาตอบเป็นภาษาไทยทั้งหมด',
  'vi': 'Vui lòng trả lời hoàn toàn bằng tiếng Việt.',
  'ms': 'Sila jawab sepenuhnya dalam Bahasa Melayu.',
  'id': 'Mohon jawab sepenuhnya dalam Bahasa Indonesia.',
}

export function buildVisitSummarizerPrompt(input: VisitSummaryInput) {
  const systemPrompt = `You are an expert sales meeting analyst. You listen to sales call/visit transcripts and extract structured insights.

Your analysis should be:
- Actionable: every insight should help the salesperson take a next step
- Honest: don't sugarcoat a bad meeting
- Specific: avoid vague observations

${LOCALE_INSTRUCTIONS[input.locale]}

IMPORTANT: Return your response as valid JSON:
{
  "summary": "2-3 paragraph meeting summary",
  "clientReaction": "positive" | "neutral" | "negative" | "mixed",
  "clientSentiment": "brief description of client's overall mood and engagement level",
  "actionItems": [
    { "action": "specific action to take", "deadline": "suggested deadline or null", "priority": "high" | "medium" | "low" }
  ],
  "closeProbability": <integer 0-100, estimate based on meeting signals>,
  "keyQuotes": ["important direct quote from the client"]
}`

  const userPrompt = `Analyze this sales meeting transcript (from voice-to-text, may contain transcription errors):

---
${input.transcript}
---

Please provide:
1. **Summary**: Concise overview of the meeting (key topics, decisions, concerns)
2. **Client Reaction**: Overall client sentiment (positive/neutral/negative/mixed)
3. **Client Sentiment**: Describe their engagement level and emotional state
4. **Action Items**: Specific next steps with priorities and suggested deadlines
5. **Close Probability**: Estimate likelihood of closing (0-100) with reasoning
6. **Key Quotes**: 2-3 notable direct quotes from the client that reveal their thinking`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.3,
    maxTokens: 4096,
    responseFormat: 'json' as const,
  }
}
