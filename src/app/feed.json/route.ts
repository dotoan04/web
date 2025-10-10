import { buildJsonFeed } from '@/lib/feed'

export const revalidate = 3600

export async function GET() {
  const jsonFeed = await buildJsonFeed()
  return Response.json(jsonFeed, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
