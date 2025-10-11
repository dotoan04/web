'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'

import type { PostWithRelations } from '@/server/posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatViDate } from '@/lib/utils'

type PostRow = PostWithRelations

type AdminPostTableProps = {
  initialPosts: PostRow[]
}

export const AdminPostTable = ({ initialPosts }: AdminPostTableProps) => {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = useCallback(async (postId: string, title: string) => {
    if (deletingId) return
    const confirmed = window.confirm(`Xoá bài viết "${title}"?
Thao tác này không thể hoàn tác.`)
    if (!confirmed) return

    setDeletingId(postId)
    setMessage(null)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Không thể xoá bài viết')
      }

      setPosts((prev) => prev.filter((item) => item.id !== postId))
      setMessage('Đã xoá bài viết thành công.')
    } catch (error) {
      console.error('Delete post failed:', error)
      setMessage((error as Error).message)
    } finally {
      setDeletingId(null)
    }
  }, [deletingId])

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-100 bg-white/70 p-8 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
        Chưa có bài viết nào. Hãy bắt đầu với nút “Viết bài mới”.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-ink-500 dark:text-ink-300">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
            <tr>
              <th className="py-3">Tiêu đề</th>
              <th className="py-3">Chuyên mục</th>
              <th className="py-3">Thẻ</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Cập nhật</th>
              <th className="py-3 text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
            {posts.map((post) => (
              <tr key={post.id} className="align-top">
                <td className="py-3">
                  <div className="font-medium text-ink-800 dark:text-ink-100">{post.title}</div>
                  <p className="text-xs text-ink-400 dark:text-ink-500">{post.author?.name ?? 'Ẩn danh'}</p>
                </td>
                <td className="py-3 text-ink-500 dark:text-ink-300">{post.category?.name ?? '—'}</td>
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
                <td className="py-3 text-ink-400 dark:text-ink-500">{formatViDate(post.updatedAt)}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="subtle" size="sm">
                      <Link href={`/admin/posts/${post.id}`}>Sửa</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/bai-viet/${post.slug}`} target="_blank">
                        Xem
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === post.id}
                      onClick={() => handleDelete(post.id, post.title)}
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      {deletingId === post.id ? 'Đang xoá…' : 'Xoá'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
