import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { renderRichText } from '@/lib/render-html'
import { formatViDate } from '@/lib/utils'
import { ReadingProgress } from '@/components/reading-progress'
import { SmartImage } from '@/components/ui/smart-image'
import { getPostBySlug, getRelatedPosts } from '@/server/posts'
import { absoluteUrl, createMetadata } from '@/lib/metadata'
import { createArticleJsonLd, createBreadcrumbJsonLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/json-ld'
import { cn } from '@/components/ui/cn'
import { Badge } from '@/components/ui/badge'
import { PrefetchLink } from '@/components/ui/prefetch-link'

const TableOfContents = dynamic(() => import('@/components/table-of-contents'), {
  ssr: false,
  loading: () => null,
})

const CodeBlockClient = dynamic(() => import('@/components/code-block-client'), {
  ssr: false,
  loading: () => null,
})

const GiscusThread = dynamic(() => import('@/components/comments/giscus-thread'), {
  ssr: false,
  loading: () => null,
})

type Props = {
  params: { slug: string }
}

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) {
    return createMetadata({
      title: 'Bài viết',
      path: `/bai-viet/${params.slug}`,
    })
  }
  return createMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `/bai-viet/${post.slug}`,
    image: `/og?title=${encodeURIComponent(post.title)}`,
    type: 'article',
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt.toISOString(),
    authors: post.author?.name ? [post.author.name] : undefined,
  })
}

export default async function PostDetailPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  const { html, headings } = await renderRichText(post.content as Record<string, unknown>)
  const relatedPosts = await getRelatedPosts(post.slug)
  const breadcrumb = createBreadcrumbJsonLd([
    { name: 'Trang chủ', url: absoluteUrl('/') },
    ...(post.category
      ? [{ name: post.category.name, url: absoluteUrl(`/chuyen-muc/${post.category.slug}`) }]
      : []),
    { name: post.title, url: absoluteUrl(`/bai-viet/${post.slug}`) },
  ])
  const article = createArticleJsonLd({
    title: post.title,
    description: post.excerpt,
    slug: post.slug,
    publishedAt: post.publishedAt ?? post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.author?.name,
    coverImage: post.coverImage?.url ?? null,
    tags: post.tags.map((item) => item.tag.name),
  })
  const hasHeadings = headings.length > 0

  return (
    <article className="mx-auto w-full max-w-6xl px-6 py-12">
      <ReadingProgress />
      <CodeBlockClient />
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      <div className={cn('grid gap-12', hasHeadings && 'lg:grid-cols-[minmax(0,1fr)_18rem]')}>
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">{post.category?.name ?? 'Không phân loại'}</p>
            <h1 className="font-display text-4xl text-ink-900 dark:text-ink-100">{post.title}</h1>
            <p className="text-sm text-ink-500 dark:text-ink-300">
              {formatViDate(post.publishedAt ?? post.createdAt)} · {post.readingTime ?? 3} phút đọc · {post.author?.name ?? 'Ẩn danh'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-ink-500 dark:text-ink-300">
              {post.tags.map((item) => (
                <span key={item.tagId} className="rounded-full bg-ink-100 px-3 py-1 dark:bg-ink-700/80 dark:text-ink-100">
                  #{item.tag.name}
                </span>
              ))}
            </div>
          </header>

          {post.coverImage?.url ? (
            <div className="relative h-80 w-full overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(27,20,14,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <SmartImage
                src={post.coverImage.url}
                alt={post.coverImage.alt ?? post.title}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 800px, 100vw"
              />
            </div>
          ) : null}

          <div
            className="prose prose-lg prose-ink mx-auto max-w-none text-ink-800 dark:text-ink-100 dark:prose-invert dark:prose-ink-dark"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {relatedPosts.length ? (
            <section className="rounded-[2rem] border border-ink-100 bg-white/75 p-8 shadow-[0_12px_35px_rgba(27,20,14,0.08)] dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-[0_12px_35px_rgba(0,0,0,0.45)]">
              <h2 className="font-display text-2xl text-ink-900 dark:text-ink-100">Bài viết liên quan</h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                Những câu chuyện tương tự mà bạn có thể hứng thú khám phá thêm.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {relatedPosts.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-ink-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(27,20,14,0.1)] dark:border-ink-700 dark:bg-ink-800/70">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
                      <span>{formatViDate(item.publishedAt ?? item.createdAt)}</span>
                      <span>{item.readingTime ?? post.readingTime ?? 3} phút đọc</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl text-ink-900 transition hover:text-ink-600 dark:text-ink-100 dark:hover:text-ink-200">
                      <PrefetchLink href={`/bai-viet/${item.slug}`}>{item.title}</PrefetchLink>
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm text-ink-600 dark:text-ink-300">{item.excerpt}</p>
                    {item.tags.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <Badge key={tag.tagId} className="border-ink-200/60 bg-white/70 text-[11px] uppercase tracking-[0.25em] text-ink-500 dark:border-ink-600 dark:bg-ink-800/60 dark:text-ink-200">
                            #{tag.tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-ink-100 bg-white/70 p-8 shadow-[0_12px_35px_rgba(27,20,14,0.08)] dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_12px_35px_rgba(0,0,0,0.45)]">
            <h2 className="font-display text-2xl text-ink-900 dark:text-ink-100">Trò chuyện cùng nhau</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Chia sẻ suy nghĩ của bạn về bài viết này.</p>
            <div className="mt-6">
              <GiscusThread mapping={post.slug} />
            </div>
          </section>

          <footer className="rounded-[2rem] border border-ink-100 bg-white/70 p-8 text-center shadow-[0_15px_40px_rgba(27,20,14,0.08)] dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_15px_40px_rgba(0,0,0,0.45)]">
            <p className="text-sm text-ink-500 dark:text-ink-300">
              Viết bởi <span className="font-medium text-ink-700 dark:text-ink-100">{post.author?.name ?? 'Một người yêu viết'}</span>
            </p>
            <p className="mt-2 text-xs text-ink-400 dark:text-ink-400">
              Muốn trao đổi thêm?{' '}
              <PrefetchLink href="/" className="text-ink-600 underline hover:text-ink-900 dark:text-ink-200 dark:hover:text-ink-100">
                Gửi lời nhắn qua trang chủ
              </PrefetchLink>
              .
            </p>
          </footer>
        </div>
        {hasHeadings ? <TableOfContents headings={headings} /> : null}
      </div>
    </article>
  )
}
