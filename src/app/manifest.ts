import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/metadata'
import { resolveSitePreferences } from '@/server/settings'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const preferences = await resolveSitePreferences()
  const name = preferences.siteName
  const description = preferences.seoDescription || preferences.slogan || 'Không gian blog cá nhân tràn đầy cảm hứng.'
  const favicon = preferences.faviconUrl ?? '/favicon.ico'

  return {
    name,
    short_name: name,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4ff',
    theme_color: '#5158e3',
    lang: 'vi-VN',
    icons: [
      {
        src: favicon.startsWith('http') ? favicon : absoluteUrl(favicon),
        sizes: '512x512 384x384 256x256 128x128 64x64 32x32 24x24 16x16',
        type: favicon.endsWith('.png') ? 'image/png' : 'image/x-icon',
      },
    ],
  }
}
