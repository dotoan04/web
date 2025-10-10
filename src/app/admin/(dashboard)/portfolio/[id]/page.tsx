import { notFound, redirect } from 'next/navigation'

import { PortfolioForm } from '@/components/admin/portfolio-form'
import { getCurrentSession } from '@/lib/auth/session'
import { getPortfolioProjectById } from '@/server/portfolio'

type PageProps = {
  params: {
    id: string
  }
}

export const metadata = {
  title: 'Chỉnh sửa dự án | BlogVibe',
}

export default async function EditPortfolioProjectPage({ params }: PageProps) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  const project = await getPortfolioProjectById(params.id)

  if (!project) {
    notFound()
  }

  return <PortfolioForm project={project} />
}
