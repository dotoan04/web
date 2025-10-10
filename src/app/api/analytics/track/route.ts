import { NextResponse } from 'next/server'
import { z } from 'zod'

import { recordVisit } from '@/server/analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const payloadSchema = z.object({
  path: z.string().min(1),
  referrer: z.string().optional(),
  source: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  const parsed = payloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '0.0.0.0'
  const userAgent = request.headers.get('user-agent') ?? null
  const country = request.headers.get('x-vercel-ip-country') ?? request.headers.get('x-country') ?? null
  const city = request.headers.get('x-vercel-ip-city') ?? request.headers.get('x-city') ?? null

  await recordVisit({
    path: parsed.data.path,
    ip,
    userAgent,
    referrer: parsed.data.referrer ?? null,
    source: parsed.data.source ?? null,
    country,
    city,
  })

  return NextResponse.json({ success: true })
}
