import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/prisma'
import { categorySchema } from '@/lib/validators/taxonomy'
import { listCategories, upsertCategory } from '@/server/categories'
import { getServerSession } from 'next-auth'

export async function GET() {
  const categories = await listCategories()
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !['ADMIN', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = categorySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const category = await upsertCategory(parsed.data)

  return NextResponse.json(category, { status: parsed.data.id ? 200 : 201 })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền xoá chuyên mục' }, { status: 403 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })
  }

  await prisma.category.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
