import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildEmailScorerPrompt } from '@/lib/ai/prompts/email-scorer'
import type { EmailScoreInput, APIResponse, EmailScoreOutput } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser()
    const user = dbUser ?? { id: 'demo-user', plan: 'free' as const, name: 'Demo User', email: 'demo@salesgrow.app', locale: 'en', level: 1 }

    const body = (await req.json()) as EmailScoreInput
    if (!body.emailContent) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Email content is required' } },
        { status: 400 }
      )
    }

    const prompt = buildEmailScorerPrompt({
      emailContent: body.emailContent,
      language: body.language || 'en',
    })

    const response = await aiGateway({
      task: 'scoring',
      userPlan: user.plan === 'team' ? 'pro' : user.plan,
      userId: user.id,
      messages: prompt.messages,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      responseFormat: prompt.responseFormat,
    })

    let data: EmailScoreOutput
    try {
      data = JSON.parse(response.content) as EmailScoreOutput
    } catch {
      console.error('[Score API] JSON parse failed. Raw:', response.content.slice(0, 500))
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Failed to parse AI response' } },
        { status: 502 }
      )
    }

    return NextResponse.json<APIResponse<EmailScoreOutput>>({
      success: true,
      data,
      meta: { model: response.model, latencyMs: response.latencyMs, cached: response.cached },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Score API] Error:', message)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: { code: 'AI_ERROR', message } },
      { status: 500 }
    )
  }
}
