import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/config'
import { siteSettingsSchema } from '@/lib/validators/settings'
import { getSiteSettings, updateSiteSettings } from '@/server/settings'

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ quản trị viên được cập nhật cài đặt' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = siteSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  await updateSiteSettings(parsed.data)
  revalidatePath('/')
  revalidatePath('/portfolio')
  revalidatePath('/tim-kiem')
  revalidatePath('/gioi-thieu')
  revalidatePath('/offline')
  revalidatePath('/manifest.webmanifest')

  return NextResponse.json({ success: true })
}
