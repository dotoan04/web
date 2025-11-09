import type { ReactNode } from 'react'
import { Be_Vietnam_Pro } from 'next/font/google'

// Configure Be Vietnam Pro font for quiz pages
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  preload: true,
  variable: '--font-quiz',
})

export default function QuizLayout({ children }: { children: ReactNode }) {
  return <div className={beVietnamPro.className}>{children}</div>
}
