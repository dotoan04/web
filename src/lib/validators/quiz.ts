import { z } from 'zod'

export const quizStatusSchema = z.enum(['DRAFT', 'PUBLISHED'])

export const quizQuestionTypeSchema = z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATCHING', 'FILL_IN_BLANK'])

export const quizOptionInputSchema = z.object({
  id: z.string().cuid().optional(),
  text: z.string().default(''),
  imageUrl: z.string().optional(),
  isCorrect: z.boolean(),
  order: z.number().int().min(0).default(0),
}).refine((opt) => {
  // Must have either text or image
  const hasText = opt.text && opt.text.trim().length > 0
  const hasImage = opt.imageUrl && opt.imageUrl.trim().length > 0
  return hasText || hasImage
}, {
  message: 'Cần nội dung hoặc ảnh cho phương án',
})

export const quizQuestionInputSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, 'Câu hỏi không được bỏ trống'),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  type: quizQuestionTypeSchema.default('SINGLE_CHOICE'),
  order: z.number().int().min(0).default(0),
  points: z.number().int().min(0).default(1),
  explanation: z.string().optional(),
  // Allow 0 options for theory questions, 2+ for regular questions, or even number (4+) for matching questions
  options: z.array(quizOptionInputSchema),
}).refine(
  (data) => {
    if (data.type === 'MATCHING') {
      // Matching questions must have even number of options (pairs), minimum 4 (2 pairs)
      return data.options.length >= 4 && data.options.length % 2 === 0
    }
    if (data.type === 'FILL_IN_BLANK') {
      // Fill-in-blank questions need exactly 1 option with the correct answer
      return data.options.length === 1 && data.options[0]?.isCorrect === true
    }
    // Theory questions have 0 options, regular questions have 2+
    return data.options.length === 0 || data.options.length >= 2
  },
  {
    message: 'Câu ghép cặp cần ít nhất 4 phương án (2 cặp) và số chẵn. Câu điền từ cần 1 phương án đúng. Câu thường cần 0 (lý thuyết) hoặc ít nhất 2 phương án',
    path: ['options']
  }
)

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
