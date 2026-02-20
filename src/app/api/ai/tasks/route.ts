import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiGateway } from '@/lib/ai/gateway'
import { buildDailyTasksPrompt } from '@/lib/ai/prompts/daily-tasks'
import { db } from '@/lib/db'
import { clients, visitLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { DailyTasksInput, APIResponse, DailyTasksOutput, SupportedLocale } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser()
    const user = dbUser ?? { id: 'demo-user', plan: 'free' as const, name: 'Demo User', email: 'demo@salesgrow.app', locale: 'en', level: 1 }
    const isDemo = !dbUser

    // 取得使用者的客戶列表
    const userClients = isDemo ? [] : await db
      .select()
      .from(clients)
      .where(eq(clients.userId, user.id))
      .orderBy(desc(clients.updatedAt))
      .limit(20)

    // 取得最近活動（拜訪記錄）
    const recentVisits = isDemo ? [] : await db
      .select()
      .from(visitLogs)
      .where(eq(visitLogs.userId, user.id))
      .orderBy(desc(visitLogs.visitDate))
      .limit(10)

    const input: DailyTasksInput = {
      userLevel: user.level,
      recentActivities: recentVisits.map((v) => ({
        type: 'visit',
        date: v.visitDate,
        details: v.summary || 'Client visit',
      })),
      clientList: userClients.map((c) => ({
        name: c.companyName,
        company: c.companyName,
        lastContact: c.lastContactAt?.toISOString().split('T')[0] ?? 'never',
        status: c.pipelineStage,
      })),
      locale: (user.locale as SupportedLocale) || 'en',
    }

    const prompt = buildDailyTasksPrompt(input)

    const response = await aiGateway({
      task: 'daily_tasks',
      userPlan: user.plan === 'team' ? 'pro' : user.plan,
      userId: user.id,
      messages: prompt.messages,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      responseFormat: prompt.responseFormat,
    })

    const data = JSON.parse(response.content) as DailyTasksOutput

    return NextResponse.json<APIResponse<DailyTasksOutput>>({
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
