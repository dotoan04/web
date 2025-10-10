import { redirect } from 'next/navigation'

import { SettingsForm } from '@/components/admin/settings-form'
import { getCurrentSession } from '@/lib/auth/session'
import { getSiteSettings } from '@/server/settings'

export const metadata = {
  title: 'Cài đặt hệ thống | BlogVibe',
}

export default async function SettingsPage() {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  const settings = await getSiteSettings()
  const ownerSettings = (settings['portfolio.owner'] as { name?: string; age?: number | null; avatarUrl?: string | null }) ?? {}

  return (
    <SettingsForm
      siteName={(settings['site.name'] as string) ?? 'BlogVibe Coding'}
      slogan={(settings['site.slogan'] as string) ?? (settings['site.tagline'] as string) ?? ''}
      heroIntro={((settings['site.hero'] as { intro?: string })?.intro) ?? ''}
      heroCtaLabel={((settings['site.hero'] as { ctaLabel?: string })?.ctaLabel) ?? null}
      heroCtaLink={((settings['site.hero'] as { ctaLink?: string })?.ctaLink) ?? null}
      ownerName={ownerSettings.name ?? ''}
      ownerAge={ownerSettings.age ?? null}
      ownerAvatarUrl={ownerSettings.avatarUrl ?? ''}
      education={(settings['portfolio.education'] as string) ?? ''}
      certifications={(settings['portfolio.certifications'] as string[]) ?? []}
    />
  )
}
