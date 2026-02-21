import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import type { APIResponse } from '@/lib/ai/types'

interface TranscribeOutput {
  text: string
}

// locale → ISO-639-1 語言代碼（提升 Whisper 辨識準確度）
const LOCALE_TO_WHISPER_LANG: Record<string, string> = {
  'zh-TW': 'zh', 'zh-CN': 'zh', 'ja': 'ja', 'ko': 'ko',
  'th': 'th', 'vi': 'vi', 'ms': 'ms', 'id': 'id',
  'en': 'en', 'de': 'de', 'fr': 'fr', 'es': 'es',
}

export async function POST(req: NextRequest) {
  try {
    await getCurrentUser() // 驗證登入（demo user 也允許）

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'OpenAI API key not configured' } },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const language = (formData.get('language') as string) || undefined

    if (!audioFile) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Audio file is required' } },
        { status: 400 }
      )
    }

    // Whisper 上限 25MB
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'Audio file must be under 25MB' } },
        { status: 400 }
      )
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-1')

    if (language) {
      const whisperLang = LOCALE_TO_WHISPER_LANG[language]
      if (whisperLang) {
        whisperForm.append('language', whisperLang)
      }
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Transcribe API] Whisper error:', response.status, errText)
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: { code: 'WHISPER_ERROR', message: `Transcription failed (${response.status})` } },
        { status: 502 }
      )
    }

    const data = (await response.json()) as { text: string }

    return NextResponse.json<APIResponse<TranscribeOutput>>({
      success: true,
      data: { text: data.text },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Transcribe API] Error:', message)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: { code: 'TRANSCRIBE_ERROR', message } },
      { status: 500 }
    )
  }
}
