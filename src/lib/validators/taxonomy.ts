import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2, 'Tên chuyên mục quá ngắn'),
  description: z.string().optional(),
})

export const tagSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2, 'Tên thẻ quá ngắn'),
  description: z.string().optional(),
})
