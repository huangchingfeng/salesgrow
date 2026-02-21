import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { salesProfiles } from '@/lib/db/schema'
import {
  startCoachSession,
  processUserMessage,
  generateFeedback,
} from '@/lib/ai/coach/engine'
import type { CoachScenario, BusinessCulture, SupportedLocale, APIResponse, CoachFeedbackOutput } from '@/lib/ai/types'

interface StartSessionBody {
  action: 'start'
  scenario: CoachScenario
  locale?: SupportedLocale
  culture?: BusinessCulture
}

interface SendMessageBody {
  action: 'message'
  messages: { role: 'user' | 'assistant'; content: string }[]
  scenario: CoachScenario
  locale: SupportedLocale
  culture: BusinessCulture
  maxTurns: number
  message: string
}

interface EndSessionBody {
  action: 'end'
  messages: { role: 'user' | 'assistant'; content: string }[]
  scenario: CoachScenario
  locale: SupportedLocale
}

type RequestBody = StartSessionBody | SendMessageBody | EndSessionBody

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getCurrentUser()
    const user = dbUser ?? { id: 'demo-user', plan: 'free' as const, name: 'Demo User', email: 'demo@salesgrow.app', locale: 'en', level: 1 }

    const body = (await req.json()) as RequestBody
    const userPlan = user.plan === 'team' ? 'pro' as const : user.plan as 'free' | 'pro'

    switch (body.action) {
      case 'start': {
        const locale = body.locale || (user.locale as SupportedLocale) || 'en'
        const culture = body.culture || 'taiwan'

        const { initialMessage, maxTurns } = startCoachSession(
          body.scenario,
          locale,
          culture,
        )

        return NextResponse.json<APIResponse<{
          initialMessage: string
          scenario: string
          maxTurns: number
          locale: string
          culture: string
        }>>({
          success: true,
          data: {
            initialMessage,
            scenario: body.scenario,
            maxTurns,
            locale,
            culture,
          },
        })
      }

      case 'message': {
        if (!body.messages || !body.message) {
          return NextResponse.json<APIResponse<never>>(
            { success: false, error: { code: 'INVALID_INPUT', message: 'messages and message are required' } },
            { status: 400 }
          )
        }

        // 每次都從 DB 讀取 salesProfile
        let salesProfile = null
        if (dbUser) {
          const [profile] = await db.select().from(salesProfiles).where(eq(salesProfiles.userId, dbUser.id))
          salesProfile = profile ?? null
        }

        // 把新的 user message 加進 messages
        const allMessages = [
          ...body.messages,
          { role: 'user' as const, content: body.message },
        ]

        const { reply, turnCount, isComplete } = await processUserMessage({
          userId: user.id,
          messages: allMessages,
          scenario: body.scenario,
          locale: body.locale,
          culture: body.culture,
          maxTurns: body.maxTurns,
          userPlan,
          salesProfile,
        })

        return NextResponse.json<APIResponse<{
          reply: string
          turnCount: number
          maxTurns: number
          isComplete: boolean
        }>>({
          success: true,
          data: {
            reply,
            turnCount,
            maxTurns: body.maxTurns,
            isComplete,
          },
        })
      }

      case 'end': {
        if (!body.messages) {
          return NextResponse.json<APIResponse<never>>(
            { success: false, error: { code: 'INVALID_INPUT', message: 'messages are required' } },
            { status: 400 }
          )
        }

        const feedback = await generateFeedback({
          userId: user.id,
          messages: body.messages,
          scenario: body.scenario,
          locale: body.locale,
          userPlan,
        })

        return NextResponse.json<APIResponse<CoachFeedbackOutput>>({
          success: true,
          data: feedback,
        })
      }

      default: {
        return NextResponse.json<APIResponse<never>>(
          { success: false, error: { code: 'INVALID_ACTION', message: 'Action must be start, message, or end' } },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: { code: 'COACH_ERROR', message } },
      { status: 500 }
    )
  }
}
