import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildClientResearchPrompt } from '@/lib/ai/prompts/client-research'
import type { ClientResearchInput, APIResponse, ClientResearchOutput } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } },
        { status: 401 }
      )
    }

    const body = (await req.json()) as ClientResearchInput
    if (!body.company) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Company name is required' } },
        { status: 400 }
      )
    }

    const prompt = buildClientResearchPrompt({
      company: body.company,
      website: body.website,
      locale: body.locale || 'en',
    })

    const response = await aiGateway({
      task: 'research',
      userPlan: user.plan === 'team' ? 'pro' : user.plan,
      userId: user.id,
      messages: prompt.messages,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      responseFormat: prompt.responseFormat,
    })

    const data = JSON.parse(response.content) as ClientResearchOutput

    return NextResponse.json<APIResponse<ClientResearchOutput>>({
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
