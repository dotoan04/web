import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const formatViDate = (date: Date | string | null | undefined) => {
  if (!date) return ''
  return format(new Date(date), "dd 'tháng' MM, yyyy", { locale: vi })
}

export const estimateReadingTime = (plainText: string) => {
  const words = plainText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 180))
}
