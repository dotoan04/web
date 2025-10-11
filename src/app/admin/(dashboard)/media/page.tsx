import { redirect } from 'next/navigation'

import { MediaLibrary } from '@/components/admin/media-library'
import { getCurrentSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Thư viện media',
}

export default async function MediaPage() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <MediaLibrary
      initialItems={media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
      uploaderId={session.user.id}
    />
  )
}
