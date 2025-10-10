import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { siteConfig } from '@/lib/metadata'

export const runtime = 'edge'
export const revalidate = 3600

const siteHost = new URL(siteConfig.url).host

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? siteConfig.name
  const description = searchParams.get('description') ?? siteConfig.description

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #fbbf24 100%)',
          color: '#f9fafb',
          padding: '80px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: 24, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(248, 250, 252, 0.75)' }}>
            {siteConfig.name}
          </span>
          <h1
            style={{
              fontSize: 72,
              lineHeight: 1.1,
              fontWeight: 700,
              maxWidth: '900px',
              textShadow: '0 20px 60px rgba(15, 23, 42, 0.6)',
            }}
          >
            {title}
          </h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 28, maxWidth: '720px', color: 'rgba(248, 250, 252, 0.85)' }}>{description}</p>
          <div
            style={{
              borderRadius: '9999px',
              border: '1px solid rgba(248, 250, 252, 0.35)',
              padding: '16px 24px',
              fontSize: 20,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            {siteHost}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
