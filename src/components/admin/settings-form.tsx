'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  siteName: string
  tabTitle: string
  slogan?: string
  heroIntro?: string
  heroCtaLabel?: string | null
  heroCtaLink?: string | null
  ownerName?: string
  ownerAge?: number | null
  ownerAvatarUrl?: string | null
  education?: string
  certifications?: string[]
  featuredBadges?: string[]
  seoKeywords?: string[]
  seoDescription?: string
  faviconUrl?: string | null
  effectType?: 'none' | 'snow' | 'sakura'
  parallaxCharacterUrl?: string | null
  quizLoadingGifUrl?: string | null
}

export const SettingsForm = ({
  siteName,
  tabTitle,
  slogan,
  heroIntro,
  heroCtaLabel,
  heroCtaLink,
  ownerName,
  ownerAge,
  ownerAvatarUrl,
  education,
  certifications,
  featuredBadges,
  seoKeywords,
  seoDescription,
  faviconUrl,
  effectType,
  parallaxCharacterUrl,
  quizLoadingGifUrl,
}: Props) => {
  const [values, setValues] = useState({
    siteName,
    tabTitle,
    slogan: slogan ?? '',
    heroIntro: heroIntro ?? '',
    heroCtaLabel: heroCtaLabel ?? '',
    heroCtaLink: heroCtaLink ?? '',
    ownerName: ownerName ?? '',
    ownerAge: ownerAge != null ? String(ownerAge) : '',
    ownerAvatarUrl: ownerAvatarUrl ?? '',
    education: education ?? '',
    certifications: certifications?.join(', ') ?? '',
    featuredBadges: featuredBadges?.join(', ') ?? 'Cuộc sống, Lập trình, Sản xuất nội dung',
    seoKeywords: seoKeywords?.join(', ') ?? '',
    seoDescription: seoDescription ?? '',
    faviconUrl: faviconUrl ?? '',
    parallaxCharacterUrl: parallaxCharacterUrl ?? '',
    quizLoadingGifUrl: quizLoadingGifUrl ?? '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEffect, setSelectedEffect] = useState<'none' | 'snow' | 'sakura'>(effectType ?? 'sakura')

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
      const badgeArray = values.featuredBadges
        .split(',')
        .map((badge) => badge.trim())
        .filter(Boolean)
      const keywordArray = values.seoKeywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
      const payload = {
        ...values,
        siteName: values.siteName.trim(),
        tabTitle: values.tabTitle.trim() || values.siteName.trim(),
        slogan: values.slogan.trim() || undefined,
        heroIntro: values.heroIntro.trim() || undefined,
        heroCtaLabel: values.heroCtaLabel.trim() || undefined,
        heroCtaLink: values.heroCtaLink.trim(),
        ownerName: values.ownerName.trim() || undefined,
        ownerAge: parsedAge != null && Number.isFinite(parsedAge) ? parsedAge : null,
        ownerAvatarUrl: values.ownerAvatarUrl.trim() ? values.ownerAvatarUrl.trim() : null,
        education: values.education.trim() || undefined,
        certifications: certArray.length > 0 ? certArray : undefined,
        featuredBadges: badgeArray.length > 0 ? badgeArray : undefined,
        seoKeywords: keywordArray.length > 0 ? keywordArray : undefined,
        seoDescription: values.seoDescription.trim() || undefined,
        faviconUrl: values.faviconUrl.trim() ? values.faviconUrl.trim() : null,
        effectType: selectedEffect,
        parallaxCharacterUrl: values.parallaxCharacterUrl.trim() ? values.parallaxCharacterUrl.trim() : null,
        quizLoadingGifUrl: values.quizLoadingGifUrl.trim() ? values.quizLoadingGifUrl.trim() : null,
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
        <CardDescription>Điều chỉnh thương hiệu, giao diện và thông tin mô tả trên toàn bộ trang.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="siteName">
                Tên hiển thị trên giao diện
              </label>
              <Input
                id="siteName"
                value={values.siteName}
                onChange={(event) => setValues((prev) => ({ ...prev, siteName: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="tabTitle">
                Tiêu đề hiển thị trên tab trình duyệt
              </label>
              <Input
                id="tabTitle"
                value={values.tabTitle}
                onChange={(event) => setValues((prev) => ({ ...prev, tabTitle: event.target.value }))}
                required
              />
            </div>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="featuredBadges">
                Nhãn nổi bật dưới banner (phân cách bằng dấu phẩy)
              </label>
              <Input
                id="featuredBadges"
                value={values.featuredBadges}
                onChange={(event) => setValues((prev) => ({ ...prev, featuredBadges: event.target.value }))}
                placeholder="Ví dụ: Cuộc sống, Lập trình, Sản xuất nội dung"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="faviconUrl">
                Favicon (URL)
              </label>
              <Input
                id="faviconUrl"
                value={values.faviconUrl}
                onChange={(event) => setValues((prev) => ({ ...prev, faviconUrl: event.target.value }))}
                placeholder="https://.../favicon.png"
              />
              <p className="mt-1 text-xs text-ink-400">Sử dụng ảnh vuông PNG hoặc ICO. Có thể lấy từ thư viện media.</p>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="seoKeywords">
                Từ khoá SEO (phân cách bằng dấu phẩy)
              </label>
              <Textarea
                id="seoKeywords"
                rows={3}
                value={values.seoKeywords}
                onChange={(event) => setValues((prev) => ({ ...prev, seoKeywords: event.target.value }))}
                placeholder="Ví dụ: blog cá nhân, kinh nghiệm lập trình, phong cách sống"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="seoDescription">
                Mô tả SEO ngắn gọn
              </label>
              <Textarea
                id="seoDescription"
                rows={3}
                value={values.seoDescription}
                onChange={(event) => setValues((prev) => ({ ...prev, seoDescription: event.target.value }))}
                placeholder="Tóm tắt nội dung trang để cải thiện khả năng xuất hiện trên công cụ tìm kiếm."
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-600">
              Hiệu ứng hạt rơi trên giao diện
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="radio"
                  name="effectType"
                  value="none"
                  checked={selectedEffect === 'none'}
                  onChange={() => setSelectedEffect('none')}
                  className="h-4 w-4 border-ink-300 text-ink-600 focus:ring-ink-500"
                />
                Không hiệu ứng
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="radio"
                  name="effectType"
                  value="snow"
                  checked={selectedEffect === 'snow'}
                  onChange={() => setSelectedEffect('snow')}
                  className="h-4 w-4 border-ink-300 text-ink-600 focus:ring-ink-500"
                />
                Tuyết rơi
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="radio"
                  name="effectType"
                  value="sakura"
                  checked={selectedEffect === 'sakura'}
                  onChange={() => setSelectedEffect('sakura')}
                  className="h-4 w-4 border-ink-300 text-ink-600 focus:ring-ink-500"
                />
                Hoa anh đào rơi
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="parallaxCharacterUrl">
              Ảnh nhân vật parallax (trang chủ)
            </label>
            <Input
              id="parallaxCharacterUrl"
              value={values.parallaxCharacterUrl}
              onChange={(event) => setValues((prev) => ({ ...prev, parallaxCharacterUrl: event.target.value }))}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-ink-400">
              Ảnh nhân vật anime sẽ hiển thị với hiệu ứng parallax ở phần hero trang chủ.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="quizLoadingGifUrl">
              Ảnh GIF loading quiz
            </label>
            <Input
              id="quizLoadingGifUrl"
              value={values.quizLoadingGifUrl}
              onChange={(event) => setValues((prev) => ({ ...prev, quizLoadingGifUrl: event.target.value }))}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-ink-400">
              Ảnh GIF sẽ hiển thị khi đang chấm điểm quiz. Để trống nếu không muốn hiển thị GIF.
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
