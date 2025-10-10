import { buildSearchDocuments, buildSearchCacheKey } from '@/lib/search-index'

export const revalidate = 300

export async function GET() {
  const documents = await buildSearchDocuments()
  const etag = buildSearchCacheKey(documents)

  return Response.json(documents, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      ETag: etag,
    },
  })
}
