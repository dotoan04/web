import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'
import { getCurrentSession } from '@/lib/auth/session'
import { resolveSitePreferences } from '@/server/settings'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const preferences = await resolveSitePreferences()

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[18rem_1fr] lg:items-start lg:gap-8">
      <AdminSidebar siteName={preferences.siteName} />
      <div className="flex flex-col gap-6 lg:gap-8">
        <AdminTopbar user={session.user} />
        {children}
      </div>
    </div>
  )
}
