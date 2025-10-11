import { redirect } from 'next/navigation'

import { PostEditor } from '@/components/admin/post-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentSession } from '@/lib/auth/session'
import { getCategoryOptions } from '@/server/categories'
import { getTagOptions } from '@/server/tags'

export const metadata = {
  title: 'Viết bài mới',
}

export default async function NewPostPage() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const [categories, tags] = await Promise.all([getCategoryOptions(), getTagOptions()])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo bài viết mới</CardTitle>
        <CardDescription>Chia sẻ câu chuyện của bạn tới cộng đồng BlogVibe.</CardDescription>
      </CardHeader>
      <CardContent>
        {(categories.length === 0 || tags.length === 0) && (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Không tìm thấy dữ liệu chuyên mục hoặc thẻ. Vui lòng đảm bảo cơ sở dữ liệu đang hoạt động và đã chạy
            lệnh <code className="rounded bg-amber-100 px-1">npm run setup</code> để seed dữ liệu ban đầu.
          </p>
        )}
        <PostEditor authorId={session.user.id} categories={categories} tags={tags} />
      </CardContent>
    </Card>
  )
}
