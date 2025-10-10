import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/config'
import { upsertPortfolioProjectSchema } from '@/lib/validators/portfolio'
import { createPortfolioProject, getPortfolioProjects } from '@/server/portfolio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = await getPortfolioProjects()
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
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
    const project = await createPortfolioProject(parsed.data)
    revalidatePath('/portfolio')
    return NextResponse.json(project)
  } catch (error) {
    console.error('Không thể tạo dự án mới:', error)
    return NextResponse.json({ error: 'Không thể tạo dự án mới' }, { status: 500 })
  }
}
