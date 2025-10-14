import { redirect } from 'next/navigation'

import { SettingsForm } from '@/components/admin/settings-form'
import { getCurrentSession } from '@/lib/auth/session'
import { resolveSitePreferences } from '@/server/settings'

export const metadata = {
  title: 'Cài đặt hệ thống',
}

export default async function SettingsPage() {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin/sign-in')
  }

  const settings = await resolveSitePreferences()
  const ownerSettings = settings.owner ?? {}

  return (
    <SettingsForm
      siteName={settings.siteName}
      tabTitle={settings.tabTitle}
      slogan={settings.slogan}
      heroIntro={settings.heroIntro}
      heroCtaLabel={settings.heroCtaLabel}
      heroCtaLink={settings.heroCtaLink}
      ownerName={ownerSettings.name ?? ''}
      ownerAge={ownerSettings.age ?? null}
      ownerAvatarUrl={ownerSettings.avatarUrl ?? ''}
      education={settings.education}
      certifications={settings.certifications}
      featuredBadges={settings.featuredBadges}
      seoKeywords={settings.seoKeywords}
      seoDescription={settings.seoDescription}
      faviconUrl={settings.faviconUrl ?? ''}
      snowEffectEnabled={settings.snowEffectEnabled}
      sakuraEffectEnabled={settings.sakuraEffectEnabled}
    />
  )
}
