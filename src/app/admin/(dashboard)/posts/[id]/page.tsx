import { notFound, redirect } from 'next/navigation'

import { PostEditor } from '@/components/admin/post-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentSession } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { getCategoryOptions } from '@/server/categories'
import { getTagOptions } from '@/server/tags'

type Params = {
  params: {
    id: string
  }
}

export default async function EditPostPage({ params }: Params) {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      coverImage: true,
    },
  })

  if (!post) {
    notFound()
  }

  const [categories, tags] = await Promise.all([getCategoryOptions(), getTagOptions()])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉnh sửa bài viết</CardTitle>
        <CardDescription>Cập nhật lại nội dung cho bài viết này.</CardDescription>
      </CardHeader>
      <CardContent>
        <PostEditor authorId={session.user.id} categories={categories} tags={tags} defaultValues={post} />
      </CardContent>
    </Card>
  )
}
