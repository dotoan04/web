import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { quizInputSchema } from '@/lib/validators/quiz'
import { getCurrentSession } from '@/lib/auth/session'
import { deleteQuiz, upsertQuiz, getQuizBySlug, getQuizById } from '@/server/quizzes'

type Params = {
  params: {
    quizId: string
  }
}

export async function PUT(request: Request, { params }: Params) {
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
      id: params.quizId,
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
    revalidatePath(`/admin/quizzes/${params.quizId}`)

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Không thể cập nhật quiz:', error)
    return NextResponse.json({ error: 'Không thể cập nhật quiz' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  try {
    const quiz = await getQuizById(params.quizId)
    await deleteQuiz(params.quizId)

    // Revalidate pages after deletion
    if (quiz?.slug) {
      revalidatePath(`/doquizz/${quiz.slug}`)
    }
    revalidatePath('/admin/quizzes')
    revalidatePath(`/admin/quizzes/${params.quizId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Không thể xoá quiz:', error)
    return NextResponse.json({ error: 'Không thể xoá quiz' }, { status: 500 })
  }
}

export async function GET(_request: Request, { params }: Params) {
  const quiz = await getQuizById(params.quizId)

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz không tồn tại' }, { status: 404 })
  }

  return NextResponse.json({ quiz })
}
