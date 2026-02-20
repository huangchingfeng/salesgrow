import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildOutreachPrompt } from '@/lib/ai/prompts/outreach-writer'
import type { OutreachInput, APIResponse, OutreachOutput } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } },
        { status: 401 }
      )
    }

    const body = (await req.json()) as OutreachInput
    if (!body.clientData?.name || !body.clientData?.company) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Client name and company are required' } },
        { status: 400 }
      )
    }

    const prompt = buildOutreachPrompt(body)

    const response = await aiGateway({
      task: 'outreach',
      userPlan: user.plan === 'team' ? 'pro' : user.plan,
      userId: user.id,
      messages: prompt.messages,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      responseFormat: prompt.responseFormat,
    })

    const data = JSON.parse(response.content) as OutreachOutput

    return NextResponse.json<APIResponse<OutreachOutput>>({
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
