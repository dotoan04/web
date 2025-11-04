import { NextResponse } from 'next/server'

import { parseQuizContent, sanitizeParsedQuestions } from '@/lib/quizz/word-parser'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large files

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

    let buffer: ArrayBuffer | undefined
    if (base64File) {
      const buf = Buffer.from(base64File, 'base64')
      buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    }
    const questions = await parseQuizContent({ buffer, text })
    return NextResponse.json({ questions: sanitizeParsedQuestions(questions) })
  } catch (error) {
    console.error('Import quiz failed:', error)
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Không thể phân tích nội dung bài kiểm tra.'
    
    // Check if it's an image processing error
    if (errorMessage.includes('ảnh') || errorMessage.includes('image') || errorMessage.includes('Image')) {
      return NextResponse.json(
        { 
          error: `Lỗi xử lý ảnh: ${errorMessage}. Vui lòng kiểm tra file Word và đảm bảo ảnh trong file không bị hỏng.` 
        },
        { status: 400 },
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 },
    )
  }
}
