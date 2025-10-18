import { cache } from 'react'

import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'

type SettingMap = Record<string, unknown>

const keyMap = {
  siteName: 'site.name',
  tabTitle: 'site.tabTitle',
  slogan: 'site.slogan',
  hero: 'site.hero',
  featuredBadges: 'site.featuredBadges',
  seoKeywords: 'site.seo.keywords',
  seoDescription: 'site.seo.description',
  favicon: 'site.favicon',
  effectType: 'site.effects.type',
  parallaxCharacter: 'site.parallaxCharacter',
  quizLoadingGif: 'quiz.loadingGif',
  owner: 'portfolio.owner',
  education: 'portfolio.education',
  certifications: 'portfolio.certifications',
}

export const getSiteSettings = async () => {
  try {
    const settings = await prisma.siteSetting.findMany()
    return settings.reduce<SettingMap>((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})
  } catch (error) {
    console.error('Không thể tải thiết lập trang:', error)
    return {
      'site.name': 'BlogVibe Coding',
      'site.tabTitle': 'BlogVibe Coding',
      'site.slogan': null,
      'site.hero': {
        intro: 'Nơi lưu lại những lát cắt đời sống và câu chuyện về hành trình lập trình.',
        ctaLabel: null,
        ctaLink: null,
      },
      'site.featuredBadges': ['Cuộc sống', 'Lập trình', 'Sản xuất nội dung'],
      'site.seo.keywords': [],
      'site.seo.description': null,
      'site.favicon': null,
      'site.effects.type': 'sakura',
      'site.parallaxCharacter': null,
      'quiz.loadingGif': null,
      'portfolio.owner': {
        name: null,
        age: null,
        avatarUrl: null,
      },
      'portfolio.education': null,
      'portfolio.certifications': [],
    } satisfies SettingMap
  }
}

export const updateSiteSettings = async (settings: {
  siteName: string
  tabTitle: string
  slogan?: string
  heroIntro?: string
  heroCtaLabel?: string
  heroCtaLink?: string
  ownerName?: string
  ownerAge?: number | null
  ownerAvatarUrl?: string | null
  education?: string
  certifications?: string[]
  featuredBadges?: string[]
  seoKeywords?: string[]
  seoDescription?: string
  faviconUrl?: string | null
  effectType?: 'none' | 'snow' | 'sakura'
  parallaxCharacterUrl?: string | null
  quizLoadingGifUrl?: string | null
}) => {
  const ownerProfile = {
    name: settings.ownerName?.trim() ? settings.ownerName.trim() : null,
    age: typeof settings.ownerAge === 'number' ? settings.ownerAge : null,
    avatarUrl: settings.ownerAvatarUrl?.trim() ? settings.ownerAvatarUrl.trim() : null,
  }

  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: keyMap.siteName },
      create: { key: keyMap.siteName, value: settings.siteName },
      update: { value: settings.siteName },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.tabTitle },
      create: { key: keyMap.tabTitle, value: settings.tabTitle },
      update: { value: settings.tabTitle },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.slogan },
      create: {
        key: keyMap.slogan,
        value: settings.slogan ?? Prisma.JsonNull,
      },
      update: {
        value: settings.slogan ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.hero },
      create: {
        key: keyMap.hero,
        value: {
          intro: settings.heroIntro ?? '',
          ctaLabel: settings.heroCtaLabel ?? null,
          ctaLink: settings.heroCtaLink ? settings.heroCtaLink : null,
        },
      },
      update: {
        value: {
          intro: settings.heroIntro ?? '',
          ctaLabel: settings.heroCtaLabel ?? null,
          ctaLink: settings.heroCtaLink ? settings.heroCtaLink : null,
        },
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.featuredBadges },
      create: {
        key: keyMap.featuredBadges,
        value: settings.featuredBadges ?? ['Cuộc sống', 'Lập trình', 'Sản xuất nội dung'],
      },
      update: {
        value: settings.featuredBadges ?? ['Cuộc sống', 'Lập trình', 'Sản xuất nội dung'],
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.seoKeywords },
      create: {
        key: keyMap.seoKeywords,
        value: settings.seoKeywords ?? [],
      },
      update: {
        value: settings.seoKeywords ?? [],
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.seoDescription },
      create: {
        key: keyMap.seoDescription,
        value: settings.seoDescription ?? Prisma.JsonNull,
      },
      update: {
        value: settings.seoDescription ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.favicon },
      create: {
        key: keyMap.favicon,
        value: settings.faviconUrl ?? Prisma.JsonNull,
      },
      update: {
        value: settings.faviconUrl ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.effectType },
      create: {
        key: keyMap.effectType,
        value: settings.effectType ?? 'sakura',
      },
      update: {
        value: settings.effectType ?? 'sakura',
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.parallaxCharacter },
      create: {
        key: keyMap.parallaxCharacter,
        value: settings.parallaxCharacterUrl ?? Prisma.JsonNull,
      },
      update: {
        value: settings.parallaxCharacterUrl ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.quizLoadingGif },
      create: {
        key: keyMap.quizLoadingGif,
        value: settings.quizLoadingGifUrl ?? Prisma.JsonNull,
      },
      update: {
        value: settings.quizLoadingGifUrl ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.owner },
      create: {
        key: keyMap.owner,
        value: ownerProfile,
      },
      update: {
        value: ownerProfile,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.education },
      create: {
        key: keyMap.education,
        value: settings.education ?? Prisma.JsonNull,
      },
      update: {
        value: settings.education ?? Prisma.JsonNull,
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: keyMap.certifications },
      create: {
        key: keyMap.certifications,
        value: settings.certifications ?? [],
      },
      update: {
        value: settings.certifications ?? [],
      },
    }),
  ])
}

export const resolveSitePreferences = cache(async () => {
  const settings = await getSiteSettings()
  const hero = (settings[keyMap.hero] as { intro?: string; ctaLabel?: string; ctaLink?: string }) ?? {}

  return {
    siteName: (settings[keyMap.siteName] as string) ?? 'BlogVibe Coding',
    tabTitle: (settings[keyMap.tabTitle] as string) ?? ((settings[keyMap.siteName] as string) ?? 'BlogVibe Coding'),
    slogan: (settings[keyMap.slogan] as string) ?? '',
    heroIntro: hero.intro ?? 'Nơi lưu lại những lát cắt đời sống và câu chuyện về hành trình lập trình.',
    heroCtaLabel: hero.ctaLabel ?? null,
    heroCtaLink: hero.ctaLink ?? null,
    featuredBadges: Array.isArray(settings[keyMap.featuredBadges])
      ? (settings[keyMap.featuredBadges] as string[]).map((item) => item.trim()).filter(Boolean)
      : ['Cuộc sống', 'Lập trình', 'Sản xuất nội dung'],
    seoKeywords: Array.isArray(settings[keyMap.seoKeywords])
      ? (settings[keyMap.seoKeywords] as string[]).map((keyword) => keyword.trim()).filter(Boolean)
      : [],
    seoDescription: (settings[keyMap.seoDescription] as string) ?? '',
    faviconUrl: typeof settings[keyMap.favicon] === 'string' ? (settings[keyMap.favicon] as string) : null,
    effectType: (settings[keyMap.effectType] as 'none' | 'snow' | 'sakura') ?? 'sakura',
    parallaxCharacterUrl: typeof settings[keyMap.parallaxCharacter] === 'string' ? (settings[keyMap.parallaxCharacter] as string) : null,
    quizLoadingGifUrl: typeof settings[keyMap.quizLoadingGif] === 'string' ? (settings[keyMap.quizLoadingGif] as string) : null,
    owner: (settings[keyMap.owner] as { name?: string; age?: number | null; avatarUrl?: string | null }) ?? {},
    education: (settings[keyMap.education] as string) ?? '',
    certifications: (settings[keyMap.certifications] as string[]) ?? [],
  }
})
