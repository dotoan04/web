import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'
import { formatUserInfoForDisplay, type UserInfo } from '@/lib/user-info'

const formatDuration = (input: number | null) => {
  if (!input || input <= 0) return '--'
  const minutes = Math.floor(input / 60)
  const seconds = input % 60
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const formatDevice = (deviceType: string | null) => {
  if (!deviceType) return 'Không rõ'
  if (deviceType === 'mobile') return 'Điện thoại'
  if (deviceType === 'tablet') return 'Máy tính bảng'
  if (deviceType === 'desktop') return 'Máy tính'
  return deviceType
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string; month?: string; day?: string }>
}

export default async function QuizHistoryPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { year, month, day } = await searchParams

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  })

  if (!quiz) return notFound()

  const submissions = await prisma.quizSubmission.findMany({
    where: { quizId: id },
    orderBy: { submittedAt: 'desc' },
  })

  // Filter submissions based on date parameters
  let filteredSubmissions = submissions

  if (year) {
    const yearNum = parseInt(year, 10)
    filteredSubmissions = filteredSubmissions.filter((sub) => sub.submittedAt.getFullYear() === yearNum)

    if (month) {
      const monthNum = parseInt(month, 10) - 1 // 0-indexed
      filteredSubmissions = filteredSubmissions.filter((sub) => sub.submittedAt.getMonth() === monthNum)

      if (day) {
        const dayNum = parseInt(day, 10)
        filteredSubmissions = filteredSubmissions.filter((sub) => sub.submittedAt.getDate() === dayNum)
      }
    }
  }

  // Get unique years, months from all submissions for filter options
  const availableYears = Array.from(new Set(submissions.map((sub) => sub.submittedAt.getFullYear()))).sort(
    (a, b) => b - a,
  )

  const availableMonths =
    year && availableYears.includes(parseInt(year, 10))
      ? Array.from(
          new Set(
            submissions
              .filter((sub) => sub.submittedAt.getFullYear() === parseInt(year, 10))
              .map((sub) => sub.submittedAt.getMonth()),
          ),
        ).sort((a, b) => a - b)
      : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/quizzes/${id}`}>← Quay lại</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lịch sử làm bài</CardTitle>
          <CardDescription>
            Tổng cộng {filteredSubmissions.length} lượt nộp cho &ldquo;{quiz.title}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Filters */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/quizzes/${id}/history`}
              className={`rounded-md px-3 py-1.5 text-sm ${!year ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-200'}`}
            >
              Tất cả
            </Link>

            {availableYears.map((y) => (
              <Link
                key={y}
                href={`/admin/quizzes/${id}/history?year=${y}`}
                className={`rounded-md px-3 py-1.5 text-sm ${year === String(y) && !month ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-200'}`}
              >
                Năm {y}
              </Link>
            ))}

            {availableMonths.length > 0 && (
              <>
                <span className="self-center text-sm text-ink-400">|</span>
                {availableMonths.map((m) => (
                  <Link
                    key={m}
                    href={`/admin/quizzes/${id}/history?year=${year}&month=${m + 1}`}
                    className={`rounded-md px-3 py-1.5 text-sm ${month === String(m + 1) ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-200'}`}
                  >
                    Tháng {m + 1}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-300">
              {year || month ? 'Không có lượt làm nào trong khoảng thời gian này.' : 'Chưa có lượt làm nào.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
                  <tr>
                    <th className="py-3">Tên người làm</th>
                    <th className="py-3">Điểm</th>
                    <th className="py-3">Đúng/Sai</th>
                    <th className="py-3">Thời gian</th>
                    <th className="py-3">Thiết bị</th>
                    <th className="py-3">Thông tin kỹ thuật</th>
                    <th className="py-3">IP</th>
                    <th className="py-3">Nộp lúc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                  {filteredSubmissions.map((submission) => {
                    const userInfo = submission.userInfo as UserInfo | null
                    const userInfoLines = userInfo ? formatUserInfoForDisplay(userInfo) : []
                    
                    return (
                      <tr key={submission.id} className="align-top text-ink-600 dark:text-ink-200">
                        <td className="py-3 font-medium text-ink-800 dark:text-ink-100">
                          {submission.participantName || 'Anonymous'}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {submission.score}/{submission.totalPoints}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-emerald-600 dark:text-emerald-400">{submission.correctCount}</span>
                          {' / '}
                          <span className="text-rose-600 dark:text-rose-400">{submission.incorrectCount}</span>
                        </td>
                        <td className="py-3 text-ink-500">{formatDuration(submission.durationSeconds)}</td>
                        <td className="py-3 text-ink-500">{formatDevice(submission.deviceType)}</td>
                        <td className="py-3">
                          {userInfoLines.length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                                Xem chi tiết
                              </summary>
                              <div className="mt-2 space-y-1 rounded-md bg-ink-50 p-3 text-xs dark:bg-ink-800">
                                {userInfoLines.map((line, idx) => (
                                  <div key={idx} className="font-mono text-ink-700 dark:text-ink-300">
                                    {line}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <span className="text-xs text-ink-400">Không có dữ liệu</span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-xs text-ink-400">
                          {submission.clientIp || '--'}
                        </td>
                        <td className="py-3 text-ink-400">{formatViDate(submission.submittedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
