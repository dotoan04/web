import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'

export const metadata = {
  title: 'Tổng quan quản trị | BlogVibe',
}

export default async function AdminDashboardPage() {
  const [postsCount, publishedCount, pendingCount, latestPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: { in: ['DRAFT', 'SCHEDULED'] } } }),
    prisma.post.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        author: true,
        category: true,
      },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tổng số bài</CardTitle>
            <CardDescription>Số bài viết đang có trong hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display text-ink-900">{postsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Đã xuất bản</CardTitle>
            <CardDescription>Số bài đang hiển thị trên trang blog.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display text-ink-900">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cần xử lý</CardTitle>
            <CardDescription>Bài nháp và bài hẹn giờ xuất bản.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display text-ink-900">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>5 bài viết cập nhật mới nhất.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-ink-100">
            {latestPosts.map((post) => (
              <li key={post.id} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/admin/posts/${post.id}`} className="font-medium text-ink-800 hover:text-ink-600">
                    {post.title}
                  </Link>
                  <p className="text-sm text-ink-400">
                    {post.author?.name ?? 'Không rõ tác giả'} · {formatViDate(post.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{post.status === 'PUBLISHED' ? 'Đã xuất bản' : post.status === 'SCHEDULED' ? 'Hẹn giờ' : 'Bản nháp'}</Badge>
                  {post.category ? <Badge className="bg-ink-800 text-ink-50">{post.category.name}</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
