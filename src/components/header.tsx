'use client'

import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'

type HeaderProps = {
  siteName: string
}

export const Header = ({ siteName }: HeaderProps) => {
  return (
    <header className="relative z-[70] flex items-center justify-between glass-card border-white/20 bg-white/30 px-6 py-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_8px_32px_rgba(31,38,135,0.25)]">
      <Link href="/" className="font-display text-xl text-ink-900 dark:text-ink-50">
        {siteName}
      </Link>
      <nav className="hidden items-center gap-4 text-sm text-ink-600 dark:text-ink-300 md:flex">
        <Link href="/" className="glass-button border-white/20 bg-white/20 px-3 py-1 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20">
          Trang chủ
        </Link>
        <Link href="/chuyen-muc/tat-ca" className="glass-button border-white/20 bg-white/20 px-3 py-1 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20">
          Chuyên mục
        </Link>
        <Link href="/portfolio" className="glass-button border-white/20 bg-white/20 px-3 py-1 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20">
          Portfolio
        </Link>
        <Link href="/tim-kiem" className="glass-button border-white/20 bg-white/20 px-3 py-1 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20">
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

