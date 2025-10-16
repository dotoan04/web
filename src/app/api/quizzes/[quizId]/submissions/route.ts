import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createSubmission, getQuizBySlug } from '@/server/quizzes'

const submissionSchema = z.object({
  participant: z.string().max(120).optional(),
  answers: z.record(z.string(), z.string()).optional().default({}),
})

type Params = {
  params: {
    quizId: string
  }
}

export async function POST(request: Request, { params }: Params) {
  const quiz = await getQuizBySlug(params.quizId)

  if (!quiz || quiz.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Quiz không tồn tại' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = submissionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  try {
    const { answers, participant } = parsed.data
    const { submission, score, totalPoints } = await createSubmission({
      quizId: quiz.id,
      participant,
      answers,
    })

    return NextResponse.json({ submissionId: submission.id, score, totalPoints })
  } catch (error) {
    console.error('Không thể lưu kết quả quiz:', error)
    return NextResponse.json({ error: 'Không thể lưu kết quả quiz' }, { status: 500 })
  }
}
