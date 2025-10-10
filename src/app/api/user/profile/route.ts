import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, 'Tên không được để trống').optional(),
  avatarUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
  bio: z.string().optional(),
})

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }

    const { userId, name, avatarUrl, bio } = parsed.data

    // Chỉ cho phép user cập nhật profile của chính mình
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Không có quyền cập nhật' }, { status: 403 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
        bio: bio?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Không thể cập nhật thông tin' }, { status: 500 })
  }
}

