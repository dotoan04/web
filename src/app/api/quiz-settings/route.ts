import { NextResponse } from 'next/server'

import { resolveSitePreferences } from '@/server/settings'

export async function GET() {
  const settings = await resolveSitePreferences()
  return NextResponse.json({
    loadingGifUrl: settings.quizLoadingGifUrl,
  })
}
