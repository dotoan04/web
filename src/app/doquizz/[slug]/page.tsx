import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { QuizPlayground } from '@/components/quiz/quiz-playground'
import { absoluteUrl } from '@/lib/metadata'
import { getQuizBySlug } from '@/server/quizzes'

type Params = {
  params: {
    slug: string
  }
}

const serializeQuiz = (quiz: Awaited<ReturnType<typeof getQuizBySlug>>) => {
  if (!quiz) return null

  return {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    status: quiz.status,
    durationSeconds: quiz.durationSeconds,
    autoReleaseAt: quiz.autoReleaseAt?.toISOString() ?? null,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    questions: quiz.questions
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        id: question.id,
        title: question.title,
        content: question.content,
        type: question.type,
        order: question.order,
        points: question.points,
        explanation: question.explanation,
        options: question.options
          .sort((a, b) => a.order - b.order)
          .map((option) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            order: option.order,
          })),
      })),
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const quiz = await getQuizBySlug(params.slug)

  if (!quiz || quiz.status !== 'PUBLISHED' || (quiz.autoReleaseAt && quiz.autoReleaseAt > new Date())) {
    return {
      title: 'Bài kiểm tra không khả dụng',
    }
  }

  const description = quiz.description ?? `Bài kiểm tra "${quiz.title}" trên BlogVibe Coding.`

  return {
    title: `Làm bài: ${quiz.title}`,
    description,
    openGraph: {
      title: `Làm bài: ${quiz.title}`,
      description,
      url: absoluteUrl(`/doquizz/${quiz.slug}`),
    },
  }
}

export default async function QuizPage({ params }: Params) {
  const quiz = await getQuizBySlug(params.slug)

  if (!quiz || quiz.status !== 'PUBLISHED' || (quiz.autoReleaseAt && quiz.autoReleaseAt > new Date())) {
    notFound()
  }

  const serialized = serializeQuiz(quiz)

  if (!serialized) {
    notFound()
  }

  return <QuizPlayground quiz={serialized} />
}
