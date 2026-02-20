import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildVisitSummarizerPrompt } from '@/lib/ai/prompts/visit-summarizer'
import type { VisitSummaryInput, APIResponse, VisitSummaryOutput } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser()
    const user = dbUser ?? { id: 'demo-user', plan: 'free' as const, name: 'Demo User', email: 'demo@salesgrow.app', locale: 'en', level: 1 }

    const body = (await req.json()) as VisitSummaryInput
    if (!body.transcript) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Transcript is required' } },
        { status: 400 }
      )
    }

    const prompt = buildVisitSummarizerPrompt({
      transcript: body.transcript,
      locale: body.locale || 'en',
    })

    const response = await aiGateway({
      task: 'summarize',
      userPlan: user.plan === 'team' ? 'pro' : user.plan,
      userId: user.id,
      messages: prompt.messages,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      responseFormat: prompt.responseFormat,
    })

    const data = JSON.parse(response.content) as VisitSummaryOutput

    return NextResponse.json<APIResponse<VisitSummaryOutput>>({
      success: true,
      data,
      meta: { model: response.model, latencyMs: response.latencyMs, cached: response.cached },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: { code: 'AI_ERROR', message } },
      { status: 500 }
    )
  }
}
