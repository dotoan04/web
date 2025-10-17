import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { renderRichText } from '@/lib/render-html'
import { formatViDate } from '@/lib/utils'
import { ReadingProgress } from '@/components/reading-progress'
import { SmartImage } from '@/components/ui/smart-image'
import { FadeIn } from '@/components/ui/fade-in'
import { getPostBySlug, getRelatedPosts } from '@/server/posts'
import { absoluteUrl, createDynamicMetadata } from '@/lib/metadata'
import { createArticleJsonLd, createBreadcrumbJsonLd } from '@/lib/structured-data'
import { resolveSitePreferences } from '@/server/settings'
import { JsonLd } from '@/components/json-ld'
import { cn } from '@/components/ui/cn'
import { Badge } from '@/components/ui/badge'
import { PrefetchLink } from '@/components/ui/prefetch-link'

const TableOfContents = dynamic(() => import('@/components/table-of-contents'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800 h-64 w-full" />
  ),
})

const CodeBlockClient = dynamic(() => import('@/components/code-block-client'), {
  ssr: false,
  loading: () => null,
})

const GiscusThread = dynamic(() => import('@/components/comments/giscus-thread'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800 h-48 w-full" />
  ),
})

type Props = {
  params: { slug: string }
}

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) {
    return createDynamicMetadata({
      title: 'Bài viết',
      path: `/bai-viet/${params.slug}`,
    })
  }
  return createDynamicMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `/bai-viet/${post.slug}`,
    image: `/og?title=${encodeURIComponent(post.title)}`,
    type: 'article',
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt.toISOString(),
    authorLinks: post.author?.website ? [post.author.website] : undefined,
  })
}

export default async function PostDetailPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  const [{ html, headings }, relatedPosts, preferences] = await Promise.all([
    renderRichText(post.content as Record<string, unknown>),
    getRelatedPosts(post.slug),
    resolveSitePreferences(),
  ])
  const breadcrumb = createBreadcrumbJsonLd([
    { name: 'Trang chủ', url: absoluteUrl('/') },
    ...(post.category
      ? [{ name: post.category.name, url: absoluteUrl(`/chuyen-muc/${post.category.slug}`) }]
      : []),
    { name: post.title, url: absoluteUrl(`/bai-viet/${post.slug}`) },
  ])
  const article = createArticleJsonLd(
    {
      title: post.title,
      description: post.excerpt,
      slug: post.slug,
      publishedAt: post.publishedAt ?? post.createdAt,
      updatedAt: post.updatedAt,
      authorName: post.author?.name,
      authorWebsite: post.author?.website,
      coverImage: post.coverImage?.url ?? null,
      tags: post.tags.map((item) => item.tag.name),
    },
    {
      siteName: preferences.siteName,
      siteDescription: preferences.seoDescription || preferences.slogan || undefined,
      logo: preferences.faviconUrl ?? absoluteUrl(`/og?title=${encodeURIComponent(preferences.siteName)}`),
    },
  )
  const hasHeadings = headings.length > 0

  return (
    <article className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-12">
      <ReadingProgress />
      <CodeBlockClient />
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      
      {/* Hero Section with improved mobile spacing */}
      <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
        <FadeIn delay={100}>
          <header className="flex flex-col gap-3 sm:gap-4 text-center px-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-ink-400 dark:text-ink-300 font-semibold">
              {post.category?.name ?? 'Không phân loại'}
            </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight text-ink-900 dark:text-ink-100 px-2">
            {post.title}
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-ink-500 dark:text-ink-300">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatViDate(post.publishedAt ?? post.createdAt)}
            </span>
            <span className="hidden sm:inline text-ink-300 dark:text-ink-600">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readingTime ?? 3} phút đọc
            </span>
            <span className="hidden sm:inline text-ink-300 dark:text-ink-600">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {post.author?.name ?? 'Ẩn danh'}
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 text-xs text-ink-500 dark:text-ink-300 mt-2">
              {post.tags.map((item) => (
                <span key={item.tagId} className="rounded-full bg-ink-100 px-3 py-1.5 dark:bg-ink-700/80 dark:text-ink-100 transition-transform hover:scale-105">
                  #{item.tag.name}
                </span>
              ))}
            </div>
          )}
          </header>
        </FadeIn>

        {post.coverImage?.url ? (
          <FadeIn delay={200} direction="up">
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-xl dark:shadow-2xl">
            <SmartImage
              src={post.coverImage.url}
              alt={post.coverImage.alt ?? post.title}
              fill
              priority
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            />
          </div>
          </FadeIn>
        ) : null}
      </div>
      {/* Main Content with improved mobile typography */}
      <div
        className={cn(
          'mt-8 sm:mt-10 md:mt-12 grid gap-8 md:gap-10 lg:gap-12',
          hasHeadings &&
            'xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-14 2xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:gap-16',
        )}
      >
        <div
          className="prose prose-sm sm:prose-base md:prose-lg prose-ink mx-auto w-full max-w-none text-ink-800 dark:text-ink-100 dark:prose-invert dark:prose-ink-dark
            prose-headings:scroll-mt-20 prose-headings:font-display
            prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:leading-relaxed sm:prose-p:leading-loose prose-p:mb-4
            prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-a:transition-all
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-6
            prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-ink-900 dark:prose-pre:bg-ink-950 prose-pre:shadow-xl prose-pre:border prose-pre:border-ink-200 dark:prose-pre:border-ink-800
            prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-ul:my-4 prose-ol:my-4 prose-li:my-1
            px-2 sm:px-4 md:px-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {hasHeadings ? (
          <div className="hidden xl:block sticky top-24 self-start">
            <TableOfContents headings={headings} />
          </div>
        ) : null}
      </div>

      {/* Related Content & Comments - Mobile Optimized */}
      <div className="mx-auto mt-10 sm:mt-12 md:mt-16 flex w-full max-w-4xl flex-col gap-6 sm:gap-8 md:gap-10 px-2 sm:px-0">
        {relatedPosts.length > 0 ? (
          <FadeIn delay={100}>
            <section className="rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-ink-100 bg-white/75 p-5 sm:p-6 md:p-8 shadow-xl dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-2xl backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4 sm:mb-5">
              <div>
                <h2 className="font-display text-xl sm:text-2xl text-ink-900 dark:text-ink-100">Bài viết liên quan</h2>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-ink-500 dark:text-ink-300">
                  Những câu chuyện tương tự mà bạn có thể hứng thú khám phá thêm.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2">
              {relatedPosts.map((item) => (
                <article 
                  key={item.id} 
                  className="group rounded-xl sm:rounded-2xl border border-ink-100 bg-white/80 p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-ink-700 dark:bg-ink-800/70"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-ink-400 dark:text-ink-300 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatViDate(item.publishedAt ?? item.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.readingTime ?? post.readingTime ?? 3} phút
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg md:text-xl text-ink-900 transition group-hover:text-indigo-600 dark:text-ink-100 dark:group-hover:text-indigo-400 line-clamp-2">
                    <PrefetchLink href={`/bai-viet/${item.slug}`}>{item.title}</PrefetchLink>
                  </h3>
                  <p className="mt-2 sm:mt-3 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
                    {item.excerpt}
                  </p>
                  {item.tags.length > 0 ? (
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag.tagId} 
                          className="border-ink-200/60 bg-white/70 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-ink-500 dark:border-ink-600 dark:bg-ink-800/60 dark:text-ink-200 px-2 py-0.5"
                        >
                          #{tag.tag.name}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge className="border-ink-200/60 bg-white/70 text-[10px] sm:text-[11px] text-ink-400 dark:border-ink-600 dark:bg-ink-800/60 dark:text-ink-300 px-2 py-0.5">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
            </section>
          </FadeIn>
        ) : null}

        <FadeIn delay={150}>
          <section className="rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-ink-100 bg-white/70 p-5 sm:p-6 md:p-8 shadow-xl dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-2xl backdrop-blur-sm">
          <h2 className="font-display text-xl sm:text-2xl text-ink-900 dark:text-ink-100">Trò chuyện cùng nhau</h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-ink-500 dark:text-ink-300">Chia sẻ suy nghĩ của bạn về bài viết này.</p>
          <div className="mt-4 sm:mt-6">
            <GiscusThread mapping={post.slug} />
          </div>
          </section>
        </FadeIn>

        <FadeIn delay={200}>
          <footer className="rounded-2xl sm:rounded-3xl md:rounded-[2rem] border border-ink-100 bg-gradient-to-br from-white/90 to-white/70 p-6 sm:p-8 text-center shadow-xl dark:border-ink-700 dark:from-ink-800/90 dark:to-ink-800/70 dark:shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
              {(post.author?.name ?? 'A')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm sm:text-base text-ink-500 dark:text-ink-300">
                Viết bởi <span className="font-semibold text-ink-700 dark:text-ink-100">{post.author?.name ?? 'Một người yêu viết'}</span>
              </p>
              <p className="mt-2 text-xs sm:text-sm text-ink-400 dark:text-ink-400">
                Muốn trao đổi thêm?{' '}
                <PrefetchLink href="/" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                  Gửi lời nhắn qua trang chủ
                </PrefetchLink>
              </p>
            </div>
          </div>
          </footer>
        </FadeIn>
      </div>
    </article>
  )
}