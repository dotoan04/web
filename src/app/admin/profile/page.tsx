import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/session'
import { ProfileForm } from '@/components/admin/profile-form'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Hồ sơ cá nhân | BlogVibe',
}

export default async function ProfilePage() {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/admin/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
    },
  })

  if (!user) {
    redirect('/admin/sign-in')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Cập nhật thông tin cá nhân và ảnh đại diện của bạn.
        </p>
      </div>
      <ProfileForm
        userId={user.id}
        name={user.name ?? ''}
        email={user.email}
        avatarUrl={user.avatarUrl ?? ''}
        bio={user.bio ?? ''}
      />
    </div>
  )
}

