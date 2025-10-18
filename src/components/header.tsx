'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { cn } from '@/components/ui/cn'

type HeaderProps = {
  siteName: string
}

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/chuyen-muc/tat-ca', label: 'Chuyên mục' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/tim-kiem', label: 'Tìm kiếm' },
]

export const Header = ({ siteName }: HeaderProps) => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const desktopNav = useMemo(
    () =>
      navLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'glass-button border-white/20 bg-white/20 px-3 py-1 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/20 dark:hover:bg-white/20',
            pathname === item.href && 'border-white/40 bg-white/40 text-ink-800 dark:border-white/20 dark:bg-white/20 dark:text-ink-100'
          )}
        >
          {item.label}
        </Link>
      )),
    [pathname]
  )

  return (
    <header className="relative z-[70] flex items-center justify-between glass-card border-white/20 bg-white/30 px-6 py-4 shadow-[0_8px_32px_rgba(31,38,135,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_8px_32px_rgba(31,38,135,0.25)]">
      <Link href="/" className="font-display text-xl text-ink-900 dark:text-ink-50">
        {siteName}
      </Link>
      <nav className="hidden items-center gap-4 text-sm text-ink-600 dark:text-ink-300 md:flex">
        {desktopNav}
        <UserMenu />
        <ThemeToggle />
      </nav>
      <div className="flex items-center gap-3 md:hidden">
        <ThemeToggle />
        <UserMenu />
        <button
          type="button"
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/30 text-ink-700 shadow-sm transition hover:border-white/40 hover:bg-white/40 dark:border-white/10 dark:bg-white/10 dark:text-ink-200 dark:hover:border-white/20 dark:hover:bg-white/20"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <Menu size={20} />
        </button>
      </div>
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="flex flex-col gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                'flex items-center justify-between rounded-2xl border border-ink-100 bg-white/80 px-4 py-3 text-base font-medium text-ink-700 shadow-sm transition hover:border-ink-200 hover:bg-white dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-200 dark:hover:border-ink-700',
                pathname === item.href && 'border-ink-200 bg-white text-ink-900 shadow-md dark:border-ink-600 dark:bg-ink-800/70 dark:text-ink-100'
              )}
            >
              {item.label}
              <span className="text-xs uppercase tracking-[0.3em] text-ink-300 dark:text-ink-600">Đi</span>
            </Link>
          ))}
          <div className="mt-4 rounded-2xl border border-ink-100/70 bg-white/70 p-4 shadow-sm dark:border-ink-800/60 dark:bg-ink-900/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-600 dark:text-ink-200">Chọn giao diện</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </MobileMenu>
    </header>
  )
}

