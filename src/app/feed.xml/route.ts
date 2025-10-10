import { buildRssFeed } from '@/lib/feed'

export const revalidate = 3600

export async function GET() {
  const rss = await buildRssFeed()
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
