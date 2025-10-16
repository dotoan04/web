import { z } from 'zod'

export const quizStatusSchema = z.enum(['DRAFT', 'PUBLISHED'])

export const quizQuestionTypeSchema = z.enum(['SINGLE_CHOICE'])

export const quizOptionInputSchema = z.object({
  id: z.string().cuid().optional(),
  text: z.string().min(1, 'Phương án không được bỏ trống'),
  isCorrect: z.boolean(),
  order: z.number().int().min(0).default(0),
})

export const quizQuestionInputSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, 'Câu hỏi không được bỏ trống'),
  content: z.string().optional(),
  type: quizQuestionTypeSchema.default('SINGLE_CHOICE'),
  order: z.number().int().min(0).default(0),
  points: z.number().int().min(0).default(1),
  explanation: z.string().optional(),
  options: z.array(quizOptionInputSchema).min(2, 'Cần ít nhất 2 phương án'),
})

export const quizInputSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(3, 'Tiêu đề cần ít nhất 3 ký tự'),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: quizStatusSchema.default('DRAFT'),
  durationSeconds: z.number().int().min(30, 'Thời gian tối thiểu là 30 giây'),
  autoReleaseAt: z.string().datetime().optional().nullable(),
  questions: z.array(quizQuestionInputSchema).min(1, 'Cần ít nhất một câu hỏi'),
})

export type QuizInput = z.infer<typeof quizInputSchema>
