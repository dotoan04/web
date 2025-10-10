import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/prisma'
import { tagSchema } from '@/lib/validators/taxonomy'
import { listTags, upsertTag } from '@/server/tags'
import { getServerSession } from 'next-auth'

export async function GET() {
  const tags = await listTags()
  return NextResponse.json(tags)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = tagSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const tag = await upsertTag(parsed.data)

  return NextResponse.json(tag, { status: parsed.data.id ? 200 : 201 })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền xoá thẻ' }, { status: 403 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })
  }

  await prisma.tag.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
