import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/options'
import { workExperienceSchema } from '@/lib/validators/work-experience'
import { createWorkExperience, getWorkExperiences } from '@/server/work-experience'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const experiences = await getWorkExperiences()
    return NextResponse.json(experiences)
  } catch (error) {
    console.error('API lỗi khi lấy danh sách kinh nghiệm làm việc:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách kinh nghiệm làm việc' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const experience = await createWorkExperience(parsed.data)
    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error('API lỗi khi tạo kinh nghiệm làm việc:', error)
    return NextResponse.json({ error: 'Không thể tạo kinh nghiệm làm việc' }, { status: 500 })
  }
}

