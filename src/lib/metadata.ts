import type { Metadata } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const siteConfig = {
  name: 'BlogVibe Coding',
  description: 'Không gian blog cá nhân giản dị, kể chuyện đời sống và chia sẻ trải nghiệm lập trình.',
  url: appUrl.replace(/\/$/, ''),
  twitter: '@blogvibe',
  locales: {
    default: 'vi-VN',
    languages: {
      'vi-VN': '/',
    },
  },
  analytics: {
    plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    clarityId: process.env.NEXT_PUBLIC_CLARITY_ID,
  },
  social: {
    webmention: process.env.NEXT_PUBLIC_WEBMENTION_ENDPOINT,
    pingback: process.env.NEXT_PUBLIC_PINGBACK_ENDPOINT,
  },
}

export const absoluteUrl = (path: string) =>
  path.startsWith('http') ? path : `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`

type CreateMetadataOptions = {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  translations?: Record<string, string>
}

export const createMetadata = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  translations,
}: CreateMetadataOptions = {}): Metadata => {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
  const summary = description ?? siteConfig.description
  const url = absoluteUrl(path)
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(`/og?title=${encodeURIComponent(siteConfig.name)}`)
  const languageAlternates = Object.entries(siteConfig.locales.languages).reduce<Record<string, string>>((acc, [locale, basePath]) => {
    const trimmedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')
    const cleanedPath = path === '/' ? '' : path
    acc[locale] = absoluteUrl(`${trimmedBase}${cleanedPath}` || '/')
    return acc
  }, {})

  if (translations) {
    for (const [locale, localePath] of Object.entries(translations)) {
      languageAlternates[locale] = absoluteUrl(localePath)
    }
  }

  return {
    title: fullTitle,
    description: summary,
    alternates: { canonical: url, languages: languageAlternates },
    openGraph: {
      type,
      locale: siteConfig.locales.default.replace('-', '_'),
      url,
      title: fullTitle,
      description: summary,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      creator: siteConfig.twitter,
      title: fullTitle,
      description: summary,
      images: [ogImage],
    },
  }
}
