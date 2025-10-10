import { absoluteUrl, siteConfig } from '@/lib/metadata'

type ListItem = {
  name: string
  url: string
}

export const createSiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl('/tim-kiem')}?query={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

export const createOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: absoluteUrl('/og?title=BlogVibe'),
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
}: ArticleOptions) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  mainEntityOfPage: absoluteUrl(`/bai-viet/${slug}`),
  headline: title,
  description: description ?? siteConfig.description,
  author: authorName ? { '@type': 'Person', name: authorName } : undefined,
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/og?title=BlogVibe'),
    },
  },
  image: coverImage ? [coverImage] : [absoluteUrl(`/og?title=${encodeURIComponent(title)}`)],
  datePublished: publishedAt.toISOString(),
  dateModified: updatedAt.toISOString(),
  keywords: tags.join(', '),
})
