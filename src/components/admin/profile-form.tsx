'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SmartImage } from '@/components/ui/smart-image'

type Props = {
  userId: string
  name: string
  email: string
  avatarUrl: string
  bio: string
}

export const ProfileForm = ({ userId, name, email, avatarUrl, bio }: Props) => {
  const router = useRouter()
  const { update } = useSession()
  const [values, setValues] = useState({
    name,
    avatarUrl,
    bio,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: values.name.trim() || undefined,
          avatarUrl: values.avatarUrl.trim() || undefined,
          bio: values.bio.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Không thể cập nhật thông tin')
      }

      // Update session first to reflect new changes
      const updatedUser = data.user as { name?: string | null; avatarUrl?: string | null } | undefined
      if (update && updatedUser) {
        await update({
          name: updatedUser.name ?? undefined,
          avatarUrl: updatedUser.avatarUrl ?? null,
        })
      }
      
      setMessage({ type: 'success', text: 'Đã cập nhật thông tin thành công!' })
      router.refresh()
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
        <CardDescription>Cập nhật tên hiển thị, ảnh đại diện và tiểu sử của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300" htmlFor="email">
              Email
            </label>
            <Input id="email" value={email} disabled className="bg-ink-50 dark:bg-ink-800" />
            <p className="mt-1 text-xs text-ink-400">Email không thể thay đổi.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300" htmlFor="name">
              Tên hiển thị
            </label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300" htmlFor="avatarUrl">
              Ảnh đại diện (URL)
            </label>
            <Input
              id="avatarUrl"
              value={values.avatarUrl}
              onChange={(event) => setValues((prev) => ({ ...prev, avatarUrl: event.target.value }))}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-ink-400">
              Sử dụng ảnh vuông 256×256px từ thư viện media hoặc URL bên ngoài.
            </p>
            {values.avatarUrl && (
              <div className="mt-3">
                <SmartImage
                  src={values.avatarUrl}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full border border-ink-200 object-cover dark:border-ink-700"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300" htmlFor="bio">
              Tiểu sử
            </label>
            <Textarea
              id="bio"
              value={values.bio}
              onChange={(event) => setValues((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="Giới thiệu ngắn về bạn..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between">
            {message ? (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

