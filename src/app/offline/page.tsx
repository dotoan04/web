import { PrefetchLink } from '@/components/ui/prefetch-link'
import { createDynamicMetadata } from '@/lib/metadata'
import { resolveSitePreferences } from '@/server/settings'

export async function generateMetadata() {
  return createDynamicMetadata({
    title: 'Ngoại tuyến',
    path: '/offline',
  })
}

export default async function OfflinePage() {
  const preferences = await resolveSitePreferences()
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100">Bạn đang ngoại tuyến</h1>
      <p className="max-w-md text-sm text-ink-600 dark:text-ink-300">
        Có vẻ như kết nối mạng đã bị gián đoạn. Khi trực tuyến trở lại, hãy tải lại trang để tiếp tục đọc câu chuyện từ {preferences.siteName}.
      </p>
      <PrefetchLink href="/" className="rounded-full bg-ink-900 px-4 py-2 text-sm text-ink-50 transition hover:bg-ink-700 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-ink-200">
        Quay về trang chủ
      </PrefetchLink>
    </main>
  )
}
