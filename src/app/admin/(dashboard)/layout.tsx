import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'
import { getCurrentSession } from '@/lib/auth/session'

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

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <AdminSidebar />
      <div className="flex flex-col gap-6">
        <AdminTopbar user={session.user} />
        {children}
      </div>
    </div>
  )
}
