import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentSession } from '@/lib/auth/session'
import { getAnalyticsOverview } from '@/server/analytics'

export const metadata = {
  title: 'Phân tích truy cập',
}

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value)

export default async function AnalyticsPage() {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  const overview = await getAnalyticsOverview()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Lượt truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl text-ink-900 dark:text-ink-50">
              {overview.totalVisits.toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-300">
              Tổng số lượt ghi nhận trong hệ thống.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Người ghé thăm duy nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl text-ink-900 dark:text-ink-50">
              {overview.uniqueVisitors.toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-300">
              Dựa trên địa chỉ IP được ghi nhận.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Nguồn phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.topSources.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-300">Chưa có dữ liệu nguồn truy cập.</p>
            ) : (
              overview.topSources.map((item) => (
                <div key={item.source} className="flex items-center justify-between text-sm">
                  <span>{item.source}</span>
                  <Badge className="bg-ink-900 text-ink-50 dark:bg-ink-600">
                    {item.count.toLocaleString('vi-VN')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lượt ghé thăm gần nhất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overview.recentVisits.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-300">
              Chưa có lượt truy cập nào được ghi nhận.
            </p>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {overview.recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="rounded-2xl border border-ink-100 bg-white/70 p-4 text-sm text-ink-600 shadow-sm dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200"
                  >
                    <p className="font-medium text-ink-800 dark:text-ink-100">{visit.path}</p>
                    <dl className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-400 dark:text-ink-300">IP</dt>
                        <dd className="text-right text-ink-500 dark:text-ink-200">{visit.ip}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-400 dark:text-ink-300">Nguồn</dt>
                        <dd className="text-right text-ink-500 dark:text-ink-200">{visit.source ?? 'Không xác định'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-400 dark:text-ink-300">Nền tảng</dt>
                        <dd className="text-right text-ink-500 dark:text-ink-200">{visit.platform}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-400 dark:text-ink-300">Referrer</dt>
                        <dd className="w-44 truncate text-right text-ink-500 dark:text-ink-200">{visit.referrer ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-400 dark:text-ink-300">Thời gian</dt>
                        <dd className="text-right text-ink-500 dark:text-ink-300">{formatDateTime(visit.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] table-auto text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-400 dark:text-ink-300">
                    <tr>
                      <th className="pb-3">Đường dẫn</th>
                      <th className="pb-3">IP</th>
                      <th className="pb-3">Nguồn</th>
                      <th className="pb-3">Nền tảng</th>
                      <th className="pb-3">Referrer</th>
                      <th className="pb-3 text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                    {overview.recentVisits.map((visit) => (
                      <tr key={visit.id} className="text-ink-600 dark:text-ink-200">
                        <td className="py-3 align-top font-medium text-ink-700 dark:text-ink-100">{visit.path}</td>
                        <td className="py-3 align-top">{visit.ip}</td>
                        <td className="py-3 align-top">{visit.source ?? 'Không xác định'}</td>
                        <td className="py-3 align-top">{visit.platform}</td>
                        <td className="py-3 align-top max-w-[220px] truncate" title={visit.referrer ?? undefined}>
                          {visit.referrer ?? '—'}
                        </td>
                        <td className="py-3 align-top text-right text-xs text-ink-400 dark:text-ink-300">
                          {formatDateTime(visit.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
