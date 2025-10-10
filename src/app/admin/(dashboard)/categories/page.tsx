import { redirect } from 'next/navigation'

import { TaxonomyManager } from '@/components/admin/taxonomy-manager'
import { getCurrentSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Quản lý chuyên mục | BlogVibe',
}

export default async function CategoriesPage() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  })

  return (
    <TaxonomyManager
      type="category"
      apiPath="/api/categories"
      title="Chuyên mục"
      description="Tổ chức các bài viết theo chủ đề giúp độc giả theo dõi dễ dàng hơn."
      initialItems={categories}
    />
  )
}
