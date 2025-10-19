import Script from 'next/script'
import { Suspense } from 'react'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import type { Metadata } from 'next'

import './globals.css'

import { AnalyticsTracker } from '@/components/analytics/analytics-tracker'
import { EffectWrapper } from '@/components/effects/effect-wrapper'
import { Header } from '@/components/header'
import { JsonLd } from '@/components/json-ld'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { SessionProvider } from '@/components/providers/session-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { GoogleVerification } from '@/components/seo/google-verification'
import { absoluteUrl, createMetadata, getMetadataOverrides, siteConfig } from '@/lib/metadata'
import { createOrganizationJsonLd, createSiteJsonLd } from '@/lib/structured-data'
import { resolveSitePreferences } from '@/server/settings'

const headingFont = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['"Segoe UI"', 'sans-serif'],
  adjustFontFallback: true,
})
const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: true,
  preload: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const overrides = await getMetadataOverrides()
  const baseMetadata = createMetadata({}, overrides)
  const baseTitle = overrides.tabTitle ?? overrides.siteName ?? siteConfig.name

  return {
    ...baseMetadata,
    title: {
      default: baseTitle,
      template: `%s | ${baseTitle}`,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: siteConfig.url,
      types: {
        'application/rss+xml': absoluteUrl('/feed.xml'),
        'application/json': absoluteUrl('/feed.json'),
      },
    },
    icons: overrides.faviconUrl
      ? {
          icon: [{ url: overrides.faviconUrl }],
        }
      : {
          icon: ['/favicon.ico'],
        },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const preferences = await resolveSitePreferences()
  const favicon = preferences.faviconUrl ?? '/favicon.ico'
  const slogan = preferences.slogan || 'Viết chậm, học chăm, sống dịu dàng.'

  return (
    <html lang={siteConfig.locales.default.split('-')[0]} suppressHydrationWarning className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <GoogleVerification />
        {siteConfig.social.webmention ? <link rel="webmention" href={siteConfig.social.webmention} /> : null}
        {siteConfig.social.pingback ? <link rel="pingback" href={siteConfig.social.pingback} /> : null}
        <link rel="icon" href={favicon} key="site-favicon" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      </head>
      <body className="min-h-screen bg-ink-50 font-body text-ink-800 antialiased dark:bg-ink-900 dark:text-ink-100">
        <SessionProvider>
          <ThemeProvider>
            <EffectWrapper effectType={preferences.effectType} />
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <PwaRegister />
            <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-12">
              <div className="theme-ambient-glow pointer-events-none absolute inset-x-0 top-0 h-60" />
              <div className="relative z-10 flex min-h-screen flex-col gap-10">
                <Header siteName={preferences.siteName} />
                <main className="flex flex-1 flex-col gap-10">{children}</main>
                <footer className="glass-card border-white/20 bg-white/30 px-6 py-6 text-center text-xs text-ink-400 shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:border-white/10 dark:bg-white/5 dark:text-ink-300 dark:shadow-[0_8px_32px_rgba(31,38,135,0.25)]">
                  © {new Date().getFullYear()} {preferences.siteName} · {slogan}
                </footer>
              </div>
            </div>
          </ThemeProvider>
        </SessionProvider>
        <JsonLd data={createSiteJsonLd({ name: preferences.siteName, description: preferences.seoDescription || preferences.slogan || siteConfig.description })} />
        <JsonLd data={createOrganizationJsonLd({ name: preferences.siteName, logo: preferences.faviconUrl ?? absoluteUrl(`/og?title=${encodeURIComponent(preferences.siteName)}`) })} />
        {siteConfig.analytics.plausibleDomain ? (
          <Script
            strategy="afterInteractive"
            data-domain={siteConfig.analytics.plausibleDomain}
            src="https://plausible.io/js/script.tagged-events.js"
          />
        ) : null}
        {siteConfig.analytics.clarityId ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${siteConfig.analytics.clarityId}");
            `}
          </Script>
        ) : null}
      </body>
    </html>
  )
}
