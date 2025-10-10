'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  siteName: string
  slogan?: string
  heroIntro?: string
  heroCtaLabel?: string | null
  heroCtaLink?: string | null
  ownerName?: string
  ownerAge?: number | null
  ownerAvatarUrl?: string | null
  education?: string
  certifications?: string[]
}

export const SettingsForm = ({
  siteName,
  slogan,
  heroIntro,
  heroCtaLabel,
  heroCtaLink,
  ownerName,
  ownerAge,
  ownerAvatarUrl,
  education,
  certifications,
}: Props) => {
  const [values, setValues] = useState({
    siteName,
    slogan: slogan ?? '',
    heroIntro: heroIntro ?? '',
    heroCtaLabel: heroCtaLabel ?? '',
    heroCtaLink: heroCtaLink ?? '',
    ownerName: ownerName ?? '',
    ownerAge: ownerAge != null ? String(ownerAge) : '',
    ownerAvatarUrl: ownerAvatarUrl ?? '',
    education: education ?? '',
    certifications: certifications?.join(', ') ?? '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const trimmedAge = values.ownerAge.trim()
      const parsedAge = trimmedAge ? Number(trimmedAge) : null
      const certArray = values.certifications
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
      const payload = {
        ...values,
        siteName: values.siteName.trim(),
        slogan: values.slogan.trim() || undefined,
        heroIntro: values.heroIntro.trim() || undefined,
        heroCtaLabel: values.heroCtaLabel.trim() || undefined,
        heroCtaLink: values.heroCtaLink.trim(),
        ownerName: values.ownerName.trim() || undefined,
        ownerAge: parsedAge != null && Number.isFinite(parsedAge) ? parsedAge : null,
        ownerAvatarUrl: values.ownerAvatarUrl.trim() ? values.ownerAvatarUrl.trim() : null,
        education: values.education.trim() || undefined,
        certifications: certArray.length > 0 ? certArray : undefined,
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Không thể lưu cài đặt')
      }
      setMessage('Đã cập nhật thông tin trang thành công.')
    } catch (error) {
      console.error(error)
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt giao diện</CardTitle>
        <CardDescription>Điều chỉnh thông tin mô tả và lời chào trên trang chủ.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="siteName">
              Tên trang
            </label>
            <Input
              id="siteName"
              value={values.siteName}
              onChange={(event) => setValues((prev) => ({ ...prev, siteName: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="slogan">
              Slogan / Khẩu hiệu
            </label>
            <Input
              id="slogan"
              value={values.slogan}
              onChange={(event) => setValues((prev) => ({ ...prev, slogan: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="heroIntro">
              Đoạn giới thiệu trên banner
            </label>
            <Textarea
              id="heroIntro"
              rows={4}
              value={values.heroIntro}
              onChange={(event) => setValues((prev) => ({ ...prev, heroIntro: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="heroCtaLabel">
                Nhãn nút kêu gọi hành động
              </label>
              <Input
                id="heroCtaLabel"
                value={values.heroCtaLabel}
                onChange={(event) => setValues((prev) => ({ ...prev, heroCtaLabel: event.target.value }))}
                placeholder="Ví dụ: Khám phá portfolio"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="heroCtaLink">
                Liên kết nút kêu gọi hành động
              </label>
              <Input
                id="heroCtaLink"
                value={values.heroCtaLink}
                onChange={(event) => setValues((prev) => ({ ...prev, heroCtaLink: event.target.value }))}
                placeholder="https://"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="ownerName">
                Tên hiển thị trên portfolio
              </label>
              <Input
                id="ownerName"
                value={values.ownerName}
                onChange={(event) => setValues((prev) => ({ ...prev, ownerName: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="ownerAge">
                Tuổi
              </label>
              <Input
                id="ownerAge"
                type="number"
                min={10}
                max={120}
                value={values.ownerAge}
                onChange={(event) => setValues((prev) => ({ ...prev, ownerAge: event.target.value }))}
                placeholder="VD: 28"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="ownerAvatarUrl">
              Ảnh đại diện (URL)
            </label>
            <Input
              id="ownerAvatarUrl"
              value={values.ownerAvatarUrl}
              onChange={(event) => setValues((prev) => ({ ...prev, ownerAvatarUrl: event.target.value }))}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-ink-400">
              Gợi ý: sử dụng ảnh vuông 512×512px lưu trong thư viện media hoặc một dịch vụ CDN.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="education">
              Quá trình học tập
            </label>
            <Input
              id="education"
              value={values.education}
              onChange={(event) => setValues((prev) => ({ ...prev, education: event.target.value }))}
              placeholder="VD: Đại học Bách Khoa Hà Nội"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="certifications">
              Chứng chỉ (phân cách bằng dấu phẩy)
            </label>
            <Input
              id="certifications"
              value={values.certifications}
              onChange={(event) => setValues((prev) => ({ ...prev, certifications: event.target.value }))}
              placeholder="VD: AWS Solutions Architect, Google Cloud Engineer"
            />
            <p className="mt-1 text-xs text-ink-400">
              Nhập các chứng chỉ của bạn, phân cách bằng dấu phẩy.
            </p>
          </div>
          <div className="flex items-center justify-between">
            {message ? <p className="text-sm text-ink-500">{message}</p> : <span />}
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
