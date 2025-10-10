import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BlogVibe Coding',
    short_name: 'BlogVibe',
    description: 'Không gian blog cá nhân giản dị với câu chuyện đời sống và trải nghiệm lập trình.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f3ed',
    theme_color: '#1b140e',
    lang: 'vi-VN',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
  }
}
