import { z } from 'zod'

export const workExperienceSchema = z.object({
  company: z.string().min(1, 'Tên công ty là bắt buộc'),
  position: z.string().min(1, 'Chức vụ là bắt buộc'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
})

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>

