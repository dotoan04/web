import { extractPlainText } from '@/lib/tiptap'
import { slugify } from '@/lib/utils'
import { getPublishedPosts } from '@/server/posts'

export type SearchDocument = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string | null
  tags: string[]
  content: string
  publishedAt: string
  updatedAt: string
}

const truncate = (value: string, max = 280) => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

export const buildSearchDocuments = async (): Promise<SearchDocument[]> => {
  const posts = await getPublishedPosts()
  return posts.map((post) => {
    const plain = extractPlainText(post.content as Record<string, unknown>)
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || truncate(plain, 220),
      category: post.category?.name ?? null,
      tags: post.tags.map((item) => item.tag.name),
      content: truncate(plain, 600),
      publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }
  })
}

export const buildSearchCacheKey = (documents: SearchDocument[]) =>
  slugify(
    documents
      .map((doc) => `${doc.id}-${doc.updatedAt}`)
      .join('|')
      .slice(-128)
  )
