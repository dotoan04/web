import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminPostTable } from '@/components/admin/post-table'
import { listAdminPosts } from '@/server/posts'

export const metadata = {
  title: 'Quản lý bài viết',
}

export default async function AdminPostsPage() {
  const posts = await listAdminPosts()

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-2xl">Bài viết</CardTitle>
        <Button asChild>
          <Link href="/admin/posts/new">+ Viết bài mới</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <AdminPostTable initialPosts={posts} />
      </CardContent>
    </Card>
  )
}
