import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { quizInputSchema } from '@/lib/validators/quiz'
import { getCurrentSession } from '@/lib/auth/session'
import { upsertQuiz, listQuizzes } from '@/server/quizzes'

export async function GET() {
  const quizzes = await listQuizzes()
  return NextResponse.json({ quizzes })
}

export async function POST(request: Request) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = quizInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  try {
    const data = parsed.data
    const quiz = await upsertQuiz({
      ...data,
      createdById: session.user.id,
      autoReleaseAt: data.autoReleaseAt ? new Date(data.autoReleaseAt) : null,
      questions: data.questions.map((question, index) => ({
        ...question,
        order: question.order ?? index,
        options: question.options.map((option, optionIndex) => ({
          ...option,
          order: option.order ?? optionIndex,
        })),
      })),
    })

    // Revalidate quiz page and admin pages to ensure fresh data
    if (quiz.slug) {
      revalidatePath(`/doquizz/${quiz.slug}`)
    }
    revalidatePath('/admin/quizzes')
    if (quiz.id) {
      revalidatePath(`/admin/quizzes/${quiz.id}`)
    }

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    console.error('Không thể lưu quiz:', error)
    return NextResponse.json({ error: 'Không thể lưu quiz' }, { status: 500 })
  }
}
