import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { salesProfiles } from '@/lib/db/schema'
import {
  startCoachSession,
  processUserMessage,
  generateFeedback,
  getSessionDuration,
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
  sessionId: string
  message: string
}

interface EndSessionBody {
  action: 'end'
  sessionId: string
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
        // 讀取業務員檔案
        let salesProfile = null
        if (dbUser) {
          const [profile] = await db.select().from(salesProfiles).where(eq(salesProfiles.userId, dbUser.id))
          salesProfile = profile ?? null
        }

        const sessionId = crypto.randomUUID()
        const { session, initialMessage } = startCoachSession(
          sessionId,
          user.id,
          body.scenario,
          body.locale || (user.locale as SupportedLocale) || 'en',
          body.culture || 'taiwan',
          salesProfile
        )

        return NextResponse.json<APIResponse<{
          sessionId: string
          initialMessage: string
          scenario: string
          maxTurns: number
        }>>({
          success: true,
          data: {
            sessionId: session.sessionId,
            initialMessage,
            scenario: session.scenario,
            maxTurns: session.maxTurns,
          },
        })
      }

      case 'message': {
        if (!body.sessionId || !body.message) {
          return NextResponse.json<APIResponse<never>>(
            { success: false, error: { code: 'INVALID_INPUT', message: 'sessionId and message are required' } },
            { status: 400 }
          )
        }

        const { reply, session, isComplete } = await processUserMessage(
          body.sessionId,
          user.id,
          body.message,
          userPlan
        )

        return NextResponse.json<APIResponse<{
          reply: string
          turnCount: number
          maxTurns: number
          isComplete: boolean
        }>>({
          success: true,
          data: {
            reply,
            turnCount: session.turnCount,
            maxTurns: session.maxTurns,
            isComplete,
          },
        })
      }

      case 'end': {
        if (!body.sessionId) {
          return NextResponse.json<APIResponse<never>>(
            { success: false, error: { code: 'INVALID_INPUT', message: 'sessionId is required' } },
            { status: 400 }
          )
        }

        const feedback = await generateFeedback(body.sessionId, user.id, userPlan)
        const durationSeconds = getSessionDuration(body.sessionId)

        return NextResponse.json<APIResponse<CoachFeedbackOutput & { durationSeconds: number }>>({
          success: true,
          data: { ...feedback, durationSeconds },
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
