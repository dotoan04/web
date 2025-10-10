import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'

type SettingMap = Record<string, unknown>

const keyMap = {
  siteName: 'site.name',
  slogan: 'site.slogan',
  hero: 'site.hero',
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
      'site.slogan': null,
      'site.hero': {
        intro: 'Nơi lưu lại những lát cắt đời sống và câu chuyện về hành trình lập trình.',
        ctaLabel: null,
        ctaLink: null,
      },
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
  slogan?: string
  heroIntro?: string
  heroCtaLabel?: string
  heroCtaLink?: string
  ownerName?: string
  ownerAge?: number | null
  ownerAvatarUrl?: string | null
  education?: string
  certifications?: string[]
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
