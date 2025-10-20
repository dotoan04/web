import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'

export const metadata = {
  title: 'Quản lý Kinh nghiệm làm việc',
}

const formatDateRange = (startDate: Date, endDate: Date | null, isCurrent: boolean) => {
  const start = new Date(startDate).toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })
  if (isCurrent) return `${start} - Hiện tại`
  if (!endDate) return start
  const end = new Date(endDate).toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })
  return `${start} - ${end}`
}

export default async function WorkExperienceAdminPage() {
  const experiences = await prisma.workExperience.findMany({
    orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-2xl">Kinh nghiệm làm việc</CardTitle>
        <Button asChild>
          <Link href="/admin/work-experience/new">+ Thêm kinh nghiệm</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
              <tr>
                <th className="py-3">Công ty</th>
                <th className="py-3">Chức vụ</th>
                <th className="py-3">Thời gian</th>
                <th className="py-3">Địa điểm</th>
                <th className="py-3">Thứ tự</th>
                <th className="py-3">Cập nhật</th>
                <th className="py-3">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {experiences.map((experience) => (
                <tr key={experience.id} className="align-top text-ink-600 dark:text-ink-200">
                  <td className="py-3">
                    <div className="font-medium text-ink-800 dark:text-ink-100">{experience.company}</div>
                    {experience.description ? (
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-300 line-clamp-2">
                        {experience.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3">{experience.position}</td>
                  <td className="py-3">
                    {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
                  </td>
                  <td className="py-3">{experience.location ?? '—'}</td>
                  <td className="py-3">{experience.sortOrder}</td>
                  <td className="py-3 text-ink-400">{formatViDate(experience.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button asChild variant="subtle" size="sm">
                        <Link href={`/admin/work-experience/${experience.id}`}>Sửa</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-ink-500 dark:text-ink-300">
                    Chưa có kinh nghiệm nào. Hãy thêm kinh nghiệm làm việc để hiển thị trên trang Portfolio.
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

