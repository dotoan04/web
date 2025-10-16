import { notFound, redirect } from 'next/navigation'

import { QuizForm } from '@/components/admin/quiz-form'
import { getCurrentSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

type Params = {
  params: {
    id: string
  }
}

export default async function EditQuizPage({ params }: Params) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!quiz) {
    notFound()
  }

  return (
    <QuizForm
      quiz={{
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description ?? '',
        status: quiz.status,
        durationSeconds: quiz.durationSeconds,
        autoReleaseAt: quiz.autoReleaseAt ? new Date(quiz.autoReleaseAt).toISOString().slice(0, 16) : '',
        questions: quiz.questions.map((question) => ({
          id: question.id,
          title: question.title,
          content: question.content ?? '',
          type: question.type,
          order: question.order,
          points: question.points,
          explanation: question.explanation ?? '',
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            order: option.order,
          })),
        })),
      }}
    />
  )
}
