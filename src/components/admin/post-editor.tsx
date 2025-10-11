'use client'

import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import matter from 'gray-matter'
import { generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/components/ui/cn'
import { postInputSchema } from '@/lib/validators/post'
import type { PostWithRelations } from '@/server/posts'
import { createCodeBlockExtension } from '@/components/editor/extensions/code-block'
import { lowlight } from '@/lib/lowlight'
import { slugify } from '@/lib/utils'
import { UploadCloud } from 'lucide-react'

type Option = {
  id: string
  name: string
  slug: string
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
  const importInputRef = useRef<HTMLInputElement | null>(null)

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

  const escapeHtml = useCallback((value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }, [])

  const stripMdxArtifacts = useCallback((content: string) => {
    return content
      .replace(/import\s+.+?from\s+['"][^'"]+['"];?/g, '')
      .replace(/export\s+const\s+.+?=\s+.+?;?/g, '')
      .replace(/<([A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)?)\b(?:(?!<\/\1>).)*?<\/\1>/gs, '')
      .replace(/<([A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)?)\b[^>]*\/>/g, '')
  }, [])

  const transformMarkdownToJson = useCallback(
    async (markdown: string) => {
      const removeMdxNodes = () => (tree: unknown) => {
        visit(tree as any, (node, index, parent) => {
          if (!parent || index === undefined) return
          if (
            node.type === 'mdxJsxFlowElement' ||
            node.type === 'mdxJsxTextElement' ||
            node.type === 'mdxFlowExpression' ||
            node.type === 'mdxTextExpression' ||
            node.type === 'mdxjsEsm'
          ) {
            parent.children.splice(index, 1)
            return index
          }
        })
      }

      try {
        const processor = unified()
          .use(remarkParse)
          .use(remarkFrontmatter, ['yaml', 'toml'])
          .use(remarkMdx)
          .use(remarkGfm)
          .use(removeMdxNodes)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
          .use(rehypeStringify, { allowDangerousHtml: true })

        const file = await processor.process(stripMdxArtifacts(markdown))
        const html = String(file).trim() || '<p></p>'

        return generateJSON(html, [
          StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false, link: false }),
          createCodeBlockExtension(lowlight),
          Link.configure({ HTMLAttributes: { class: 'text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900' } }),
          Image.configure({ inline: false, HTMLAttributes: { class: 'rounded-2xl shadow-lg my-8' } }),
        ]) as Record<string, unknown>
      } catch (error) {
        console.error('Markdown parse failed:', error)
        const fallbackHtml = `<p>${escapeHtml(markdown).replace(/\n/g, '<br />')}</p>`
        return generateJSON(fallbackHtml, [
          StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false, link: false }),
          createCodeBlockExtension(lowlight),
          Link.configure({ HTMLAttributes: { class: 'text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900' } }),
          Image.configure({ inline: false, HTMLAttributes: { class: 'rounded-2xl shadow-lg my-8' } }),
        ]) as Record<string, unknown>
      }
    },
    [escapeHtml, stripMdxArtifacts],
  )

  const normalizeIdentifiers = useCallback((input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            if ('slug' in item && typeof item.slug === 'string') return item.slug
            if ('name' in item && typeof item.name === 'string') return item.name
          }
          return null
        })
        .filter((item): item is string => Boolean(item))
        .map((item) => slugify(item))
    }
    if (typeof input === 'string') {
      return input
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => slugify(item))
    }
    return []
  }, [])

  const handleImportFile = useCallback(
    async (file: File) => {
      setImporting(true)
      setMessage(null)
      try {
        const rawText = await file.text()
        const parsed = matter(rawText)
        const fileContent = parsed.content
        const jsonContent = await transformMarkdownToJson(fileContent || '')

        const current = form.getValues()
        const nextValues: FormValues = {
          ...current,
          content: jsonContent,
        }

        const frontMatter = parsed.data as Record<string, unknown>
        const extractString = (...keys: string[]) => {
          for (const key of keys) {
            const value = frontMatter?.[key]
            if (typeof value === 'string' && value.trim().length > 0) {
              return value.trim()
            }
          }
          return undefined
        }

        const incomingTitle = extractString('title', 'name')
        if (incomingTitle) {
          nextValues.title = incomingTitle
        }

        const incomingSlug = extractString('slug', 'permalink')
        if (incomingSlug) {
          nextValues.slug = slugify(incomingSlug)
        }

        const incomingExcerpt = extractString('excerpt', 'description', 'summary')
        if (incomingExcerpt) {
          nextValues.excerpt = incomingExcerpt
        }

        const incomingStatus = extractString('status')?.toUpperCase()
        if (incomingStatus && ['DRAFT', 'SCHEDULED', 'PUBLISHED'].includes(incomingStatus)) {
          nextValues.status = incomingStatus as FormValues['status']
        }

        const incomingDate = extractString('publishedAt', 'date', 'published_at')
        if (incomingDate) {
          const parsedDate = new Date(incomingDate)
          if (!Number.isNaN(parsedDate.valueOf())) {
            nextValues.publishedAt = parsedDate.toISOString()
          }
        }

        const tagIdentifiers = normalizeIdentifiers(frontMatter?.tags ?? frontMatter?.tag ?? frontMatter?.keywords)
        if (tagIdentifiers.length) {
          const matchedTagIds = new Set(nextValues.tagIds ?? [])
          tagIdentifiers.forEach((identifier) => {
            const match = tags.find((tag) => slugify(tag.slug) === identifier || slugify(tag.name) === identifier)
            if (match) {
              matchedTagIds.add(match.id)
            }
          })
          nextValues.tagIds = Array.from(matchedTagIds)
        }

        const categoryIdentifier = extractString('category', 'categorySlug', 'category_id')
        if (categoryIdentifier) {
          const normalizedCategory = slugify(categoryIdentifier)
          const matchCategory = categories.find(
            (category) => slugify(category.slug) === normalizedCategory || slugify(category.name) === normalizedCategory,
          )
          if (matchCategory) {
            nextValues.categoryId = matchCategory.id
          }
        }

        const coverImageId = extractString('coverImageId', 'cover_image_id', 'coverImage')
        if (coverImageId) {
          nextValues.coverImageId = coverImageId
        }

        form.reset(nextValues)
        setMessage('Đã import nội dung từ file thành công. Vui lòng kiểm tra trước khi lưu.')
      } catch (error) {
        console.error('Import markdown failed:', error)
        setMessage((error as Error).message || 'Không thể import file được chọn.')
      } finally {
        setImporting(false)
      }
    },
    [categories, form, normalizeIdentifiers, tags, transformMarkdownToJson],
  )

  const handleImportChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      if (!/\.(md|mdx)$/i.test(file.name)) {
        setMessage('Vui lòng chọn file có định dạng .md hoặc .mdx')
        return
      }
      await handleImportFile(file)
    },
    [handleImportFile],
  )

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input
        ref={importInputRef}
        type="file"
        accept=".md,.mdx"
        className="hidden"
        onChange={handleImportChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-100 bg-white/80 px-4 py-3 shadow-[0_12px_30px_rgba(33,38,94,0.12)] dark:border-ink-700 dark:bg-ink-800/60">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="subtle"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="gap-2"
          >
            <UploadCloud size={16} />
            {importing ? 'Đang import...' : 'Import file MD/MDX'}
          </Button>
          <span className="text-xs text-ink-400 dark:text-ink-300">
            Hỗ trợ front matter (title, slug, tags, category, status, publishedAt...)
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            form.reset(initialValues)
            setMessage(null)
          }}
        >
          Phục hồi dữ liệu ban đầu
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Tiêu đề, tóm tắt và cấu trúc bài viết.</CardDescription>
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
