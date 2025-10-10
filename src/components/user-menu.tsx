'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Settings, FileText } from 'lucide-react'

export const UserMenu = () => {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (status === 'loading') {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-ink-200 dark:bg-ink-700" />
    )
  }

  if (!session?.user) {
    return (
      <Link
        href="/admin/sign-in"
        className="rounded-full px-3 py-1 transition hover:bg-ink-100/60 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-100"
      >
        Đăng nhập
      </Link>
    )
  }

  const userInitials = session.user.name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || session.user.email?.slice(0, 2).toUpperCase() || 'U'

  const avatarUrl = session.user.avatarUrl

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="relative z-[60]" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-50 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-ink-900 text-sm font-medium text-ink-50 transition hover:bg-ink-700 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-ink-200"
          aria-label="User menu"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={session.user.name || 'User'} className="h-full w-full object-cover" />
          ) : (
            userInitials
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 z-[60] w-56 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_20px_50px_rgba(27,20,14,0.15)] dark:border-ink-700 dark:bg-ink-800 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="border-b border-ink-100 p-4 dark:border-ink-700">
            <p className="font-medium text-ink-900 dark:text-ink-50">{session.user.name || 'User'}</p>
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{session.user.email}</p>
          </div>
          <div className="p-2">
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100/70 dark:text-ink-200 dark:hover:bg-ink-700/70"
            >
              <User size={16} />
              Hồ sơ cá nhân
            </Link>
            {session.user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100/70 dark:text-ink-200 dark:hover:bg-ink-700/70"
              >
                <Settings size={16} />
                Quản trị
              </Link>
            )}
            {(session.user.role === 'ADMIN' || session.user.role === 'AUTHOR') && (
              <Link
                href="/admin/posts"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100/70 dark:text-ink-200 dark:hover:bg-ink-700/70"
              >
                <FileText size={16} />
                Bài viết của tôi
              </Link>
            )}
          </div>
          <div className="border-t border-ink-100 p-2 dark:border-ink-700">
            <button
              onClick={() => {
                setIsOpen(false)
                void signOut({ callbackUrl: '/' })
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
        )}
      </div>
    </>
  )
}

