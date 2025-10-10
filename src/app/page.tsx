import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SmartImage } from '@/components/ui/smart-image'
import { PrefetchLink } from '@/components/ui/prefetch-link'
import { SubscriptionBanner } from '@/components/subscription/subscription-banner'
import { createMetadata } from '@/lib/metadata'
import { formatViDate } from '@/lib/utils'
import { getSiteSettings } from '@/server/settings'
import { getPublishedPosts } from '@/server/posts'
import { getCategoryOptions } from '@/server/categories'
import { getTagOptions } from '@/server/tags'
import { cn } from '@/components/ui/cn'

export const revalidate = 300

export const metadata: Metadata = createMetadata()

type HomeProps = {
  searchParams?: {
    category?: string
    tag?: string
  }
}

const buildQuery = (params: { category?: string; tag?: string }) => {
  const query: Record<string, string> = {}
  if (params.category) query.category = params.category
  if (params.tag) query.tag = params.tag
  return query
}

export default async function Home({ searchParams }: HomeProps) {
  const selectedCategory = searchParams?.category
  const selectedTag = searchParams?.tag

  const [settings, categoryOptions, tagOptions] = await Promise.all([
    getSiteSettings(),
    getCategoryOptions(),
    getTagOptions(),
  ])

  const validCategory = categoryOptions.some((item) => item.slug === selectedCategory)
    ? selectedCategory
    : undefined
  const validTag = tagOptions.some((item) => item.slug === selectedTag) ? selectedTag : undefined

  const posts = await getPublishedPosts({ categorySlug: validCategory, tagSlug: validTag })

  const heroSettings = (settings['site.hero'] as { intro?: string; ctaLabel?: string; ctaLink?: string }) ?? {}
  const hero = heroSettings.intro ?? 'Nơi lưu lại những lát cắt đời sống và câu chuyện về hành trình lập trình.'
  const heroCtaLabel = heroSettings.ctaLabel?.trim()
  const heroCtaLink = heroSettings.ctaLink?.trim()
  const heroCtaInternal = heroCtaLink?.startsWith('/')
  const slogan = (settings['site.slogan'] as string) ?? ''

  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-ink-100 bg-white/80 p-12 shadow-[0_25px_60px_rgba(27,20,14,0.12)] backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_25px_60px_rgba(11,9,6,0.45)]">
        <div className="absolute -top-16 right-12 h-48 w-48 rounded-full bg-ink-200/30 blur-3xl dark:bg-ink-600/40" />
        <div className="absolute -bottom-20 left-10 h-36 w-36 rounded-full bg-ink-300/20 blur-3xl dark:bg-ink-700/40" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs uppercase tracking-[0.4em] text-ink-400 dark:text-ink-300">
              {slogan || 'BlogVibe Coding'}
            </p>
            <h1 className="font-display text-4xl leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
              {(settings['site.name'] as string) ?? 'BlogVibe Coding'}
            </h1>
            <p className="text-lg text-ink-600 dark:text-ink-200">{hero}</p>
            {heroCtaLabel && heroCtaLink ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-6">
                  {heroCtaInternal ? (
                    <PrefetchLink href={heroCtaLink}>{heroCtaLabel}</PrefetchLink>
                  ) : (
                    <a href={heroCtaLink} target="_blank" rel="noopener noreferrer">
                      {heroCtaLabel}
                    </a>
                  )}
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-ink-800 text-ink-50 dark:bg-ink-600">Cuộc sống</Badge>
              <Badge className="bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100">Lập trình</Badge>
              <Badge className="bg-ink-200 text-ink-700 dark:bg-ink-600/70 dark:text-ink-100">Sản xuất nội dung</Badge>
            </div>
          </div>
          <div className="relative h-40 w-40 overflow-hidden rounded-full bg-gradient-to-br from-ink-300/70 via-ink-200/40 to-ink-100/60 shadow-[0_20px_50px_rgba(27,20,14,0.25)] dark:from-ink-700/50 dark:via-ink-700/30 dark:to-ink-800/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:h-52 sm:w-52">
            <div className="absolute inset-2 rounded-full border border-white/60 dark:border-ink-600/60" />
            <div className="absolute inset-6 rounded-full border border-white/30 dark:border-ink-600/40" />
            <div className="absolute inset-10 rounded-full border border-white/20 dark:border-ink-600/30" />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-3xl text-ink-900 dark:text-ink-100">Nhật ký mới nhất</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
              {validCategory
                ? `Chuyên mục: ${categoryOptions.find((item) => item.slug === validCategory)?.name ?? 'Tất cả'}`
                : 'Tất cả chuyên mục'}
              {' · '}
              {validTag
                ? `Thẻ: ${tagOptions.find((item) => item.slug === validTag)?.name ?? 'Tất cả'}`
                : 'Tất cả thẻ'}
            </p>
          </div>
          <PrefetchLink
            href="/chuyen-muc/tat-ca"
            className="text-sm text-ink-600 underline transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-ink-100"
          >
            Xem tất cả chuyên mục
          </PrefetchLink>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <PrefetchLink
              href={{ pathname: '/', query: buildQuery({ tag: validTag }) }}
              className={cn(
                'rounded-full border border-ink-200 bg-white/70 px-4 py-2 text-sm text-ink-600 transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200 dark:hover:border-ink-500',
                !validCategory && 'border-ink-800 bg-ink-900 text-ink-50 dark:border-ink-400 dark:bg-ink-100/10 dark:text-ink-50'
              )}
            >
              Tất cả
            </PrefetchLink>
            {categoryOptions.map((category) => (
              <PrefetchLink
                key={category.id}
                href={{ pathname: '/', query: buildQuery({ category: category.slug, tag: validTag }) }}
                className={cn(
                  'rounded-full border border-ink-200 bg-white/70 px-4 py-2 text-sm text-ink-600 transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200 dark:hover:border-ink-500',
                  validCategory === category.slug &&
                    'border-ink-800 bg-ink-900 text-ink-50 dark:border-ink-400 dark:bg-ink-100/10 dark:text-ink-50'
                )}
              >
                {category.name}
              </PrefetchLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Thẻ nổi bật:</span>
            <PrefetchLink
              href={{ pathname: '/', query: buildQuery({ category: validCategory }) }}
              className={cn(
                'rounded-full border border-dashed border-ink-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink-500 transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-500',
                !validTag && 'border-ink-800 text-ink-900 dark:border-ink-400 dark:text-ink-100'
              )}
            >
              Tất cả
            </PrefetchLink>
            {tagOptions.map((tag) => (
              <PrefetchLink
                key={tag.id}
                href={{
                  pathname: '/',
                  query: buildQuery({ category: validCategory, tag: validTag === tag.slug ? undefined : tag.slug }),
                }}
                className={cn(
                  'rounded-full border border-dashed border-ink-200 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink-500 transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-500',
                  validTag === tag.slug && 'border-ink-800 text-ink-900 dark:border-ink-400 dark:text-ink-100'
                )}
              >
                #{tag.name}
              </PrefetchLink>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white/80 shadow-[0_15px_45px_rgba(27,20,14,0.1)] transition hover:-translate-y-1 dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-[0_15px_45px_rgba(0,0,0,0.45)]">
              {post.coverImage?.url ? (
                <div className="relative h-60 w-full overflow-hidden">
                  <SmartImage
                    src={post.coverImage.url}
                    alt={post.coverImage.alt ?? post.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">
                  <span>{post.category?.name ?? 'Không phân loại'}</span>
                  <span>•</span>
                  <span>{formatViDate(post.publishedAt ?? post.createdAt)}</span>
                </div>
                <h3 className="font-display text-2xl text-ink-900 dark:text-ink-100">
                  <PrefetchLink href={`/bai-viet/${post.slug}`} className="transition hover:text-ink-600 dark:hover:text-ink-200">
                    {post.title}
                  </PrefetchLink>
                </h3>
                <p className="line-clamp-3 text-sm text-ink-600 dark:text-ink-300">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.tagId} className="bg-ink-100 text-ink-600 dark:bg-ink-700/80 dark:text-ink-100">
                        #{tag.tag.name}
                      </Badge>
                    ))}
                  </div>
                  <PrefetchLink
                    href={`/bai-viet/${post.slug}`}
                    className="text-sm text-ink-600 underline transition hover:text-ink-900 dark:text-ink-300 dark:hover:text-ink-100"
                  >
                    Đọc tiếp
                  </PrefetchLink>
                </div>
              </div>
            </article>
          ))}
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-ink-100 bg-white/80 p-8 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
              Chưa có bài viết nào khớp với bộ lọc hiện tại. Bạn có thể thử chọn chuyên mục hoặc thẻ khác.
            </div>
          ) : null}
        </div>
      </section>

      <SubscriptionBanner />
    </main>
  )
}
