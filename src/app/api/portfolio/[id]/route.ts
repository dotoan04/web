import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/config'
import { upsertPortfolioProjectSchema } from '@/lib/validators/portfolio'
import { deletePortfolioProject, getPortfolioProjectById, updatePortfolioProject } from '@/server/portfolio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteParams = {
  params: {
    id: string
  }
}

export async function GET(_: Request, { params }: RouteParams) {
  const project = await getPortfolioProjectById(params.id)
  if (!project) {
    return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = upsertPortfolioProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const project = await updatePortfolioProject(params.id, parsed.data)
    revalidatePath('/portfolio')
    return NextResponse.json(project)
  } catch (error) {
    console.error('Không thể cập nhật dự án:', error)
    return NextResponse.json({ error: 'Không thể cập nhật dự án' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 })
  }

  const deleted = await deletePortfolioProject(params.id)

  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy dự án để xoá' }, { status: 404 })
  }

  revalidatePath('/portfolio')
  return NextResponse.json({ success: true })
}
