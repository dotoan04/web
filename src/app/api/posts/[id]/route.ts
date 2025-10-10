import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { Prisma } from '@/generated/prisma'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/prisma'
import { postInputSchema } from '@/lib/validators/post'
import { deletePost, upsertPost } from '@/server/posts'
import { getServerSession } from 'next-auth'

const paramsSchema = z.object({
  id: z.string(),
})

export async function GET(_request: Request, { params }: { params: unknown }) {
  const { id } = paramsSchema.parse(params)
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      coverImage: true,
    },
  })

  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: { params: unknown }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 })
  }

  const { id } = paramsSchema.parse(params)
  const body = await request.json()
  const parsed = postInputSchema.safeParse({ ...body, id, authorId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const data = parsed.data

  const updated = await upsertPost({
    ...data,
    content: data.content as Prisma.InputJsonValue,
    tagIds: data.tagIds ?? [],
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: unknown }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ quản trị viên được xoá bài viết' }, { status: 403 })
  }

  const { id } = paramsSchema.parse(params)
  await deletePost(id)

  return NextResponse.json({ success: true })
}
