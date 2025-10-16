import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'

export const metadata = {
  title: 'Quản lý quiz',
}

export default async function AdminQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          submissions: true,
          questions: true,
        },
      },
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-2xl">Bài kiểm tra</CardTitle>
          <CardDescription>Quản lý các bài kiểm tra dành cho người đọc.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/quizzes/new">+ Tạo quiz</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
              <tr>
                <th className="py-3">Tiêu đề</th>
                <th className="py-3">Trạng thái</th>
                <th className="py-3">Thời lượng</th>
                <th className="py-3">Câu hỏi</th>
                <th className="py-3">Lượt làm</th>
                <th className="py-3">Cập nhật</th>
                <th className="py-3">Liên kết chia sẻ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="align-top text-ink-600 dark:text-ink-200">
                  <td className="py-3">
                    <div className="font-medium text-ink-800 dark:text-ink-100">{quiz.title}</div>
                    {quiz.description ? (
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{quiz.description}</p>
                    ) : null}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        quiz.status === 'PUBLISHED'
                          ? 'inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'
                          : 'inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700'
                      }
                    >
                      {quiz.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                    </span>
                  </td>
                  <td className="py-3">{Math.round(quiz.durationSeconds / 60)} phút</td>
                  <td className="py-3">{quiz._count.questions}</td>
                  <td className="py-3">{quiz._count.submissions}</td>
                  <td className="py-3 text-ink-400">{formatViDate(quiz.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <Link href={`/admin/quizzes/${quiz.id}`} className="text-sm text-primary-600 hover:underline">
                        Chỉnh sửa
                      </Link>
                      {quiz.status === 'PUBLISHED' ? (
                        <Link
                          href={`/doquizz/${quiz.slug}`}
                          className="text-sm text-emerald-600 hover:underline"
                          target="_blank"
                        >
                          Xem link chia sẻ
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-400">Chỉ chia sẻ khi xuất bản</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-ink-500 dark:text-ink-300">
                    Chưa có quiz nào. Hãy tạo quiz đầu tiên của bạn.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
