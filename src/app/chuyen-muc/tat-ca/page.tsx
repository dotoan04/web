import Link from 'next/link'

import { listCategories } from '@/server/categories'
import { createDynamicMetadata } from '@/lib/metadata'

export async function generateMetadata() {
  return createDynamicMetadata({
    title: 'Tất cả chuyên mục',
    path: '/chuyen-muc/tat-ca',
  })
}

export default async function AllCategoriesPage() {
  const categories = await listCategories()

  return (
    <section className="space-y-8">
      <header className="rounded-[2.5rem] border border-ink-100 bg-white/70 p-10 shadow-[0_20px_50px_rgba(33,38,94,0.12)] dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_20px_50px_rgba(9,11,38,0.45)]">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Chuyên mục</p>
        <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100">Khám phá các chủ đề</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-300">
          Lướt qua các góc nhìn khác nhau: đời sống, công nghệ và câu chuyện nghề nghiệp.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/chuyen-muc/${category.slug}`}
            className="rounded-3xl border border-ink-100 bg-white/80 p-6 shadow-[0_15px_40px_rgba(33,38,94,0.1)] transition hover:-translate-y-1 dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-[0_15px_40px_rgba(9,11,38,0.45)]"
          >
            <h2 className="font-display text-2xl text-ink-900 dark:text-ink-100">{category.name}</h2>
            {category.description ? <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{category.description}</p> : null}
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Đọc các bài viết →</p>
          </Link>
        ))}
        {categories.length === 0 ? <p className="text-sm text-ink-500 dark:text-ink-300">Chưa có chuyên mục nào.</p> : null}
      </div>
    </section>
  )
}
