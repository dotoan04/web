import { NextResponse } from 'next/server'

import { parseQuizContent, sanitizeParsedQuestions } from '@/lib/quizz/word-parser'

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const fallbackText = (formData.get('text') as string | null) || undefined

      if (!file && !fallbackText) {
        return NextResponse.json({ error: 'Vui lòng chọn tập tin hoặc nhập nội dung văn bản.' }, { status: 400 })
      }

      if (file) {
        if (file.size > MAX_SIZE) {
          return NextResponse.json({ error: 'Tập tin quá lớn. Giới hạn 8MB.' }, { status: 413 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const questions = await parseQuizContent({ buffer: arrayBuffer, text: fallbackText })
        return NextResponse.json({ questions: sanitizeParsedQuestions(questions) })
      }

      const questions = await parseQuizContent({ text: fallbackText })
      return NextResponse.json({ questions: sanitizeParsedQuestions(questions) })
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 })
    }

    const { base64File, text } = body as { base64File?: string; text?: string }

    if (!base64File && !text) {
      return NextResponse.json({ error: 'Vui lòng cung cấp tập tin hoặc nội dung văn bản.' }, { status: 400 })
    }

    const buffer = base64File ? Buffer.from(base64File, 'base64') : undefined
    const questions = await parseQuizContent({ buffer, text })
    return NextResponse.json({ questions: sanitizeParsedQuestions(questions) })
  } catch (error) {
    console.error('Import quiz failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Không thể phân tích nội dung bài kiểm tra.' },
      { status: 400 },
    )
  }
}
