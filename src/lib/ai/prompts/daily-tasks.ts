// 每日任務推薦 Prompt Template

import type { DailyTasksInput, SupportedLocale } from '../types'

const LOCALE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  'en': 'Provide all task descriptions in English.',
  'zh-TW': '請使用繁體中文（台灣用語）描述所有任務。',
  'zh-CN': '请使用简体中文描述所有任务。',
  'ja': 'すべてのタスク説明を日本語で提供してください。',
  'ko': '모든 작업 설명을 한국어로 제공해 주세요.',
  'th': 'กรุณาอธิบายงานทั้งหมดเป็นภาษาไทย',
  'vi': 'Vui lòng mô tả tất cả nhiệm vụ bằng tiếng Việt.',
  'ms': 'Sila jelaskan semua tugas dalam Bahasa Melayu.',
  'id': 'Mohon jelaskan semua tugas dalam Bahasa Indonesia.',
}

const XP_BY_DIFFICULTY: Record<string, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

export function buildDailyTasksPrompt(input: DailyTasksInput) {
  const recentText = input.recentActivities
    .map((a) => `- [${a.date}] ${a.type}: ${a.details}`)
    .join('\n')

  const clientsText = input.clientList
    .map((c) => `- ${c.name} (${c.company}) | Last contact: ${c.lastContact} | Status: ${c.status}`)
    .join('\n')

  const systemPrompt = `You are a smart sales coach AI that recommends daily tasks to help salespeople grow.
Your task recommendations should be:
- Actionable and specific (not vague like "do more outreach")
- Balanced between client work, skill building, and admin
- Adapted to the user's level and recent activity patterns
- Gamified with XP rewards to keep motivation high

User Level: ${input.userLevel} (1=beginner, 10=expert)

XP Rewards by difficulty:
- easy: ${XP_BY_DIFFICULTY.easy} XP
- medium: ${XP_BY_DIFFICULTY.medium} XP
- hard: ${XP_BY_DIFFICULTY.hard} XP

${LOCALE_INSTRUCTIONS[input.locale]}

IMPORTANT: Return your response as valid JSON:
{
  "tasks": [
    {
      "id": "task_1",
      "title": "task title",
      "description": "detailed description",
      "type": "outreach" | "follow_up" | "research" | "practice" | "admin",
      "xpReward": 25,
      "difficulty": "easy" | "medium" | "hard",
      "estimatedMinutes": 15,
      "relatedClient": null
    }
  ],
  "motivationalQuote": "an inspiring sales quote",
  "focusArea": "what the user should focus on today"
}`

  const userPrompt = `Generate 3-5 personalized daily tasks for this salesperson:

Recent Activities:
${recentText || 'No recent activities recorded.'}

Client Portfolio:
${clientsText || 'No clients in portfolio yet.'}

Consider:
1. Which clients need follow-up (check last contact dates)?
2. What skills should the user practice at their level?
3. Are there any patterns in recent activity that suggest areas to improve?
4. Include a mix of quick wins (easy) and growth challenges (medium/hard)
5. Always include at least one client-facing task if they have clients`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 2048,
    responseFormat: 'json' as const,
  }
}
