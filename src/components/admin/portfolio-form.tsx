'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { slugify } from '@/lib/utils'

type PortfolioProjectFormData = {
  id?: string
  title: string
  slug: string
  summary: string
  description: string
  timeline: string
  role: string
  technologies: string
  projectUrl: string
  repoUrl: string
  sortOrder: string
}

type PortfolioFormProps = {
  project?: {
    id: string
    title: string
    slug: string
    summary: string | null
    description: string | null
    timeline: string | null
    role: string | null
    technologies: string[]
    projectUrl: string | null
    repoUrl: string | null
    sortOrder: number
  }
}

export const PortfolioForm = ({ project }: PortfolioFormProps) => {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [slugLocked, setSlugLocked] = useState(Boolean(project))

  const [values, setValues] = useState<PortfolioProjectFormData>({
    id: project?.id,
    title: project?.title ?? '',
    slug: project?.slug ?? '',
    summary: project?.summary ?? '',
    description: project?.description ?? '',
    timeline: project?.timeline ?? '',
    role: project?.role ?? '',
    technologies: project?.technologies?.join(', ') ?? '',
    projectUrl: project?.projectUrl ?? '',
    repoUrl: project?.repoUrl ?? '',
    sortOrder: project ? String(project.sortOrder) : '0',
  })

  useEffect(() => {
    if (slugLocked) return
    const suggested = slugify(values.title || 'du-an-moi')
    if (suggested === values.slug) return
    setValues((prev) => ({ ...prev, slug: suggested }))
  }, [slugLocked, values.title, values.slug])

  const handleChange = (field: keyof PortfolioProjectFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      if (field === 'slug') {
        setSlugLocked(true)
      }
      setValues((prev) => ({ ...prev, [field]: value }))
    }

  const technologiesArray = useMemo(
    () =>
      values.technologies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [values.technologies]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        summary: values.summary || undefined,
        description: values.description || undefined,
        timeline: values.timeline || undefined,
        role: values.role || undefined,
        technologies: technologiesArray,
        projectUrl: values.projectUrl || undefined,
        repoUrl: values.repoUrl || undefined,
        sortOrder: Number(values.sortOrder || 0),
      }

      const response = await fetch(project ? `/api/portfolio/${project.id}` : '/api/portfolio', {
        method: project ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ? JSON.stringify(data.error) : 'Không thể lưu dự án')
      }

      setMessage('Đã lưu dự án thành công.')
      router.refresh() // Refresh to show updated data
      if (!project && data.id) {
        setTimeout(() => {
          router.push(`/admin/portfolio/${data.id}`)
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
    if (!project) return
    const confirm = window.confirm('Bạn có chắc chắn muốn xoá dự án này? Thao tác không thể hoàn tác.')
    if (!confirm) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/portfolio/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Không thể xoá dự án')
      }

      router.push('/admin/portfolio')
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
          <CardTitle className="text-2xl">{project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</CardTitle>
          <CardDescription>Quản lý những dự án tiêu biểu sẽ hiển thị trên trang Portfolio.</CardDescription>
        </div>
        {project ? (
          <Button variant="ghost" type="button" onClick={handleDelete} disabled={loading}>
            Xoá dự án
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="title">
                Tên dự án
              </label>
              <Input id="title" value={values.title} onChange={handleChange('title')} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="slug">
                Slug
              </label>
              <Input
                id="slug"
                value={values.slug}
                onChange={handleChange('slug')}
                onBlur={() => setValues((prev) => ({ ...prev, slug: slugify(prev.slug) }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="timeline">
                Thời gian thực hiện
              </label>
              <Input id="timeline" value={values.timeline} onChange={handleChange('timeline')} placeholder="2022 - 2023" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="role">
                Vai trò
              </label>
              <Input id="role" value={values.role} onChange={handleChange('role')} placeholder="Full-stack Developer" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="summary">
              Tóm tắt ngắn
            </label>
            <Textarea
              id="summary"
              rows={3}
              value={values.summary}
              onChange={handleChange('summary')}
              placeholder="Mô tả nhanh giá trị mang lại cho dự án."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="description">
              Mô tả chi tiết
            </label>
            <Textarea
              id="description"
              rows={6}
              value={values.description}
              onChange={handleChange('description')}
              placeholder="Trình bày mục tiêu, thách thức, giải pháp và kết quả."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="technologies">
                Công nghệ sử dụng (phân tách bởi dấu phẩy)
              </label>
              <Input
                id="technologies"
                value={values.technologies}
                onChange={handleChange('technologies')}
                placeholder="Next.js, Prisma, PostgreSQL"
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="projectUrl">
                Liên kết dự án
              </label>
              <Input
                id="projectUrl"
                value={values.projectUrl}
                onChange={handleChange('projectUrl')}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="repoUrl">
                Liên kết mã nguồn
              </label>
              <Input id="repoUrl" value={values.repoUrl} onChange={handleChange('repoUrl')} placeholder="https://github.com/..." />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              {message ? <p className="text-emerald-600 dark:text-emerald-400">{message}</p> : null}
              {error ? <p className="text-rose-600 dark:text-rose-400">{error}</p> : null}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu dự án'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
