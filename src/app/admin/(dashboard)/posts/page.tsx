import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'

export const metadata = {
  title: 'Quản lý bài viết | BlogVibe',
}

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-2xl">Bài viết</CardTitle>
        <Button asChild>
          <Link href="/admin/posts/new">+ Viết bài mới</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="py-3">Tiêu đề</th>
                <th className="py-3">Chuyên mục</th>
                <th className="py-3">Thẻ</th>
                <th className="py-3">Trạng thái</th>
                <th className="py-3">Cập nhật</th>
                <th className="py-3">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {posts.map((post) => (
                <tr key={post.id} className="align-top">
                  <td className="py-3">
                    <div className="font-medium text-ink-800">{post.title}</div>
                    <p className="text-xs text-ink-400">{post.author?.name ?? 'Ẩn danh'}</p>
                  </td>
                  <td className="py-3 text-ink-500">{post.category?.name ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag.tagId}>{tag.tag.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge
                      className={
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-500 text-white'
                          : post.status === 'SCHEDULED'
                            ? 'bg-amber-400 text-ink-900'
                            : 'bg-ink-100 text-ink-600'
                      }
                    >
                      {post.status === 'PUBLISHED'
                        ? 'Đã xuất bản'
                        : post.status === 'SCHEDULED'
                          ? 'Hẹn giờ'
                          : 'Bản nháp'}
                    </Badge>
                  </td>
                  <td className="py-3 text-ink-400">{formatViDate(post.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button asChild variant="subtle" size="sm">
                        <Link href={`/admin/posts/${post.id}`}>Sửa</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/bai-viet/${post.slug}`} target="_blank">
                          Xem
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
