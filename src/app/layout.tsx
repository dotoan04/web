import Script from 'next/script'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { Header } from '@/components/header'
import type { Metadata } from 'next'
import { absoluteUrl, createMetadata, siteConfig } from '@/lib/metadata'
import { createOrganizationJsonLd, createSiteJsonLd } from '@/lib/structured-data'
import { JsonLd } from '@/components/json-ld'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { AnalyticsTracker } from '@/components/analytics/analytics-tracker'

const headingFont = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})
const bodyFont = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  ...createMetadata(),
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: siteConfig.url,
    types: {
      'application/rss+xml': absoluteUrl('/feed.xml'),
      'application/json': absoluteUrl('/feed.json'),
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={siteConfig.locales.default.split('-')[0]} suppressHydrationWarning className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        {siteConfig.social.webmention ? <link rel="webmention" href={siteConfig.social.webmention} /> : null}
        {siteConfig.social.pingback ? <link rel="pingback" href={siteConfig.social.pingback} /> : null}
      </head>
      <body className="min-h-screen bg-ink-50 font-body text-ink-800 antialiased dark:bg-ink-900 dark:text-ink-100">
        <SessionProvider>
          <ThemeProvider>
            <AnalyticsTracker />
            <PwaRegister />
            <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-12">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(circle_at_top,_rgba(128,98,58,0.2)_0%,_rgba(244,242,236,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(159,127,81,0.18)_0%,_rgba(27,20,14,0)_75%)]" />
              <div className="relative z-10 flex min-h-screen flex-col gap-10">
                <Header />
                <main className="flex flex-1 flex-col gap-10">{children}</main>
                <footer className="rounded-[2rem] border border-ink-100 bg-white/70 px-6 py-6 text-center text-xs text-ink-400 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
                  © {new Date().getFullYear()} BlogVibe Coding · Viết chậm, học chăm, sống dịu dàng.
                </footer>
              </div>
            </div>
          </ThemeProvider>
        </SessionProvider>
        <JsonLd data={createSiteJsonLd()} />
        <JsonLd data={createOrganizationJsonLd()} />
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
