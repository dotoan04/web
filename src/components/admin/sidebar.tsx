'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Briefcase,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  PenSquare,
  Settings,
  Tags,
} from 'lucide-react'

import { cn } from '@/components/ui/cn'

const links = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Phân tích', icon: BarChart3 },
  { href: '/admin/posts', label: 'Bài viết', icon: PenSquare },
  { href: '/admin/categories', label: 'Chuyên mục', icon: FolderTree },
  { href: '/admin/tags', label: 'Thẻ', icon: Tags },
  { href: '/admin/media', label: 'Thư viện hình', icon: ImageIcon },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
]

type AdminSidebarProps = {
  siteName: string
}

export const AdminSidebar = ({ siteName }: AdminSidebarProps) => {
  const pathname = usePathname()

  return (
    <aside className="flex w-full flex-col justify-between rounded-3xl border border-ink-100 bg-white/70 p-5 shadow-[0_10px_40px_rgba(33,38,94,0.1)] backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_10px_40px_rgba(9,11,38,0.45)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64 lg:p-6">
      <div className="flex flex-col gap-6 lg:gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">{siteName}</p>
          <p className="font-display text-xl text-ink-800 dark:text-ink-100">Bảng điều khiển</p>
        </div>
        <nav className="flex flex-wrap gap-2 lg:flex-col">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors lg:flex-none',
                  active
                    ? 'bg-ink-800 text-ink-50 shadow-lg dark:bg-ink-600/80'
                    : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-ink-700/70 dark:hover:text-ink-100',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
      <p className="text-xs text-ink-400 dark:text-ink-300">Viết đều đặn - sống chậm - học chăm.</p>
    </aside>
  )
}
