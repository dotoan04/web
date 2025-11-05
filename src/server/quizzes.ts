import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'
import { detectDeviceType, slugify } from '@/lib/utils'

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
    imageUrl?: string
    type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
    order: number
    points: number
    explanation?: string
    options: Array<{
      id?: string
      text: string
      imageUrl?: string
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
            imageUrl: question.imageUrl ?? null,
            type: question.type ?? 'SINGLE_CHOICE',
            order: question.order,
            points: question.points,
            explanation: question.explanation ?? null,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                imageUrl: option.imageUrl ?? null,
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
          imageUrl: question.imageUrl ?? null,
          type: question.type ?? 'SINGLE_CHOICE',
          order: question.order,
          points: question.points,
          explanation: question.explanation ?? null,
          options: {
            create: question.options.map((option) => ({
              text: option.text,
              imageUrl: option.imageUrl ?? null,
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
  participantName?: string
  answers: Record<string, string | string[]>
  durationSeconds?: number | null
  clientIp?: string | null
  userAgent?: string | null
  userInfo?: any | null
  correctCount?: number | null
  incorrectCount?: number | null
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
  let correctCount = 0

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
      correctCount += 1
    }
  })

  const normalizedCorrectCount = Math.min(correctCount, quiz.questions.length)
  const normalizedIncorrectCount =
    quiz.questions.length - normalizedCorrectCount

  // Detect device type from user agent
  const deviceType = input.userAgent ? detectDeviceType(input.userAgent) : null

  const submission = await prisma.quizSubmission.create({
    data: {
      quizId: quiz.id,
      participantName: input.participantName ?? null,
      answers: input.answers,
      score,
      totalPoints,
      correctCount: normalizedCorrectCount,
      incorrectCount: normalizedIncorrectCount,
      durationSeconds: input.durationSeconds ?? null,
      deviceType,
      clientIp: input.clientIp ?? null,
      userAgent: input.userAgent ?? null,
      userInfo: input.userInfo ?? null,
    },
  })

  return { submission, score, totalPoints }
}

export const listQuizSubmissions = (quizId: string) =>
  prisma.quizSubmission.findMany({
    where: { quizId },
    orderBy: { submittedAt: 'desc' },
  })
