import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export type QuizWithRelations = Prisma.QuizGetPayload<{
  include: {
    questions: {
      include: {
        options: true
      }
      orderBy: { order: 'asc' }
    }
  }
}>

type UpsertQuizInput = {
  id?: string
  title: string
  slug?: string
  description?: string
  status?: 'DRAFT' | 'PUBLISHED'
  durationSeconds: number
  autoReleaseAt?: Date | null
  createdById: string
  questions: Array<{
    id?: string
    title: string
    content?: string
    type?: 'SINGLE_CHOICE'
    order: number
    points: number
    explanation?: string
    options: Array<{
      id?: string
      text: string
      isCorrect: boolean
      order: number
    }>
  }>
}

export const upsertQuiz = async (input: UpsertQuizInput) => {
  const normalizedSlugCandidate = input.slug ? slugify(input.slug) : slugify(input.title)
  const normalizedSlug = normalizedSlugCandidate || `quiz-${Date.now()}`

  if (input.questions.length === 0) {
    throw new Error('Quiz cần ít nhất một câu hỏi')
  }

  input.questions.forEach((question) => {
    const correctCount = question.options.filter((option) => option.isCorrect).length
    if (correctCount === 0) {
      throw new Error(`Câu hỏi "${question.title}" cần ít nhất một đáp án đúng`)
    }
  })

  if (input.id) {
    const quiz = await prisma.quiz.update({
      where: { id: input.id },
      data: {
        title: input.title,
        slug: normalizedSlug,
        description: input.description ?? null,
        status: input.status ?? 'DRAFT',
        durationSeconds: input.durationSeconds,
        autoReleaseAt: input.autoReleaseAt ?? null,
        questions: {
          deleteMany: { quizId: input.id },
          create: input.questions.map((question) => ({
            title: question.title,
            content: question.content ?? null,
            type: question.type ?? 'SINGLE_CHOICE',
            order: question.order,
            points: question.points,
            explanation: question.explanation ?? null,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: option.order,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })
    return quiz
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: input.title,
      slug: normalizedSlug,
      description: input.description ?? null,
      status: input.status ?? 'DRAFT',
      durationSeconds: input.durationSeconds,
      autoReleaseAt: input.autoReleaseAt ?? null,
      createdById: input.createdById,
      questions: {
        create: input.questions.map((question) => ({
          title: question.title,
          content: question.content ?? null,
          type: question.type ?? 'SINGLE_CHOICE',
          order: question.order,
          points: question.points,
          explanation: question.explanation ?? null,
          options: {
            create: question.options.map((option) => ({
              text: option.text,
              isCorrect: option.isCorrect,
              order: option.order,
            })),
          },
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })

  return quiz
}

export const deleteQuiz = (quizId: string) =>
  prisma.quiz.delete({
    where: { id: quizId },
  })

export const getQuizBySlug = (slug: string) =>
  prisma.quiz.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

export const getQuizById = (id: string) =>
  prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })

export const listQuizzes = () =>
  prisma.quiz.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
    },
  })

export const createSubmission = async (input: {
  quizId: string
  participant?: string
  answers: Record<string, string | string[]>
}) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: input.quizId },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  })

  if (!quiz || quiz.status !== 'PUBLISHED') {
    throw new Error('Quiz không tồn tại hoặc chưa sẵn sàng')
  }

  let score = 0
  let totalPoints = 0

  quiz.questions.forEach((question) => {
    totalPoints += question.points
    
    // Get all correct option IDs
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort()
    
    // Normalize submitted answer to array
    const submittedAnswer = input.answers[question.id]
    const submittedIds = (Array.isArray(submittedAnswer) ? submittedAnswer : submittedAnswer ? [submittedAnswer] : []).sort()
    
    // Check if submitted answers match exactly all correct answers
    const isCorrect =
      correctOptionIds.length === submittedIds.length &&
      correctOptionIds.every((id, index) => id === submittedIds[index])
    
    if (isCorrect) {
      score += question.points
    }
  })

  const submission = await prisma.quizSubmission.create({
    data: {
      quizId: quiz.id,
      participant: input.participant ?? null,
      answers: input.answers,
      score,
      totalPoints,
    },
  })

  return { submission, score, totalPoints }
}

export const listQuizSubmissions = (quizId: string) =>
  prisma.quizSubmission.findMany({
    where: { quizId },
    orderBy: { submittedAt: 'desc' },
  })
