import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/prisma'
import { extractPlainText } from '@/lib/tiptap'
import { estimateReadingTime, slugify } from '@/lib/utils'

export type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: true
    category: true
    tags: { include: { tag: true } }
    coverImage: true
  }
}>

type PostFilters = {
  categorySlug?: string
  tagSlug?: string
  limit?: number
  skip?: number
}

export const getPublishedPosts = async (filters: PostFilters = {}) =>
  prisma.post
    .findMany({
      where: {
        status: 'PUBLISHED',
        ...(filters.categorySlug
          ? {
              category: {
                slug: filters.categorySlug,
              },
            }
          : {}),
        ...(filters.tagSlug
          ? {
              tags: {
                some: {
                  tag: { slug: filters.tagSlug },
                },
              },
            }
          : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: filters.limit ?? 20, // Limit to 20 posts by default
      skip: filters.skip ?? 0,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 5, // Limit tags per post
        },
        coverImage: {
          select: {
            id: true,
            url: true,
            alt: true,
            title: true,
          },
        },
      },
    })
    .catch((error) => {
      console.error('Không thể truy vấn danh sách bài viết đã xuất bản:', error)
      return []
    })

export const getPublishedPostSlugs = async () =>
  prisma.post
    .findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      select: { slug: true, updatedAt: true, publishedAt: true },
    })
    .catch((error) => {
      console.error('Không thể tải danh sách slug bài viết đã xuất bản:', error)
      return []
    })

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const tokenize = (value: string) => {
  const simplified = normalizeText(value)
  return simplified.match(/[a-z0-9]{2,}/g) ?? []
}

const createTf = (tokens: string[]) => {
  const tf = new Map<string, number>()
  const total = tokens.length || 1
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1)
  }
  tf.forEach((count, token) => {
    tf.set(token, count / total)
  })
  return tf
}

const computeCosineSimilarity = (
  baseTf: Map<string, number>,
  docTf: Map<string, number>,
  idf: Map<string, number>
) => {
  let dot = 0
  let baseMagnitude = 0
  let docMagnitude = 0

  baseTf.forEach((weight, token) => {
    const tokenIdf = idf.get(token) ?? 1
    const baseWeight = weight * tokenIdf
    baseMagnitude += baseWeight * baseWeight
    const docWeight = (docTf.get(token) ?? 0) * tokenIdf
    if (docWeight) {
      dot += baseWeight * docWeight
    }
  })

  docTf.forEach((weight, token) => {
    const tokenIdf = idf.get(token) ?? 1
    const docWeight = weight * tokenIdf
    docMagnitude += docWeight * docWeight
  })

  if (!baseMagnitude || !docMagnitude) return 0
  return dot / (Math.sqrt(baseMagnitude) * Math.sqrt(docMagnitude))
}

export const getRelatedPosts = async (slug: string, limit = 3) => {
  try {
    const basePost = await prisma.post.findUnique({
      where: { slug },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    })

    if (!basePost || basePost.status !== 'PUBLISHED') return []

    const candidates = await prisma.post.findMany({
      where: { status: 'PUBLISHED', slug: { not: slug } },
      include: {
        tags: { include: { tag: true } },
        category: true,
        coverImage: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 40,
    })

    if (!candidates.length) return []

    const baseText = extractPlainText(basePost.content as Record<string, unknown>)
    const baseTokens = tokenize(baseText)
    const baseTf = createTf(baseTokens)

    const docsTokens = candidates.map((post) => {
      const text = extractPlainText(post.content as Record<string, unknown>)
      return tokenize(text)
    })

    const df = new Map<string, number>()
    docsTokens.forEach((tokens) => {
      const unique = new Set(tokens)
      unique.forEach((token) => {
        df.set(token, (df.get(token) ?? 0) + 1)
      })
    })

    const totalDocs = docsTokens.length
    const idf = new Map<string, number>()
    df.forEach((count, token) => {
      idf.set(token, Math.log((totalDocs + 1) / (count + 1)) + 1)
    })

    const baseTags = new Set(basePost.tags.map((item) => item.tag.name))
    const baseCategory = basePost.category?.id

    const scored = candidates.map((post, index) => {
      const docTf = createTf(docsTokens[index])
      let score = computeCosineSimilarity(baseTf, docTf, idf)

      const sharedTags = post.tags.filter((item) => baseTags.has(item.tag.name)).length
      if (sharedTags) {
        score += sharedTags * 0.05
      }
      if (post.category?.id && post.category.id === baseCategory) {
        score += 0.1
      }

      return { post, score }
    })

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ post }) => post)
  } catch (error) {
    console.error('Không thể tính toán bài viết liên quan:', error)
    return []
  }
}

export const getPostBySlug = async (slug: string) =>
  prisma.post
    .findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        coverImage: true,
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: true },
        },
      },
    })
    .catch((error) => {
      console.error('Không thể truy vấn bài viết theo slug:', error)
      return null
    })

type UpsertPostInput = {
  id?: string
  title: string
  slug?: string
  excerpt?: string
  content: Prisma.InputJsonValue
  tagIds: string[]
  categoryId?: string | null
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  publishedAt?: Date | null
  authorId: string
  coverImageId?: string | null
}

export const upsertPost = async (input: UpsertPostInput) => {
  const { id, title, slug, content, tagIds, authorId, status, publishedAt } = input
  const normalizedSlugCandidate = slug ? slugify(slug) : slugify(title)
  const normalizedSlug = normalizedSlugCandidate || `bai-viet-${Date.now()}`
  const plainText = extractPlainText(content as Record<string, unknown>).replace(/\s+/g, ' ').trim()
  const excerptSource = plainText.slice(0, 220)
  const excerpt = input.excerpt?.trim() || (excerptSource ? `${excerptSource}${plainText.length > 220 ? '…' : ''}` : '')

  const readingTime = estimateReadingTime(plainText)

  const data: Prisma.PostUpsertArgs['create'] = {
    title,
    slug: normalizedSlug,
    content,
    excerpt,
    status: status ?? 'DRAFT',
    categoryId: input.categoryId ?? null,
    readingTime,
    publishedAt: status === 'PUBLISHED' ? publishedAt ?? new Date() : null,
    authorId,
    coverImageId: input.coverImageId ?? null,
    tags: {
      createMany: {
        data: tagIds.map((tagId) => ({ tagId })),
        skipDuplicates: true,
      },
    },
  }

  if (id) {
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        tags: {
          deleteMany: {},
          createMany: {
            data: tagIds.map((tagId) => ({ tagId })),
            skipDuplicates: true,
          },
        },
        revisions: {
          create: {
            title,
            excerpt,
            content,
            authorId,
          },
        },
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        coverImage: true,
      },
    })
    return post
  }

  const post = await prisma.post.create({
    data: {
      ...data,
      revisions: {
        create: {
          title,
          excerpt,
          content,
          authorId,
        },
      },
    },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      coverImage: true,
    },
  })

  return post
}

export const listAdminPosts = async () =>
  prisma.post
    .findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
    })
    .catch((error) => {
      console.error('Không thể truy vấn danh sách bài viết cho quản trị:', error)
      return []
    })

export const deletePost = (postId: string) => prisma.post.delete({ where: { id: postId } })
