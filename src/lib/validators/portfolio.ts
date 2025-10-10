import { z } from 'zod'

export const upsertPortfolioProjectSchema = z.object({
  title: z.string().min(2, 'Tiêu đề quá ngắn'),
  slug: z.string().min(2, 'Slug phải có ít nhất 2 ký tự'),
  summary: z.string().optional(),
  description: z.string().optional(),
  timeline: z.string().optional(),
  role: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  projectUrl: z
    .string()
    .url('Liên kết dự án không hợp lệ')
    .optional()
    .or(z.literal('')),
  repoUrl: z
    .string()
    .url('Liên kết mã nguồn không hợp lệ')
    .optional()
    .or(z.literal('')),
  sortOrder: z.coerce.number().int().optional(),
})

export type PortfolioProjectInput = z.infer<typeof upsertPortfolioProjectSchema>
