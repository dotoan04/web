'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FileUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/components/ui/cn'
import { postInputSchema } from '@/lib/validators/post'
import { parseMarkdownFile, markdownToTipTapJSON } from '@/lib/markdown-parser'
import type { PostWithRelations } from '@/server/posts'

type Option = {
  id: string
  name: string
}

type PostEditorProps = {
  authorId: string
  categories: Option[]
  tags: Option[]
  defaultValues?: Partial<PostWithRelations>
}

const formSchema = postInputSchema.omit({ authorId: true })

type FormValues = z.input<typeof formSchema>

export const PostEditor = ({ authorId, categories, tags, defaultValues }: PostEditorProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const markdownFileInputRef = useRef<HTMLInputElement | null>(null)

  const initialValues: FormValues = useMemo(() => {
    if (!defaultValues) {
      return {
        title: '',
        slug: '',
        excerpt: '',
        content: { type: 'doc', content: [] },
        tagIds: [],
        categoryId: null,
        status: 'DRAFT',
        publishedAt: undefined,
        coverImageId: null,
      }
    }

    return {
      title: defaultValues.title ?? '',
      slug: defaultValues.slug ?? '',
      excerpt: defaultValues.excerpt ?? '',
      content:
        (defaultValues.content as Record<string, unknown>) ?? (
          {
            type: 'doc',
            content: [],
          } as Record<string, unknown>
        ),
      tagIds: defaultValues.tags?.map((tag) => tag.tagId) ?? [],
      categoryId: defaultValues.categoryId ?? null,
      status: defaultValues.status ?? 'DRAFT',
      publishedAt: defaultValues.publishedAt?.toISOString(),
      coverImageId: defaultValues.coverImageId ?? null,
    }
  }, [defaultValues])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset(initialValues)
  }, [form, initialValues])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setMessage(null)
    try {
      const payload = {
        ...values,
        authorId,
        tagIds: values.tagIds ?? [],
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
        coverImageId: values.coverImageId || null,
      }

      const response = await fetch(defaultValues?.id ? `/api/posts/${defaultValues.id}` : '/api/posts', {
        method: defaultValues?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        const errorMsg = typeof error.error === 'string' 
          ? error.error 
          : JSON.stringify(error.error, null, 2)
        throw new Error('Lỗi: ' + (errorMsg ?? 'Không thể lưu bài viết'))
      }

      setMessage('Đã lưu bài viết thành công!')
      // Redirect after successful save
      if (!defaultValues?.id) {
        setTimeout(() => {
          window.location.href = '/admin/posts'
        }, 1500)
      }
    } catch (error) {
      console.error('Submit error:', error)
      setMessage((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  })

  const toggleTag = (tagId: string) => {
    const selected = form.getValues('tagIds') ?? []
    if (selected.includes(tagId)) {
      form.setValue('tagIds', selected.filter((id) => id !== tagId), { shouldDirty: true })
    } else {
      form.setValue('tagIds', [...selected, tagId], { shouldDirty: true })
    }
  }

  const status = form.watch('status')

  const handleMarkdownImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    try {
      const fileContent = await file.text()
      const { metadata, content } = parseMarkdownFile(fileContent)
      
      // Convert markdown content to TipTap JSON
      const tipTapJSON = await markdownToTipTapJSON(content)

      // Update form with parsed data
      form.setValue('title', metadata.title || '', { shouldDirty: true })
      form.setValue('slug', metadata.slug || '', { shouldDirty: true })
      form.setValue('excerpt', metadata.excerpt || '', { shouldDirty: true })
      form.setValue('content', tipTapJSON, { shouldDirty: true })
      
      if (metadata.categoryId) {
        form.setValue('categoryId', metadata.categoryId, { shouldDirty: true })
      }
      
      if (metadata.tagIds && metadata.tagIds.length > 0) {
        form.setValue('tagIds', metadata.tagIds, { shouldDirty: true })
      }
      
      if (metadata.status) {
        form.setValue('status', metadata.status, { shouldDirty: true })
      }
      
      if (metadata.publishedAt) {
        form.setValue('publishedAt', metadata.publishedAt, { shouldDirty: true })
      }
      
      if (metadata.coverImageId) {
        form.setValue('coverImageId', metadata.coverImageId, { shouldDirty: true })
      }

      setMessage('✨ Đã import file Markdown thành công!')
    } catch (error) {
      console.error('Import markdown error:', error)
      setMessage('❌ Lỗi khi import file Markdown: ' + (error as Error).message)
    } finally {
      setImporting(false)
      // Reset input
      if (markdownFileInputRef.current) {
        markdownFileInputRef.current.value = ''
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input
        ref={markdownFileInputRef}
        type="file"
        accept=".md,.mdx,.markdown"
        className="hidden"
        onChange={handleMarkdownImport}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Tiêu đề, tóm tắt và cấu trúc bài viết.</CardDescription>
          </div>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => markdownFileInputRef.current?.click()}
            disabled={importing}
            className="gap-2"
          >
            <FileUp size={16} />
            {importing ? 'Đang import...' : 'Import Markdown'}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-600" htmlFor="title">
              Tiêu đề
            </label>
            <Input id="title" placeholder="Tiêu đề bài viết" {...form.register('title')} />
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.title?.message}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-600" htmlFor="slug">
              Đường dẫn (slug)
            </label>
            <Input id="slug" placeholder="blog-moi" {...form.register('slug')} />
            <p className="mt-1 text-xs text-ink-400">
              Để trống nếu muốn hệ thống tự tạo dựa trên tiêu đề.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-600" htmlFor="excerpt">
              Tóm tắt
            </label>
            <Textarea id="excerpt" rows={3} placeholder="Viết mô tả ngắn gọn để thu hút người đọc." {...form.register('excerpt')} />
          </div>

          <Controller
            control={form.control}
            name="content"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink-600">Nội dung</label>
                <RichTextEditor
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  uploaderId={authorId}
                  placeholder="Hãy kể câu chuyện của bạn bằng tất cả sự chân thành..."
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân loại & hiển thị</CardTitle>
          <CardDescription>Chọn chuyên mục, thẻ và trạng thái xuất bản.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink-600" htmlFor="category">
              Chuyên mục
            </label>
            <select
              id="category"
              className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              value={form.watch('categoryId') ?? ''}
              onChange={(event) =>
                form.setValue('categoryId', event.target.value ? event.target.value : null, { shouldDirty: true })
              }
            >
              <option value="">— Không chọn —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink-600" htmlFor="status">
              Trạng thái
            </label>
            <select
              id="status"
              className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              {...form.register('status')}
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="SCHEDULED">Hẹn giờ</option>
              <option value="PUBLISHED">Xuất bản ngay</option>
            </select>
          </div>

          {status === 'SCHEDULED' ? (
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-ink-600" htmlFor="publishedAt">
                Thời gian xuất bản
              </label>
              <Input
                id="publishedAt"
                type="datetime-local"
                value={form.watch('publishedAt')?.slice(0, 16) ?? ''}
                onChange={(event) => form.setValue('publishedAt', event.target.value, { shouldDirty: true })}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-ink-600" htmlFor="coverImageId">
              Ảnh bìa (ID media)
            </label>
            <Input
              id="coverImageId"
              placeholder="Dán ID media sau khi tải ảnh lên thư viện"
              {...form.register('coverImageId')}
            />
            {form.formState.errors.coverImageId && (
              <p className="text-xs text-red-500">{form.formState.errors.coverImageId.message}</p>
            )}
            <p className="text-xs text-ink-400">
              Mở <a href="/admin/media" target="_blank" className="text-ink-700 underline hover:text-ink-900">thư viện media</a> để tải ảnh lên và copy ID (không phải URL).
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-ink-600">Thẻ nội dung</p>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => {
                const active = form.watch('tagIds')?.includes(tag.id) ?? false
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition',
                      active ? 'border-ink-800 bg-ink-800 text-ink-50 shadow' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                    )}
                  >
                    #{tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {message ? <p className={cn('text-sm', message.startsWith('Đã') ? 'text-emerald-600' : 'text-red-500')}>{message}</p> : <span />}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : defaultValues?.id ? 'Cập nhật bài viết' : 'Lưu bài viết'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => form.reset(initialValues)}>
            Đặt lại
          </Button>
        </div>
      </div>
    </form>
  )
}
