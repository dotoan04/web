import { redirect } from 'next/navigation'

import { PortfolioForm } from '@/components/admin/portfolio-form'
import { getCurrentSession } from '@/lib/auth/session'

export const metadata = {
  title: 'Thêm dự án Portfolio | BlogVibe',
}

export default async function NewPortfolioProjectPage() {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  return <PortfolioForm />
}
