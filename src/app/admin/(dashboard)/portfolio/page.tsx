import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatViDate } from '@/lib/utils'

export const metadata = {
  title: 'Quản lý Portfolio',
}

export default async function PortfolioAdminPage() {
  const projects = await prisma.portfolioProject.findMany({
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle className="text-2xl">Portfolio</CardTitle>
        <Button asChild>
          <Link href="/admin/portfolio/new">+ Thêm dự án</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300">
              <tr>
                <th className="py-3">Dự án</th>
                <th className="py-3">Thời gian</th>
                <th className="py-3">Vai trò</th>
                <th className="py-3">Công nghệ</th>
                <th className="py-3">Thứ tự</th>
                <th className="py-3">Cập nhật</th>
                <th className="py-3">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {projects.map((project) => (
                <tr key={project.id} className="align-top text-ink-600 dark:text-ink-200">
                  <td className="py-3">
                    <div className="font-medium text-ink-800 dark:text-ink-100">{project.title}</div>
                    <p className="text-xs text-ink-400">/{project.slug}</p>
                    {project.summary ? (
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{project.summary}</p>
                    ) : null}
                  </td>
                  <td className="py-3">{project.timeline ?? '—'}</td>
                  <td className="py-3">{project.role ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} className="bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">{project.sortOrder}</td>
                  <td className="py-3 text-ink-400">{formatViDate(project.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button asChild variant="subtle" size="sm">
                        <Link href={`/admin/portfolio/${project.id}`}>Sửa</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/portfolio#${project.slug}`} target="_blank">
                          Xem
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-ink-500 dark:text-ink-300">
                    Chưa có dự án nào. Hãy thêm dự án mới để hiển thị trên trang Portfolio.
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
