import { z } from 'zod'

export const postInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Tiêu đề cần ít nhất 3 ký tự'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  tagIds: z.array(z.string().cuid()).optional().default([]),
  categoryId: z.string().cuid().nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.string().optional(),
  authorId: z.string().cuid(),
  coverImageId: z.string().cuid().nullable().optional(),
})

export type PostInput = z.infer<typeof postInputSchema>
