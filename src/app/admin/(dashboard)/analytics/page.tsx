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
    <div className="space-y-6 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 md:text-3xl">Phân tích truy cập</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Theo dõi lượt truy cập và hành vi người dùng</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Lượt truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">
              {overview.totalVisits.toLocaleString('vi-VN')}
            </p>
            <p className="mt-2 text-xs text-ink-400 dark:text-ink-300">
              Tổng số lượt ghi nhận trong hệ thống
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Người ghé thăm duy nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">
              {overview.uniqueVisitors.toLocaleString('vi-VN')}
            </p>
            <p className="mt-2 text-xs text-ink-400 dark:text-ink-300">
              Dựa trên địa chỉ IP được ghi nhận
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ink-500 dark:text-ink-300">
              Nguồn phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.topSources.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-300">Chưa có dữ liệu nguồn truy cập</p>
            ) : (
              overview.topSources.map((item) => (
                <div key={item.source} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm dark:bg-ink-800/50">
                  <span className="truncate font-medium text-ink-700 dark:text-ink-200">{item.source}</span>
                  <Badge className="ml-2 bg-ink-900 text-ink-50 dark:bg-ink-600">
                    {item.count.toLocaleString('vi-VN')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-ink-100 bg-ink-50/50 dark:border-ink-800 dark:bg-ink-900/50">
          <CardTitle className="text-lg font-semibold">Lượt ghé thăm gần nhất</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overview.recentVisits.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-ink-500 dark:text-ink-300">
                Chưa có lượt truy cập nào được ghi nhận
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {overview.recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="rounded-xl border border-ink-200 bg-gradient-to-br from-white to-ink-50/50 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-ink-700 dark:from-ink-800 dark:to-ink-800/50"
                  >
                    <p className="mb-3 font-semibold text-ink-900 dark:text-ink-50">{visit.path}</p>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div className="col-span-2 flex justify-between gap-3 sm:col-span-1">
                        <dt className="font-medium text-ink-500 dark:text-ink-400">IP</dt>
                        <dd className="text-ink-700 dark:text-ink-200">{visit.ip}</dd>
                      </div>
                      <div className="col-span-2 flex justify-between gap-3 sm:col-span-1">
                        <dt className="font-medium text-ink-500 dark:text-ink-400">Nguồn</dt>
                        <dd className="truncate text-ink-700 dark:text-ink-200">{visit.source ?? 'Không xác định'}</dd>
                      </div>
                      <div className="col-span-2 flex justify-between gap-3 sm:col-span-1">
                        <dt className="font-medium text-ink-500 dark:text-ink-400">Nền tảng</dt>
                        <dd className="text-ink-700 dark:text-ink-200">{visit.platform}</dd>
                      </div>
                      <div className="col-span-2 flex justify-between gap-3 sm:col-span-1">
                        <dt className="font-medium text-ink-500 dark:text-ink-400">Thời gian</dt>
                        <dd className="text-ink-700 dark:text-ink-200">{formatDateTime(visit.createdAt)}</dd>
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <dt className="font-medium text-ink-500 dark:text-ink-400">Referrer</dt>
                        <dd className="truncate text-ink-700 dark:text-ink-200" title={visit.referrer ?? undefined}>
                          {visit.referrer ?? '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-ink-200 bg-ink-50/50 dark:border-ink-700 dark:bg-ink-900/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">Đường dẫn</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">IP</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">Nguồn</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">Nền tảng</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">Referrer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                      {overview.recentVisits.map((visit) => (
                        <tr key={visit.id} className="transition-colors hover:bg-ink-50/50 dark:hover:bg-ink-800/30">
                          <td className="px-4 py-3 font-medium text-ink-900 dark:text-ink-100">{visit.path}</td>
                          <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{visit.ip}</td>
                          <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{visit.source ?? 'Không xác định'}</td>
                          <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{visit.platform}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-ink-600 dark:text-ink-300" title={visit.referrer ?? undefined}>
                            {visit.referrer ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-500 dark:text-ink-400">
                            {formatDateTime(visit.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
