import prisma from '@/lib/prisma'

type RecordVisitInput = {
  path: string
  ip: string
  userAgent?: string | null
  referrer?: string | null
  source?: string | null
  country?: string | null
  city?: string | null
}

type AnalyticsOverview = {
  totalVisits: number
  uniqueVisitors: number
  topSources: { source: string; count: number }[]
  recentVisits: Array<{
    id: string
    path: string
    ip: string
    userAgent: string | null
    referrer: string | null
    source: string | null
    country: string | null
    city: string | null
    createdAt: Date
    platform: string
  }>
}

const deriveSource = (referrer?: string | null, fallback?: string | null) => {
  if (!referrer) return fallback ?? 'Trực tiếp'
  try {
    const url = new URL(referrer)
    const host = url.hostname.replace(/^www\./, '')
    if (!host) return fallback ?? 'Khác'
    const knownSources: Record<string, string> = {
      'google.com': 'Google',
      'google.com.vn': 'Google',
      'bing.com': 'Bing',
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter',
      'x.com': 'Twitter / X',
      'linkedin.com': 'LinkedIn',
      'dev.to': 'Dev.to',
      'hashnode.com': 'Hashnode',
      'medium.com': 'Medium',
      'youtube.com': 'YouTube',
      'github.com': 'GitHub',
    }
    return knownSources[host] ?? host
  } catch (error) {
    console.warn('Không thể phân tích nguồn referrer:', error)
    return fallback ?? 'Khác'
  }
}

const derivePlatform = (userAgent?: string | null) => {
  if (!userAgent) return 'Không xác định'
  const ua = userAgent.toLowerCase()
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('bot') || ua.includes('spider') || ua.includes('crawl')) return 'Bot'
  return 'Khác'
}

export const recordVisit = async ({ path, ip, userAgent, referrer, source, country, city }: RecordVisitInput) => {
  if (!path || path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) {
    return
  }

  try {
    await prisma.visit.create({
      data: {
        path: path.slice(0, 255),
        ip: ip.slice(0, 64),
        userAgent: userAgent?.slice(0, 255),
        referrer: referrer?.slice(0, 255) ?? null,
        source: deriveSource(referrer, source?.slice(0, 120) ?? null),
        country: country?.slice(0, 80) ?? null,
        city: city?.slice(0, 80) ?? null,
      },
    })
  } catch (error) {
    console.error('Không thể ghi nhận lượt truy cập:', error)
  }
}

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  try {
    const [totalVisits, uniqueIps, topSources, recentVisits] = await Promise.all([
      prisma.visit.count(),
      prisma.visit.findMany({ distinct: ['ip'], select: { ip: true } }),
      prisma.visit.groupBy({
        by: ['source'],
        _count: { source: true },
        orderBy: { _count: { source: 'desc' } },
        take: 6,
      }),
      prisma.visit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ])

    return {
      totalVisits,
      uniqueVisitors: uniqueIps.length,
      topSources: topSources
        .filter((item) => item.source)
        .map((item) => ({ source: item.source ?? 'Khác', count: item._count.source })),
      recentVisits: recentVisits.map((visit) => ({
        ...visit,
        platform: derivePlatform(visit.userAgent),
      })),
    }
  } catch (error) {
    console.error('Không thể tải thống kê analytics:', error)
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      topSources: [],
      recentVisits: [],
    }
  }
}
