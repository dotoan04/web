import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export const listTags = () =>
  prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { posts: { include: { post: true } } },
  })

export const getTagOptions = async () =>
  prisma.tag
    .findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } })
    .catch((error) => {
      console.error('Không thể tải danh sách thẻ (options):', error)
      return []
    })

export const upsertTag = (params: { id?: string; name: string; description?: string }) => {
  const slug = slugify(params.name)

  if (params.id) {
    return prisma.tag.update({
      where: { id: params.id },
      data: { name: params.name, description: params.description, slug },
    })
  }

  return prisma.tag.create({
    data: {
      name: params.name,
      description: params.description,
      slug,
    },
  })
}

export const deleteTag = (id: string) => prisma.tag.delete({ where: { id } })
