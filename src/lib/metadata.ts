import { cache } from 'react'

import type { Metadata } from 'next'

import { resolveSitePreferences } from '@/server/settings'

const appUrl = process.env.NODE_ENV === 'production'
  ? 'https://thetoan.id.vn'
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

export const siteConfig = {
  name: 'Cathartica',
  description: 'Blog chia sẻ về cuộc sống, lập trình và phát triển game với Unity.',
  url: appUrl.replace(/\/$/, ''),
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

type MetadataOverrides = {
  siteName?: string
  tabTitle?: string
  siteDescription?: string
  seoKeywords?: string[]
  faviconUrl?: string | null
}

type CreateMetadataOptions = {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authorLinks?: string[]
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
  authorLinks,
  translations,
}: CreateMetadataOptions = {}, overrides?: MetadataOverrides): Metadata => {
  const baseTitle = overrides?.tabTitle ?? overrides?.siteName ?? siteConfig.name
  const siteName = overrides?.siteName ?? siteConfig.name
  const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle
  const summary = description ?? overrides?.siteDescription ?? siteConfig.description
  const keywords = overrides?.seoKeywords?.length ? overrides.seoKeywords : undefined
  const url = absoluteUrl(path)
  const ogImage = image ? absoluteUrl(image) : absoluteUrl(`/og?title=${encodeURIComponent(siteName)}`)
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
    keywords,
    alternates: { canonical: url, languages: languageAlternates },
    openGraph: {
      type,
      locale: siteConfig.locales.default.replace('-', '_'),
      url,
      title: fullTitle,
      description: summary,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authorLinks ? { authors: authorLinks } : {}),
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

export const getMetadataOverrides = cache(async () => {
  const preferences = await resolveSitePreferences()
  return {
    siteName: preferences.siteName,
    tabTitle: preferences.tabTitle,
    siteDescription: preferences.seoDescription || preferences.slogan || siteConfig.description,
    seoKeywords: preferences.seoKeywords,
    faviconUrl: preferences.faviconUrl,
  }
})

export const createDynamicMetadata = async (options?: CreateMetadataOptions) => {
  const overrides = await getMetadataOverrides()
  return createMetadata(options, overrides)
}
