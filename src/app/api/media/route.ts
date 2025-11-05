import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { del } from '@vercel/blob'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(media)
}

export async function DELETE(request: NextRequest) {
  const mediaId = request.nextUrl.searchParams.get('id')

  if (!mediaId) {
    return NextResponse.json({ error: 'Thiếu id media' }, { status: 400 })
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } })

  if (!media) {
    return NextResponse.json({ error: 'Media không tồn tại' }, { status: 404 })
  }

  const isBlob = media.url.startsWith('https://')
  const filepath = path.join(UPLOAD_DIR, path.basename(media.url))
  await prisma.media.delete({ where: { id: mediaId } })

  try {
    if (isBlob) {
      try {
        await del(media.url)
      } catch (e) {
        console.warn('Không thể xoá blob từ Vercel Blob:', e)
      }
    } else {
      await fs.unlink(filepath)
    }
  } catch (error) {
    console.warn('Không thể xoá tệp vật lý:', error)
  }

  return NextResponse.json({ success: true })
}
