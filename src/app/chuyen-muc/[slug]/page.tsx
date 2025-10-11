import type { Metadata } from 'next'
import Link from 'next/link'

import { getCategoryWithPosts } from '@/server/categories'
import { formatViDate } from '@/lib/utils'
import { createDynamicMetadata, absoluteUrl } from '@/lib/metadata'
import { createBreadcrumbJsonLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/json-ld'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryWithPosts(params.slug)
  if (!category) {
    return createDynamicMetadata({
      title: 'Chuyên mục',
      path: `/chuyen-muc/${params.slug}`,
    })
  }
  return createDynamicMetadata({
    title: category.name,
    description: category.description ?? undefined,
    path: `/chuyen-muc/${category.slug}`,
  })
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategoryWithPosts(params.slug)

  if (!category) {
    return (
      <section className="space-y-6 rounded-[2.5rem] border border-ink-100 bg-white/70 p-10 text-center shadow-[0_20px_50px_rgba(33,38,94,0.12)]">
        <h1 className="font-display text-3xl text-ink-900">Chuyên mục đang cập nhật</h1>
        <p className="text-sm text-ink-500">
          Dữ liệu hiện chưa sẵn sàng hoặc cơ sở dữ liệu đang bảo trì. Vui lòng quay lại sau.
        </p>
      </section>
    )
  }

  const breadcrumb = createBreadcrumbJsonLd([
    { name: 'Trang chủ', url: absoluteUrl('/') },
    { name: 'Chuyên mục', url: absoluteUrl('/chuyen-muc/tat-ca') },
    { name: category.name, url: absoluteUrl(`/chuyen-muc/${category.slug}`) },
  ])

  return (
    <div className="space-y-10">
      <JsonLd data={breadcrumb} />
      <header className="rounded-[2.5rem] border border-ink-100 bg-white/70 p-10 shadow-[0_20px_50px_rgba(33,38,94,0.12)] dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_20px_50px_rgba(9,11,38,0.45)]">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Chuyên mục</p>
        <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100">{category.name}</h1>
        {category.description ? <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-300">{category.description}</p> : null}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {category.posts.map((post) => (
          <article key={post.id} className="rounded-3xl border border-ink-100 bg-white/80 p-6 shadow-[0_15px_40px_rgba(33,38,94,0.1)] dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-[0_15px_40px_rgba(9,11,38,0.45)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">
              <span>{formatViDate(post.publishedAt ?? post.createdAt)}</span>
              <span>{post.author?.name ?? 'Ẩn danh'}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl text-ink-900 dark:text-ink-100">
              <Link href={`/bai-viet/${post.slug}`} className="transition hover:text-ink-600 dark:hover:text-ink-200">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-3 text-sm text-ink-600 dark:text-ink-300">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-500 dark:text-ink-300">
              {post.tags.map((tag) => (
                <span key={tag.tagId} className="rounded-full bg-ink-100 px-3 py-1 dark:bg-ink-700/80 dark:text-ink-100">
                  #{tag.tag.name}
                </span>
              ))}
            </div>
          </article>
        ))}
        {category.posts.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-300">Chưa có bài viết nào trong chuyên mục này.</p>
        ) : null}
      </div>
    </div>
  )
}
