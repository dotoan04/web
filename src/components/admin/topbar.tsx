'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'
import { SmartImage } from '@/components/ui/smart-image'

type AdminTopbarProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  className?: string
}

export const AdminTopbar = ({ user, className }: AdminTopbarProps) => (
  <header
    className={cn(
      'flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white/80 px-5 py-4 shadow-[0_10px_40px_rgba(33,38,94,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_10px_40px_rgba(9,11,38,0.45)]',
      className,
    )}
  >
    <div className="space-y-1">
      <h1 className="font-display text-2xl text-ink-900 dark:text-ink-100">Xin chào, {user.name ?? 'tác giả'}!</h1>
      <p className="text-sm text-ink-500 dark:text-ink-300">Hãy để mỗi bài viết kể một câu chuyện riêng.</p>
    </div>
    <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
      <div className="flex flex-1 items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 px-3 py-2 sm:flex-none dark:border-ink-700 dark:bg-ink-800/60">
        {user.image ? (
          <SmartImage
            src={user.image}
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full object-cover"
            sizes="36px"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-200 text-sm font-semibold text-ink-700 dark:bg-ink-600 dark:text-ink-100">
            {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="leading-tight">
          <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{user.name ?? 'Người dùng'}</p>
          <p className="text-xs text-ink-500 dark:text-ink-300">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Tác giả'}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
        Đăng xuất
      </Button>
    </div>
  </header>
)
