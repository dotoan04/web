'use client'

import { useCallback, useRef, useState } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SmartImage } from '@/components/ui/smart-image'
import { cn } from '@/components/ui/cn'

type ImageUploaderProps = {
  value?: string | null
  onChange: (url: string | null) => void
  uploaderId?: string
  label?: string
  className?: string
  compact?: boolean
}

export const ImageUploader = ({ value, onChange, uploaderId, label, className, compact = false }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Chỉ hỗ trợ tệp ảnh')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      if (uploaderId) {
        formData.append('uploaderId', uploaderId)
      }

      setUploading(true)
      setError(null)

      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? 'Upload thất bại')
        }

        onChange(data.url)
      } catch (err) {
        console.error('Upload error:', err)
        setError((err as Error).message)
      } finally {
        setUploading(false)
      }
    },
    [onChange, uploaderId]
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
      // Reset input để cho phép upload cùng file nhiều lần
      event.target.value = ''
    },
    [handleFileUpload]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput('')
      setShowUrlInput(false)
    }
  }, [urlInput, onChange])

  const handleRemove = useCallback(() => {
    onChange(null)
    setError(null)
  }, [onChange])

  if (compact && !value) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          <ImageIcon size={16} />
          {uploading ? 'Đang tải...' : 'Ảnh'}
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && <label className="text-sm font-medium text-ink-600 dark:text-ink-300">{label}</label>}

      {value ? (
        <div className="relative w-80">
          <div className="relative h-32 w-full overflow-hidden rounded-xl border-2 border-ink-200 dark:border-ink-700">
            <SmartImage src={value} alt="Preview" fill className="object-cover" sizes="320px" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white p-0 text-rose-500 shadow-md hover:bg-rose-50 hover:text-rose-600 dark:bg-ink-800"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50/50 p-6 transition hover:border-ink-400 hover:bg-ink-100/50 dark:border-ink-700 dark:bg-ink-900/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <Upload className="text-ink-400" size={32} />

          <div className="text-center">
            <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
              {uploading ? 'Đang tải ảnh lên...' : 'Kéo thả ảnh hoặc click để chọn'}
            </p>
            <p className="mt-1 text-xs text-ink-400">PNG, JPG, GIF, WebP (tối đa 10MB)</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Chọn ảnh
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={uploading}
            >
              Dùng URL
            </Button>
          </div>

          {showUrlInput && (
            <div className="flex w-full gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={handleUrlSubmit}>
                OK
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

