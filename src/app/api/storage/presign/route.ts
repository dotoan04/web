import { NextResponse } from 'next/server'
import { getSpacesClient } from '@/lib/spaces'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const contentType: string = body.contentType || 'application/octet-stream'
    const extension: string = (body.extension || '').toString().replace(/^\./, '') || 'bin'
    const bucket = process.env.SPACES_BUCKET as string
    if (!bucket) {
      return NextResponse.json({ error: 'SPACES_BUCKET is not set' }, { status: 500 })
    }

    const keyBase: string = body.keyBase || `uploads/docx/${Date.now()}`
    const key = `${keyBase}.${extension}`

    const client = getSpacesClient()

    const { url, fields } = await createPresignedPost(client as any, {
      Bucket: bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 50 * 1024 * 1024],
        { 'Content-Type': contentType },
        ['eq', '$acl', 'public-read'],
      ],
      Fields: { 'Content-Type': contentType, acl: 'public-read' },
      Expires: 60, // seconds
    })

    return NextResponse.json({ url, fields, key })
  } catch (error) {
    console.error('Spaces presign error:', error)
    return NextResponse.json({ error: 'Không thể tạo URL upload cho Spaces' }, { status: 500 })
  }
}


