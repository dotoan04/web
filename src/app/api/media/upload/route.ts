import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

import prisma from '@/lib/prisma'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export async function POST(request: NextRequest) {
  try {
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
    
    let fileUrl: string

    if (IS_PRODUCTION) {
      // Production: Use Vercel Blob
      try {
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: file.type,
        })
        fileUrl = blob.url
      } catch (blobError) {
        console.error('Vercel Blob error:', blobError)
        return NextResponse.json(
          { error: 'Không thể upload file lên Vercel Blob. Kiểm tra BLOB_READ_WRITE_TOKEN trong environment variables.' },
          { status: 500 }
        )
      }
    } else {
      // Development: Use local file system
      const filepath = path.join(UPLOAD_DIR, filename)
      try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true })
        await fs.writeFile(filepath, buffer)
        fileUrl = `/uploads/${filename}`
      } catch (fsError) {
        console.error('File system error:', fsError)
        return NextResponse.json(
          { error: 'Không thể lưu file vào thư mục uploads.' },
          { status: 500 }
        )
      }
    }

    const media = await prisma.media.create({
      data: {
        url: fileUrl,
        title,
        alt,
        type: file.type.startsWith('image') ? 'IMAGE' : 'FILE',
        size: buffer.length,
        uploadedById: uploaderId ?? null,
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi khi upload file' },
      { status: 500 }
    )
  }
}
