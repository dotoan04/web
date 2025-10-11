'use client'

import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'

type HeaderProps = {
  siteName: string
}

export const Header = ({ siteName }: HeaderProps) => {
  return (
    <header className="relative z-[70] flex items-center justify-between rounded-full border border-ink-100 bg-white/85 px-6 py-4 shadow-[0_12px_35px_rgba(33,38,94,0.12)] backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/70">
      <Link href="/" className="font-display text-xl text-ink-900 dark:text-ink-50">
        {siteName}
      </Link>
      <nav className="hidden items-center gap-4 text-sm text-ink-600 dark:text-ink-300 md:flex">
        <Link href="/" className="rounded-full px-3 py-1 transition hover:bg-ink-100/60 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-100">
          Trang chủ
        </Link>
        <Link href="/chuyen-muc/tat-ca" className="rounded-full px-3 py-1 transition hover:bg-ink-100/60 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-100">
          Chuyên mục
        </Link>
        <Link href="/portfolio" className="rounded-full px-3 py-1 transition hover:bg-ink-100/60 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-100">
          Portfolio
        </Link>
        <Link href="/tim-kiem" className="rounded-full px-3 py-1 transition hover:bg-ink-100/60 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-100">
          Tìm kiếm
        </Link>
        <UserMenu />
        <ThemeToggle />
      </nav>
      <div className="md:hidden">
        <ThemeToggle />
      </div>
    </header>
  )
}

