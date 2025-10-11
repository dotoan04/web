import { createDynamicMetadata } from '@/lib/metadata'
import { resolveSitePreferences } from '@/server/settings'
import { SearchClient } from '@/components/search/search-client'

export async function generateMetadata() {
  return createDynamicMetadata({
    title: 'Tìm kiếm',
    description: 'Khám phá nhanh các bài viết, chủ đề và thẻ trên trang.',
    path: '/tim-kiem',
  })
}

export default async function SearchPage() {
  const preferences = await resolveSitePreferences()
  return (
    <section className="mx-auto w-full max-w-5xl">
      <SearchClient siteName={preferences.siteName} />
    </section>
  )
}
