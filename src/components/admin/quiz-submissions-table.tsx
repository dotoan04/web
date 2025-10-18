import { memo } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatViDate } from '@/lib/utils'

type Submission = {
  id: string
  participantName: string | null
  correctCount: number
  incorrectCount: number
  score: number
  totalPoints: number
  durationSeconds: number | null
  deviceType: string | null
  clientIp: string | null
  submittedAt: Date
}

type SubmissionTableProps = {
  submissions: Submission[]
  quizTitle: string
  totalQuestions: number
}

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

const SubmissionTableComponent = ({ submissions, quizTitle, totalQuestions }: SubmissionTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Lịch sử làm bài</CardTitle>
      <CardDescription>
        Tổng cộng {submissions.length} lượt nộp cho &ldquo;{quizTitle}&rdquo;
      </CardDescription>
    </CardHeader>
    <CardContent>
      {submissions.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">Chưa có lượt làm nào cho bài kiểm tra này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
              <tr>
                <th className="py-3">Tên người làm</th>
                <th className="py-3">Điểm</th>
                <th className="py-3">Đúng/Sai</th>
                <th className="py-3">Thời gian làm</th>
                <th className="py-3">Thiết bị</th>
                <th className="py-3">IP</th>
                <th className="py-3">Nộp lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {submissions.map((submission) => (
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
                    {submission.correctCount}/{totalQuestions} đúng · {submission.incorrectCount} sai
                  </td>
                  <td className="py-3">{formatDuration(submission.durationSeconds)}</td>
                  <td className="py-3">{formatDevice(submission.deviceType)}</td>
                  <td className="py-3 font-mono text-xs text-ink-500 dark:text-ink-400">
                    {submission.clientIp || '--'}
                  </td>
                  <td className="py-3 text-ink-400">{formatViDate(submission.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
)

export const SubmissionTable = memo(SubmissionTableComponent)

SubmissionTable.displayName = 'SubmissionTable'
