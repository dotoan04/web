import type { Metadata } from 'next'

import { createMetadata } from '@/lib/metadata'
import { SearchClient } from '@/components/search/search-client'

export const metadata: Metadata = createMetadata({
  title: 'Tìm kiếm',
  description: 'Khám phá nhanh các bài viết, chủ đề và thẻ trên BlogVibe.',
  path: '/tim-kiem',
})

export default function SearchPage() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <SearchClient />
    </section>
  )
}
