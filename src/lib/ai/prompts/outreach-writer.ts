// 開發信撰寫 Prompt Template

import type { OutreachInput, SupportedLocale } from '../types'
import type { SalesProfile } from '@/lib/db/schema'

const CULTURAL_GUIDELINES: Record<SupportedLocale, string> = {
  'en': `- Use a direct but professional tone
- Lead with value, not features
- Keep paragraphs short (2-3 sentences)
- Include a clear, single call-to-action`,

  'zh-TW': `- 使用親切但專業的語氣
- 適當使用「您」表示尊重
- 可以用「我們」拉近距離
- 開頭可以先表達對對方公司的讚賞
- 結尾要有明確的下一步行動`,

  'zh-CN': `- 使用简洁专业的语气
- 适当使用"您"表示尊重
- 开头可简要提及合作意愿
- 结尾要有明确的下一步行动`,

  'ja': `- 必ず敬語（keigo）を使用してください
- 「お世話になっております」で始めてください
- 相手の会社への敬意を示してください
- 「ご検討いただけますと幸いです」のような丁寧な結びを使ってください
- 直接的すぎる表現は避けてください
- 「いただく」「くださる」を適切に使い分けてください`,

  'ko': `- 존댓말(격식체)을 사용해 주세요
- "안녕하세요" 또는 "귀사의 발전을 기원합니다"로 시작해 주세요
- 상대방 회사에 대한 존중을 표현해 주세요
- 정중한 마무리 인사를 포함해 주세요
- 너무 직접적인 표현은 피해 주세요`,

  'th': `- ใช้ภาษาสุภาพและเป็นทางการ
- ใช้คำว่า "ครับ/ค่ะ" ตามความเหมาะสม
- เริ่มต้นด้วยการแสดงความเคารพ
- ไม่ควรตรงเกินไป`,

  'vi': `- Sử dụng ngôn ngữ lịch sự và chuyên nghiệp
- Xưng hô phù hợp (anh/chị)
- Bắt đầu bằng lời chào lịch sự
- Kết thúc bằng lời mời hợp tác`,

  'ms': `- Gunakan bahasa yang sopan dan profesional
- Mulakan dengan salam yang sesuai
- Gunakan "Tuan/Puan" untuk menunjukkan hormat
- Akhiri dengan ajakan bertindak yang jelas`,

  'id': `- Gunakan bahasa yang sopan dan profesional
- Mulai dengan salam yang sesuai
- Gunakan "Bapak/Ibu" untuk menunjukkan rasa hormat
- Akhiri dengan ajakan bertindak yang jelas`,
}

const PURPOSE_INSTRUCTIONS: Record<string, string> = {
  cold_email: 'This is a cold outreach email. The recipient has never heard from the sender before. Focus on establishing credibility and relevance quickly.',
  follow_up: 'This is a follow-up email after a previous interaction. Reference the prior conversation and provide additional value.',
  introduction: 'This is an introduction email, possibly from a mutual connection. Leverage the shared relationship.',
  referral: 'This is a referral-based email. Someone recommended the sender reach out. Mention the referrer prominently.',
  thank_you: 'This is a thank-you email after a meeting or interaction. Express genuine gratitude and recap next steps.',
  meeting_request: 'This is a meeting request email. Be clear about the purpose, proposed time, and what the recipient will gain.',
  proposal: 'This is a proposal follow-up email. Summarize key points and reinforce the value proposition.',
  reconnect: 'This is a reconnection email to someone who has gone quiet. Be light, non-pushy, and offer new value.',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: 'Use a formal, polished tone. Suitable for executives and traditional industries.',
  friendly: 'Use a warm, approachable tone. Suitable for startups and creative industries.',
  urgent: 'Convey a sense of timeliness without being pushy. Highlight a time-sensitive opportunity.',
  consultative: 'Position yourself as an expert advisor. Ask thought-provoking questions.',
}

export function buildOutreachPrompt(input: OutreachInput, salesProfile?: SalesProfile | null) {
  const senderSection = salesProfile ? `
ABOUT THE SENDER (use this to personalize the email):
- Name/Company: ${salesProfile.companyName ?? 'N/A'}
- Title: ${salesProfile.jobTitle ?? 'N/A'}
- Products/Services offered: ${salesProfile.productsServices ?? 'Not specified'}
- Unique advantages: ${salesProfile.uniqueSellingPoints ?? 'Not specified'}
- Industry: ${salesProfile.industry ?? 'Not specified'}
- Preferred communication style: ${salesProfile.communicationStyle ?? 'professional'}
- Bio: ${salesProfile.personalBio ?? 'Not specified'}

Use the sender's product/service info to craft relevant value propositions.
Include the sender's company name naturally in the email.
Match the sender's preferred communication style.
${salesProfile.phone ? `Include phone: ${salesProfile.phone} in signature if appropriate.` : ''}
${salesProfile.lineId ? `Include LINE ID: ${salesProfile.lineId} in signature if appropriate.` : ''}
${salesProfile.customLinks?.length ? `Additional contact channels the sender uses:\n${(salesProfile.customLinks as { label: string; url: string }[]).map(l => `- ${l.label}: ${l.url}`).join('\n')}\nInclude relevant contact channels in the email signature if appropriate.` : ''}
` : '';

  const systemPrompt = `You are a world-class B2B sales copywriter who crafts highly personalized outreach emails.
You understand cultural nuances across different markets and adapt your writing style accordingly.

Cultural guidelines for this email:
${CULTURAL_GUIDELINES[input.language]}

Purpose: ${PURPOSE_INSTRUCTIONS[input.purpose] ?? ''}
Tone: ${TONE_INSTRUCTIONS[input.tone] ?? ''}
${senderSection}
IMPORTANT: Return your response as valid JSON:
{
  "subject": "Email subject line",
  "body": "Full email body",
  "tips": ["tip 1 for the sender", "tip 2", "..."]
}`

  const clientInfo = [
    `Name: ${input.clientData.name}`,
    `Company: ${input.clientData.company}`,
    input.clientData.role ? `Role: ${input.clientData.role}` : '',
    input.clientData.industry ? `Industry: ${input.clientData.industry}` : '',
    input.clientData.painPoints?.length ? `Known pain points: ${input.clientData.painPoints.join(', ')}` : '',
    input.clientData.previousInteractions?.length
      ? `Previous interactions:\n${input.clientData.previousInteractions.map((i) => `- ${i}`).join('\n')}`
      : '',
    input.product ? `Product/Service to promote: ${input.product}` : '',
  ].filter(Boolean).join('\n')

  const userPrompt = `Write a ${input.purpose.replace(/_/g, ' ')} email for:

${clientInfo}

Requirements:
- Write in ${getLanguageName(input.language)}
- Subject line should be compelling and under 60 characters
- Body should be concise (under 200 words)
- Include a clear call-to-action
- Provide 2-3 sending tips for the salesperson`

  return {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 2048,
    responseFormat: 'json' as const,
  }
}

function getLanguageName(locale: SupportedLocale): string {
  const names: Record<SupportedLocale, string> = {
    'en': 'English',
    'zh-TW': 'Traditional Chinese (Taiwan)',
    'zh-CN': 'Simplified Chinese',
    'ja': 'Japanese (with keigo/敬語)',
    'ko': 'Korean (with 존댓말)',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'ms': 'Malay',
    'id': 'Indonesian',
  }
  return names[locale]
}
