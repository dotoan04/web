import { NextResponse } from 'next/server'

import type { Prisma } from '@/generated/prisma'
import { postInputSchema } from '@/lib/validators/post'
import { getPublishedPosts, upsertPost } from '@/server/posts'
import { authOptions } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'

export async function GET() {
  const posts = await getPublishedPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = postInputSchema.safeParse({ ...body, authorId: session.user.id })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const data = parsed.data

  const post = await upsertPost({
    ...data,
    content: data.content as Prisma.InputJsonValue,
    authorId: session.user.id,
    tagIds: data.tagIds ?? [],
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
  })

  return NextResponse.json(post, { status: 201 })
}
