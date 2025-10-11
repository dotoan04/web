import { redirect } from 'next/navigation'

import { TaxonomyManager } from '@/components/admin/taxonomy-manager'
import { getCurrentSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Quản lý thẻ',
}

export default async function TagsPage() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  })

  return (
    <TaxonomyManager
      type="tag"
      apiPath="/api/tags"
      title="Thẻ bài viết"
      description="Thẻ giúp nhóm những bài viết cùng ngữ cảnh lại với nhau."
      initialItems={tags}
    />
  )
}
