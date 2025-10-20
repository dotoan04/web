import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/config'
import { workExperienceSchema } from '@/lib/validators/work-experience'
import {
  deleteWorkExperience,
  getWorkExperienceById,
  updateWorkExperience,
} from '@/server/work-experience'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const experience = await getWorkExperienceById(params.id)
    if (!experience) {
      return NextResponse.json({ error: 'Không tìm thấy kinh nghiệm làm việc' }, { status: 404 })
    }
    return NextResponse.json(experience)
  } catch (error) {
    console.error('API lỗi khi lấy kinh nghiệm làm việc:', error)
    return NextResponse.json({ error: 'Không thể tải kinh nghiệm làm việc' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = workExperienceSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const experience = await updateWorkExperience(params.id, parsed.data)
    return NextResponse.json(experience)
  } catch (error) {
    console.error('API lỗi khi cập nhật kinh nghiệm làm việc:', error)
    return NextResponse.json(
      { error: 'Không thể cập nhật kinh nghiệm làm việc' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await deleteWorkExperience(params.id)
    if (!success) {
      return NextResponse.json({ error: 'Không tìm thấy kinh nghiệm làm việc' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API lỗi khi xoá kinh nghiệm làm việc:', error)
    return NextResponse.json({ error: 'Không thể xoá kinh nghiệm làm việc' }, { status: 500 })
  }
}

