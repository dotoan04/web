'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/components/ui/cn'

type Item = {
  id: string
  name: string
  description?: string | null
  slug: string
  _count?: {
    posts?: number
  }
}

type Props = {
  title: string
  description: string
  type: 'category' | 'tag'
  initialItems: Item[]
  apiPath: string
}

export const TaxonomyManager = ({ title, description, type, initialItems, apiPath }: Props) => {
  const [items, setItems] = useState(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setFormValues({ name: '', description: '' })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId ?? undefined, ...formValues }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? 'Không thể lưu dữ liệu')
      }

      const item = await response.json()

      setItems((prev) => {
        const others = prev.filter((i) => i.id !== item.id)
        return [...others, item].sort((a, b) => a.name.localeCompare(b.name))
      })
      setMessage(editingId ? 'Đã cập nhật thành công.' : 'Đã thêm thành công.')
      resetForm()
    } catch (error) {
      console.error(error)
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá mục này?')) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`${apiPath}?id=${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? 'Không thể xoá')
      }
      setItems((prev) => prev.filter((item) => item.id !== id))
      setMessage('Đã xoá thành công.')
      if (editingId === id) {
        resetForm()
      }
    } catch (error) {
      console.error(error)
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setFormValues({ name: item.name, description: item.description ?? '' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor={`${type}-name`}>
              Tên {type === 'category' ? 'chuyên mục' : 'thẻ'}
            </label>
            <Input
              id={`${type}-name`}
              value={formValues.name}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={`Tên ${type === 'category' ? 'chuyên mục' : 'thẻ'}`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor={`${type}-description`}>
              Mô tả ngắn
            </label>
            <Textarea
              id={`${type}-description`}
              rows={4}
              value={formValues.description}
              onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Giới thiệu ngắn gọn cho mục này"
            />
          </div>
          <div className="flex items-center justify-between">
            {message ? (
              <p className={cn('text-xs', message.includes('thành công') ? 'text-emerald-600' : 'text-red-500')}>
                {message}
              </p>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Huỷ
                </Button>
              ) : null}
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-ink-400">Chưa có {type === 'category' ? 'chuyên mục' : 'thẻ'} nào.</p>
          ) : (
            items
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink-800">{item.name}</p>
                    <p className="text-xs uppercase tracking-wider text-ink-400">/{item.slug}</p>
                    {item.description ? <p className="text-xs text-ink-500">{item.description}</p> : null}
                    {item._count?.posts ? (
                      <p className="text-xs text-ink-400">{item._count.posts} bài viết</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="subtle" onClick={() => startEdit(item)}>
                      Chỉnh sửa
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      Xoá
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
