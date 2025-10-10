import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export const listCategories = async () =>
  prisma.category
    .findMany({ orderBy: { name: 'asc' }, include: { posts: true } })
    .catch((error) => {
      console.error('Không thể tải danh sách chuyên mục:', error)
      return []
    })

export const getCategoryOptions = async () =>
  prisma.category
    .findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } })
    .catch((error) => {
      console.error('Không thể tải danh sách chuyên mục (options):', error)
      return []
    })

export const getCategorySlugs = async () =>
  prisma.category
    .findMany({ orderBy: { updatedAt: 'desc' }, select: { slug: true, updatedAt: true } })
    .catch((error) => {
      console.error('Không thể tải danh sách slug chuyên mục:', error)
      return []
    })

export const getCategoryWithPosts = async (slug: string) =>
  prisma.category
    .findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          include: {
            author: true,
            tags: { include: { tag: true } },
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    })
    .catch((error) => {
      console.error('Không thể tải chuyên mục theo slug:', error)
      return null
    })

export const upsertCategory = async (params: {
  id?: string
  name: string
  description?: string
}) => {
  const slug = slugify(params.name)

  if (params.id) {
    return prisma.category.update({
      where: { id: params.id },
      data: { name: params.name, description: params.description, slug },
    })
  }

  return prisma.category.create({
    data: {
      name: params.name,
      description: params.description,
      slug,
    },
  })
}

export const deleteCategory = (id: string) =>
  prisma.category.delete({ where: { id } })
