import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildOutreachPrompt } from '@/lib/ai/prompts/outreach-writer'
import type { OutreachInput, APIResponse, OutreachOutput } from '@/lib/ai/types'

// 前端傳入的扁平格式
interface OutreachRequestBody {
  client: string
  purpose: string
  tone: string
  language: string
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser()
    const user = dbUser ?? { id: 'demo-user', plan: 'free' as const, name: 'Demo User', email: 'demo@salesgrow.app', locale: 'en', level: 1 }

    const body = (await req.json()) as OutreachRequestBody
    if (!body.client) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Client name is required' } },
        { status: 400 }
      )
    }

    // 將扁平格式轉換為 OutreachInput
    const input: OutreachInput = {
      clientData: {
        name: body.client,
        company: body.client,
      },
      purpose: (body.purpose || 'cold_email') as OutreachInput['purpose'],
      tone: (body.tone || 'formal') as OutreachInput['tone'],
      language: (body.language || 'en') as OutreachInput['language'],
    }

    const prompt = buildOutreachPrompt(input)

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
