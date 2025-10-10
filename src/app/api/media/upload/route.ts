import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file')
  const title = formData.get('title')?.toString()
  const alt = formData.get('alt')?.toString()
  const uploaderId = formData.get('uploaderId')?.toString()

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu tệp tải lên' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = file.name.split('.').pop() ?? 'bin'
  const filename = `${randomUUID()}.${extension}`
  const filepath = path.join(UPLOAD_DIR, filename)

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(filepath, buffer)

  const media = await prisma.media.create({
    data: {
      url: `/uploads/${filename}`,
      title,
      alt,
      type: file.type.startsWith('image') ? 'IMAGE' : 'FILE',
      size: buffer.length,
      uploadedById: uploaderId ?? null,
    },
  })

  return NextResponse.json(media)
}
