import { z } from 'zod'

export const siteSettingsSchema = z.object({
  siteName: z.string().min(2, 'Tên trang quá ngắn'),
  tabTitle: z.string().min(2, 'Tiêu đề tab quá ngắn'),
  slogan: z.string().optional(),
  heroIntro: z.string().optional(),
  heroCtaLabel: z.string().optional(),
  heroCtaLink: z
    .string()
    .url('Liên kết phải hợp lệ')
    .optional()
    .or(z.literal('')),
  ownerName: z.string().min(2, 'Tên hiển thị quá ngắn').optional(),
  ownerAge: z
    .number()
    .int()
    .min(10, 'Tuổi ít nhất phải từ 10 trở lên')
    .max(120, 'Tuổi tối đa là 120')
    .nullable()
    .optional(),
  ownerAvatarUrl: z
    .string()
    .url('Ảnh đại diện phải là đường dẫn hợp lệ')
    .nullable()
    .optional(),
  education: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  featuredBadges: z.array(z.string()).optional(),
  seoKeywords: z.array(z.string()).optional(),
  seoDescription: z.string().optional(),
  faviconUrl: z
    .string()
    .url('Favicon phải là đường dẫn hợp lệ')
    .nullable()
    .optional(),
  snowEffectEnabled: z.boolean().optional(),
  sakuraEffectEnabled: z.boolean().optional(),
})

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>
