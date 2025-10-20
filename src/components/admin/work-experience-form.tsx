'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type WorkExperienceFormData = {
  id?: string
  company: string
  position: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
  location: string
  sortOrder: string
}

type WorkExperienceFormProps = {
  experience?: {
    id: string
    company: string
    position: string
    startDate: Date
    endDate: Date | null
    isCurrent: boolean
    description: string | null
    location: string | null
    sortOrder: number
  }
}

export const WorkExperienceForm = ({ experience }: WorkExperienceFormProps) => {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [values, setValues] = useState<WorkExperienceFormData>({
    id: experience?.id,
    company: experience?.company ?? '',
    position: experience?.position ?? '',
    startDate: experience?.startDate
      ? new Date(experience.startDate).toISOString().split('T')[0]
      : '',
    endDate: experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '',
    isCurrent: experience?.isCurrent ?? false,
    description: experience?.description ?? '',
    location: experience?.location ?? '',
    sortOrder: experience ? String(experience.sortOrder) : '0',
  })

  const handleChange = (field: keyof WorkExperienceFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const payload = {
        company: values.company,
        position: values.position,
        startDate: values.startDate,
        endDate: values.isCurrent ? null : values.endDate || null,
        isCurrent: values.isCurrent,
        description: values.description || undefined,
        location: values.location || undefined,
        sortOrder: Number(values.sortOrder || 0),
      }

      const response = await fetch(
        experience ? `/api/work-experience/${experience.id}` : '/api/work-experience',
        {
          method: experience ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ? JSON.stringify(data.error) : 'Không thể lưu kinh nghiệm làm việc')
      }

      setMessage('Đã lưu kinh nghiệm làm việc thành công.')
      router.refresh() // Refresh to show updated data
      if (!experience && data.id) {
        setTimeout(() => {
          router.push(`/admin/work-experience/${data.id}`)
        }, 500)
      }
    } catch (thrown) {
      console.error(thrown)
      setError((thrown as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!experience) return
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn xoá kinh nghiệm này? Thao tác không thể hoàn tác.'
    )
    if (!confirm) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/work-experience/${experience.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Không thể xoá kinh nghiệm')
      }

      router.push('/admin/work-experience')
    } catch (thrown) {
      console.error(thrown)
      setError((thrown as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl">
            {experience ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm mới'}
          </CardTitle>
          <CardDescription>
            Quản lý kinh nghiệm làm việc sẽ hiển thị trên trang Portfolio.
          </CardDescription>
        </div>
        {experience ? (
          <Button variant="ghost" type="button" onClick={handleDelete} disabled={loading}>
            Xoá kinh nghiệm
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="company">
                Tên công ty / Tổ chức
              </label>
              <Input id="company" value={values.company} onChange={handleChange('company')} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="position">
                Chức vụ
              </label>
              <Input
                id="position"
                value={values.position}
                onChange={handleChange('position')}
                placeholder="Software Engineer"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="startDate">
                Ngày bắt đầu
              </label>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={handleChange('startDate')}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="endDate">
                Ngày kết thúc
              </label>
              <Input
                id="endDate"
                type="date"
                value={values.endDate}
                onChange={handleChange('endDate')}
                disabled={values.isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={values.isCurrent}
              onChange={handleChange('isCurrent')}
              className="h-4 w-4 rounded border-ink-300 text-ink-600 focus:ring-ink-500"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-ink-600">
              Đang làm việc tại đây
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="location">
              Địa điểm
            </label>
            <Input
              id="location"
              value={values.location}
              onChange={handleChange('location')}
              placeholder="Hà Nội, Việt Nam"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="description">
              Mô tả công việc và thành tích
            </label>
            <Textarea
              id="description"
              rows={6}
              value={values.description}
              onChange={handleChange('description')}
              placeholder="Mô tả những gì bạn đã học được, dự án tham gia, công nghệ sử dụng..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="sortOrder">
              Thứ tự hiển thị
            </label>
            <Input
              id="sortOrder"
              type="number"
              value={values.sortOrder}
              onChange={handleChange('sortOrder')}
              min={0}
            />
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              {message ? <p className="text-emerald-600 dark:text-emerald-400">{message}</p> : null}
              {error ? <p className="text-rose-600 dark:text-rose-400">{error}</p> : null}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu kinh nghiệm'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

