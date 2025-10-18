import { Badge } from '@/components/ui/badge'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Button } from '@/components/ui/button'
import { SmartImage } from '@/components/ui/smart-image'
import { PrefetchLink } from '@/components/ui/prefetch-link'
import { SubscriptionBanner } from '@/components/subscription/subscription-banner'
import { AnimatedHero } from '@/components/animated-hero'
import { ScrollReveal, SlideIn } from '@/components/scroll-reveal'
import { ParallaxCharacter } from '@/components/effects/parallax-character'
import { createDynamicMetadata } from '@/lib/metadata'
import { formatViDate } from '@/lib/utils'
import { resolveSitePreferences } from '@/server/settings'
import { getPublishedPosts } from '@/server/posts'
import { getCategoryOptions } from '@/server/categories'
import { getTagOptions } from '@/server/tags'
import { cn } from '@/components/ui/cn'

export const revalidate = 60 // Faster cache updates

export async function generateMetadata() {
  return createDynamicMetadata()
}

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

  const [preferences, categoryOptions, tagOptions] = await Promise.all([
    resolveSitePreferences(),
    getCategoryOptions(),
    getTagOptions(),
  ])

  const validCategory = categoryOptions.some((item) => item.slug === selectedCategory)
    ? selectedCategory
    : undefined
  const validTag = tagOptions.some((item) => item.slug === selectedTag) ? selectedTag : undefined

  const posts = await getPublishedPosts({ categorySlug: validCategory, tagSlug: validTag })

  const hero = preferences.heroIntro
  const heroCtaLabel = preferences.heroCtaLabel?.trim()
  const heroCtaLink = preferences.heroCtaLink?.trim()
  const heroCtaInternal = heroCtaLink?.startsWith('/')
  const slogan = preferences.slogan ?? ''
  const featuredBadges = preferences.featuredBadges.length > 0 ? preferences.featuredBadges : ['Cuộc sống', 'Lập trình', 'Sản xuất nội dung']
  const badgeClasses = ['bg-ink-800 text-ink-50 dark:bg-ink-600', 'bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-50', 'bg-ink-200 text-ink-700 dark:bg-ink-600/70 dark:text-ink-100']

  return (
    <main className="space-y-16 relative">
      <AnimatedHero>
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 glass-card liquid-gradient p-6 sm:p-8 md:p-12 shadow-[0_25px_60px_rgba(31,38,135,0.25)] backdrop-blur-2xl dark:border-white/10 dark:shadow-[0_25px_60px_rgba(31,38,135,0.45)]">
          {preferences.parallaxCharacterUrl && (
            <ParallaxCharacter imageUrl={preferences.parallaxCharacterUrl} />
          )}
          <div className="absolute -top-16 right-12 h-48 w-48 rounded-full bg-ink-200/40 blur-3xl dark:bg-ink-600/40 liquid-blob" />
          <div className="absolute -bottom-20 left-10 h-36 w-36 rounded-full bg-ink-300/25 blur-3xl dark:bg-ink-700/35 liquid-blob" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-5">
              <p className="text-xs uppercase tracking-[0.4em] text-ink-400 dark:text-ink-300">
                {slogan || preferences.tabTitle}
              </p>
              <h1 className="font-display text-4xl leading-tight text-ink-900 dark:text-ink-50 md:text-5xl">
                {preferences.siteName}
              </h1>
              <p className="text-lg text-ink-600 dark:text-ink-200">{hero}</p>
              {heroCtaLabel && heroCtaLink ? (
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="glass-button">
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
                {featuredBadges.map((label, index) => (
                  <Badge key={`${label}-${index}`} className={badgeClasses[index % badgeClasses.length]}>
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedHero>

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
                'glass-button border-white/20 bg-white/30 px-4 py-2 text-sm text-ink-600 transition hover:border-white/40 hover:bg-white/40 dark:border-white/10 dark:bg-white/20 dark:text-ink-200 dark:hover:border-white/20 dark:hover:bg-white/30',
                !validCategory && 'border-white/40 bg-white/40 text-ink-900 dark:border-white/20 dark:bg-white/30 dark:text-ink-50'
              )}
            >
              Tất cả
            </PrefetchLink>
            {categoryOptions.map((category) => (
              <PrefetchLink
                key={category.id}
                href={{ pathname: '/', query: buildQuery({ category: category.slug, tag: validTag }) }}
                className={cn(
                  'glass-button border-white/20 bg-white/30 px-4 py-2 text-sm text-ink-600 transition hover:border-white/40 hover:bg-white/40 dark:border-white/10 dark:bg-white/20 dark:text-ink-200 dark:hover:border-white/20 dark:hover:bg-white/30',
                  validCategory === category.slug &&
                    'border-white/40 bg-white/40 text-ink-900 dark:border-white/20 dark:bg-white/30 dark:text-ink-50'
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
                'glass-button border-dashed border-white/20 bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink-500 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:text-ink-300 dark:hover:border-white/20 dark:hover:bg-white/20',
                !validTag && 'border-white/40 bg-white/30 text-ink-900 dark:border-white/20 dark:bg-white/20 dark:text-ink-100'
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
                  'glass-button border-dashed border-white/20 bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink-500 transition hover:border-white/40 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:text-ink-300 dark:hover:border-white/20 dark:hover:bg-white/20',
                  validTag === tag.slug && 'border-white/40 bg-white/30 text-ink-900 dark:border-white/20 dark:bg-white/20 dark:text-ink-100'
                )}
              >
                #{tag.name}
              </PrefetchLink>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post, index) => (
            <ScrollReveal key={post.id} delay={index * 0.1}>
              <article className="group glass-card glass-hover border-white/20 bg-white/30 shadow-[0_15px_45px_rgba(31,38,135,0.18)] transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_15px_45px_rgba(31,38,135,0.35)] h-full flex flex-col overflow-hidden">
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
                      <Badge key={tag.tagId} className="glass-button border-white/30 bg-white/40 text-ink-600 dark:border-white/15 dark:bg-white/20 dark:text-ink-100">
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
            </ScrollReveal>
          ))}
          {posts.length === 0 ? (
            <div className="glass-card border-white/20 bg-white/30 p-8 text-center text-sm text-ink-500 shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:border-white/10 dark:bg-white/5 dark:text-ink-300 dark:shadow-[0_8px_32px_rgba(31,38,135,0.25)">
              Chưa có bài viết nào khớp với bộ lọc hiện tại. Bạn có thể thử chọn chuyên mục hoặc thẻ khác.
            </div>
          ) : null}
        </div>
      </section>

      <SubscriptionBanner siteName={preferences.siteName} />
    </main>
  )
}
