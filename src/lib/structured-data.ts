import { absoluteUrl, siteConfig } from '@/lib/metadata'

type ListItem = {
  name: string
  url: string
}

export const createSiteJsonLd = (overrides?: { name?: string; description?: string; url?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: overrides?.name ?? siteConfig.name,
  url: overrides?.url ?? siteConfig.url,
  description: overrides?.description ?? siteConfig.description,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl('/tim-kiem')}?query={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

export const createOrganizationJsonLd = (overrides?: { name?: string; logo?: string; url?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: overrides?.name ?? siteConfig.name,
  url: overrides?.url ?? siteConfig.url,
  logo: overrides?.logo ?? absoluteUrl(`/og?title=${encodeURIComponent(siteConfig.name)}`),
})

export const createBreadcrumbJsonLd = (items: ListItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

type ArticleOptions = {
  title: string
  description?: string | null
  slug: string
  publishedAt: Date
  updatedAt: Date
  authorName?: string | null
  coverImage?: string | null
  tags?: string[]
}

export const createArticleJsonLd = ({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  authorName,
  coverImage,
  tags = [],
}: ArticleOptions, overrides?: { siteName?: string; siteDescription?: string; logo?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  mainEntityOfPage: absoluteUrl(`/bai-viet/${slug}`),
  headline: title,
  description: description ?? overrides?.siteDescription ?? siteConfig.description,
  author: authorName ? { '@type': 'Person', name: authorName } : undefined,
  publisher: {
    '@type': 'Organization',
    name: overrides?.siteName ?? siteConfig.name,
    logo: {
      '@type': 'ImageObject',
      url: overrides?.logo ?? absoluteUrl(`/og?title=${encodeURIComponent(siteConfig.name)}`),
    },
  },
  image: coverImage ? [coverImage] : [absoluteUrl(`/og?title=${encodeURIComponent(title)}`)],
  datePublished: publishedAt.toISOString(),
  dateModified: updatedAt.toISOString(),
  keywords: tags.join(', '),
})
