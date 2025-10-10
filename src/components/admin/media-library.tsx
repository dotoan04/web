'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SmartImage } from '@/components/ui/smart-image'

type MediaItem = {
  id: string
  url: string
  title?: string | null
  alt?: string | null
  type: string
  size?: number | null
  createdAt: string
}

type Props = {
  initialItems: MediaItem[]
  uploaderId?: string
}

export const MediaLibrary = ({ initialItems, uploaderId }: Props) => {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = async () => {
    const res = await fetch('/api/media', { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) {
      setItems(data)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Chỉ hỗ trợ tải ảnh lên thư viện ở thời điểm hiện tại.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    if (uploaderId) {
      formData.append('uploaderId', uploaderId)
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Không thể tải ảnh lên')
      }
      setItems((prev) => [data, ...prev])
      setMessage('Tải ảnh thành công!')
    } catch (error) {
      console.error(error)
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const copyToClipboard = (text: string, type: 'url' | 'id') => {
    navigator.clipboard.writeText(text)
    setMessage(type === 'url' ? 'Đã sao chép đường dẫn ảnh vào clipboard.' : 'Đã sao chép ID media vào clipboard.')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xoá tệp?')) return
    const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error ?? 'Không xoá được ảnh')
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
    setMessage('Đã xoá ảnh khỏi thư viện.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thư viện hình ảnh</CardTitle>
        <CardDescription>Quản lý các nội dung media đã tải lên.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="file" accept="image/*" disabled={loading} onChange={handleUpload} />
          <Button type="button" variant="ghost" onClick={refresh}>
            Làm mới
          </Button>
          {message ? <p className="text-sm text-ink-500">{message}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-white/80 p-3 shadow-sm">
              <div className="relative h-36 w-full overflow-hidden rounded-xl">
                <SmartImage
                  src={item.url}
                  alt={item.alt ?? ''}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-medium text-ink-800">{item.title ?? 'Không tiêu đề'}</p>
              <p className="text-xs text-ink-400 truncate" title={item.id}>ID: {item.id}</p>
              <p className="text-xs text-ink-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
              <div className="flex flex-col gap-2">
                <Button type="button" size="sm" variant="subtle" onClick={() => copyToClipboard(item.id, 'id')}>
                  Copy ID
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => copyToClipboard(item.url, 'url')}>
                  Copy URL
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                  Xoá
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
