"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/admin/image-uploader'
import { slugify } from '@/lib/utils'

type ImportedQuestion = {
  id: string
  title: string
  content?: string
  imageUrl?: string
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK'
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number
    imageUrl?: string
  }>
  multi: boolean
}

type QuizOptionForm = {
  id?: string
  text: string
  imageUrl?: string
  isCorrect: boolean
  order: number
}

type QuizQuestionForm = {
  id?: string
  title: string
  content: string
  imageUrl?: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK'
  order: number
  points: number
  explanation: string
  options: QuizOptionForm[]
}

type QuizFormValues = {
  id?: string
  title: string
  slug: string
  description: string
  status: 'DRAFT' | 'PUBLISHED'
  durationSeconds: number
  autoReleaseAt: string
  questions: QuizQuestionForm[]
}

type QuizFormProps = {
  quiz?: QuizFormValues
}

const createEmptyOption = (order: number): QuizOptionForm => ({
  text: '',
  isCorrect: order === 0,
  order,
})

const createEmptyQuestion = (order: number): QuizQuestionForm => ({
  title: '',
  content: '',
  type: 'SINGLE_CHOICE',
  order,
  points: 1,
  explanation: '',
  options: [createEmptyOption(0), createEmptyOption(1)],
})

const createTheoryQuestion = (order: number): QuizQuestionForm => ({
  title: '',
  content: '',
  type: 'SINGLE_CHOICE',
  order,
  points: 0,
  explanation: '',
  options: [],
})

const createMatchingQuestion = (order: number): QuizQuestionForm => ({
  title: '',
  content: '',
  type: 'MATCHING',
  order,
  points: 1,
  explanation: '',
  options: [
    // Create 3 pairs by default (left items at even indices, right items at odd indices)
    { text: '', isCorrect: true, order: 0 }, // Left 1
    { text: '', isCorrect: true, order: 1 }, // Right 1
    { text: '', isCorrect: true, order: 2 }, // Left 2
    { text: '', isCorrect: true, order: 3 }, // Right 2
    { text: '', isCorrect: true, order: 4 }, // Left 3
    { text: '', isCorrect: true, order: 5 }, // Right 3
  ],
})

const createFillInBlankQuestion = (order: number): QuizQuestionForm => ({
  title: '',
  content: '',
  type: 'FILL_IN_BLANK',
  order,
  points: 1,
  explanation: '',
  options: [{ text: '', isCorrect: true, order: 0 }],
})

type QuestionEditorProps = {
  question: QuizQuestionForm
  index: number
  totalQuestions: number
  onChange: (updater: (prev: QuizQuestionForm) => QuizQuestionForm) => void
  onRemove: () => void
  onAddOption: () => void
  onRemoveOption: (optionIndex: number) => void
  onSetCorrect: (optionIndex: number) => void
  onToggleCorrect: (optionIndex: number) => void
}

type OptionRowProps = {
  option: QuizOptionForm
  questionIndex: number
  optionIndex: number
  isCorrect: boolean
  disableRemove: boolean
  questionType: QuizQuestionForm['type']
  onSelectCorrect: () => void
  onToggleCorrect: () => void
  onChangeText: (value: string) => void
  onChangeImageUrl: (url: string | null) => void
  onRemove: () => void
}

const OptionRow = memo(({ option, questionIndex, optionIndex, isCorrect, disableRemove, questionType, onSelectCorrect, onToggleCorrect, onChangeText, onChangeImageUrl, onRemove }: OptionRowProps) => (
  <div className="rounded-xl border border-ink-200/60 bg-white/80 p-3 dark:border-ink-700 dark:bg-ink-800/60">
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">
          {questionType === 'SINGLE_CHOICE' ? (
            <input
              type="radio"
              name={`question-${questionIndex}`}
              checked={isCorrect}
              onChange={onSelectCorrect}
            />
          ) : (
            <input
              type="checkbox"
              checked={isCorrect}
              onChange={onToggleCorrect}
            />
          )}
          Đáp án đúng
        </label>
        <Input
          value={option.text}
          onChange={(event) => onChangeText(event.target.value)}
          placeholder={`Phương án ${option.order + 1}`}
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <ImageUploader
            value={option.imageUrl}
            onChange={onChangeImageUrl}
            compact
          />
          <span className="rounded-full bg-ink-100 px-2 py-1 text-xs font-medium text-ink-500 dark:bg-ink-900/40 dark:text-ink-300">
            {option.order + 1}
          </span>
          {!disableRemove ? (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-rose-500 hover:text-rose-600">
              Xoá
            </Button>
          ) : null}
        </div>
      </div>
      {option.imageUrl && (
        <div className="ml-8">
          <ImageUploader
            value={option.imageUrl}
            onChange={onChangeImageUrl}
            label="Ảnh đáp án"
          />
        </div>
      )}
    </div>
  </div>
))

OptionRow.displayName = 'OptionRow'

const QuizQuestionEditor = memo(({ question, index, totalQuestions, onChange, onRemove, onAddOption, onRemoveOption, onSetCorrect, onToggleCorrect }: QuestionEditorProps) => (
  <section className="rounded-xl border-2 border-ink-200/70 bg-white p-6 shadow-md transition-all hover:shadow-lg dark:border-ink-700 dark:bg-ink-900">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-100">
          {index + 1}
        </span>
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">Tiêu đề</label>
          <Input
            value={question.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
            placeholder="Nhập nội dung câu hỏi"
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="space-y-2 text-right">
          <label className="block text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">Điểm</label>
          <Input
            type="number"
            min={0}
            className="w-24 text-right"
            value={question.points}
            onChange={(event) => onChange((current) => ({ ...current, points: Number(event.target.value) }))}
          />
        </div>
        {totalQuestions > 1 ? (
          <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 hover:text-rose-600">
            Xoá
          </Button>
        ) : null}
      </div>
    </div>

    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg bg-ink-50/50 p-3 dark:bg-ink-800/30">
      <label className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">Loại câu hỏi:</label>
      <Button
        type="button"
        variant={question.type === 'SINGLE_CHOICE' ? 'primary' : 'ghost'}
        size="sm"
        className={question.type === 'SINGLE_CHOICE' ? 'shadow-md' : ''}
        onClick={() => {
          onChange((current) => ({
            ...current,
            type: 'SINGLE_CHOICE',
            options: (current.options.length >= 2 ? current.options : [
              { text: current.options[0]?.text ?? '', imageUrl: current.options[0]?.imageUrl, isCorrect: true, order: 0 },
              { text: '', imageUrl: undefined, isCorrect: false, order: 1 },
            ]).map((opt, idx) => ({ ...opt, isCorrect: idx === 0, order: idx }))
          }))
        }}
      >
        Một đáp án
      </Button>
      <Button
        type="button"
        variant={question.type === 'MULTIPLE_CHOICE' ? 'primary' : 'ghost'}
        size="sm"
        className={question.type === 'MULTIPLE_CHOICE' ? 'shadow-md' : ''}
        onClick={() =>
          onChange((current) => ({
            ...current,
            type: 'MULTIPLE_CHOICE',
            options: (current.options.length >= 2 ? current.options : [
              { text: current.options[0]?.text ?? '', imageUrl: current.options[0]?.imageUrl, isCorrect: true, order: 0 },
              { text: '', imageUrl: undefined, isCorrect: false, order: 1 },
            ]).map((opt, idx) => ({ ...opt, order: idx })),
          }))
        }
      >
        Nhiều đáp án
      </Button>
      <Button
        type="button"
        variant={question.type === 'MATCHING' ? 'primary' : 'ghost'}
        size="sm"
        className={question.type === 'MATCHING' ? 'shadow-md' : ''}
        onClick={() => {
          onChange((current) => ({
            ...current,
            type: 'MATCHING',
            options: current.options.length >= 4 ? current.options.map((opt) => ({ ...opt, isCorrect: true })) : createMatchingQuestion(current.order).options
          }))
        }}
      >
        Ghép cặp
      </Button>
      <Button
        type="button"
        variant={question.type === 'FILL_IN_BLANK' ? 'primary' : 'ghost'}
        size="sm"
        className={question.type === 'FILL_IN_BLANK' ? 'shadow-md' : ''}
        onClick={() => {
          onChange((current) => ({
            ...current,
            type: 'FILL_IN_BLANK',
            options: [{
              text: current.options[0]?.text ?? '',
              imageUrl: undefined,
              isCorrect: true,
              order: 0,
            }],
          }))
        }}
      >
        Điền khuyết
      </Button>
    </div>

    <div className="mt-4 space-y-3">
      <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">Mô tả (tuỳ chọn)</label>
      <Textarea
        rows={3}
        value={question.content}
        onChange={(event) => onChange((current) => ({ ...current, content: event.target.value }))}
        placeholder="Nhập dữ kiện hoặc mô tả bổ sung cho câu hỏi"
      />
    </div>

    <div className="mt-4">
      <ImageUploader
        value={question.imageUrl}
        onChange={(url) => onChange((current) => ({ ...current, imageUrl: url ?? undefined }))}
        label="Ảnh câu hỏi (tuỳ chọn)"
      />
    </div>

    {question.type === 'MATCHING' ? (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-600 dark:text-ink-200">Các cặp ghép (trái | phải)</p>
          <Button type="button" variant="subtle" onClick={() => {
            // Add a new pair (2 options at a time)
            const newOrder = question.options.length
            onChange((current) => ({
              ...current,
              options: [
                ...current.options,
                { text: '', isCorrect: true, order: newOrder },
                { text: '', isCorrect: true, order: newOrder + 1 }
              ]
            }))
          }}>
            + Thêm cặp
          </Button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: Math.floor(question.options.length / 2) }).map((_, pairIndex) => {
            const leftIndex = pairIndex * 2
            const rightIndex = pairIndex * 2 + 1
            const leftOption = question.options[leftIndex]
            const rightOption = question.options[rightIndex]
            return (
              <div key={`pair-${pairIndex}`} className="rounded-xl border border-ink-200/60 bg-white/80 p-4 dark:border-ink-700 dark:bg-ink-800/60">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">Cặp {pairIndex + 1}</span>
                  {question.options.length > 4 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Remove both options of the pair
                        onChange((current) => ({
                          ...current,
                          options: current.options.filter((_, idx) => idx !== leftIndex && idx !== rightIndex).map((opt, idx) => ({ ...opt, order: idx }))
                        }))
                      }}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      Xoá cặp
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink-500 dark:text-ink-400">Bên trái</label>
                    <Input
                      value={leftOption?.text || ''}
                      onChange={(event) => 
                        onChange((current) => ({
                          ...current,
                          options: current.options.map((item, idx) => idx === leftIndex ? { ...item, text: event.target.value } : item)
                        }))
                      }
                      placeholder="Ví dụ: K-means"
                    />
                    {leftOption?.imageUrl && (
                      <ImageUploader
                        value={leftOption.imageUrl}
                        onChange={(url) => 
                          onChange((current) => ({
                            ...current,
                            options: current.options.map((item, idx) => idx === leftIndex ? { ...item, imageUrl: url ?? undefined } : item)
                          }))
                        }
                        compact
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink-500 dark:text-ink-400">Bên phải (sẽ được đảo)</label>
                    <Input
                      value={rightOption?.text || ''}
                      onChange={(event) => 
                        onChange((current) => ({
                          ...current,
                          options: current.options.map((item, idx) => idx === rightIndex ? { ...item, text: event.target.value } : item)
                        }))
                      }
                      placeholder="Ví dụ: Phân đoạn ảnh màu"
                    />
                    {rightOption?.imageUrl && (
                      <ImageUploader
                        value={rightOption.imageUrl}
                        onChange={(url) => 
                          onChange((current) => ({
                            ...current,
                            options: current.options.map((item, idx) => idx === rightIndex ? { ...item, imageUrl: url ?? undefined } : item)
                          }))
                        }
                        compact
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ) : question.type === 'FILL_IN_BLANK' ? (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-600 dark:text-ink-200">Đáp án điền khuyết</p>
        </div>
        <Input
          value={question.options[0]?.text ?? ''}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              options: [{
                text: event.target.value,
                imageUrl: undefined,
                isCorrect: true,
                order: 0,
              }],
            }))
          }
          placeholder="Nhập đáp án đúng"
        />
        <p className="text-xs text-ink-500 dark:text-ink-400">
          Câu trả lời được so khớp theo chữ (không phân biệt hoa/thường).
        </p>
      </div>
    ) : question.options.length > 0 ? (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-600 dark:text-ink-200">Các phương án</p>
          <Button type="button" variant="subtle" onClick={onAddOption}>
            + Thêm phương án
          </Button>
        </div>
        <div className="space-y-3">
          {question.options.map((option, optionIndex) => (
            <OptionRow
              key={option.id ?? `${question.id ?? 'new'}-${optionIndex}`}
              option={option}
              questionIndex={index}
              optionIndex={optionIndex}
              isCorrect={option.isCorrect}
              disableRemove={question.options.length <= 2 && question.options.length > 0}
              questionType={question.type}
              onSelectCorrect={() => onSetCorrect(optionIndex)}
              onToggleCorrect={() => onToggleCorrect(optionIndex)}
              onChangeText={(value) =>
                onChange((current) => ({
                  ...current,
                  options: current.options.map((item, idx) => (idx === optionIndex ? { ...item, text: value } : item)),
                }))
              }
              onChangeImageUrl={(url) =>
                onChange((current) => ({
                  ...current,
                  options: current.options.map((item, idx) => (idx === optionIndex ? { ...item, imageUrl: url ?? undefined } : item)),
                }))
              }
              onRemove={() => onRemoveOption(optionIndex)}
            />
          ))}
        </div>
      </div>
    ) : (
      <div className="mt-6 rounded-lg border-2 border-dashed border-ink-200 bg-ink-50 p-6 text-center dark:border-ink-700 dark:bg-ink-800/50">
        <p className="mb-3 text-sm text-ink-500 dark:text-ink-400">
          Câu hỏi lý thuyết (không có phương án trả lời)
        </p>
        <Button type="button" variant="subtle" onClick={onAddOption}>
          + Thêm phương án đầu tiên
        </Button>
      </div>
    )}

    <div className="mt-6 space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">Giải thích (tuỳ chọn)</label>
      <Textarea
        rows={2}
        value={question.explanation}
        onChange={(event) => onChange((current) => ({ ...current, explanation: event.target.value }))}
        placeholder="Giải thích ngắn gọn cho đáp án đúng"
      />
    </div>
  </section>
))

QuizQuestionEditor.displayName = 'QuizQuestionEditor'

export const QuizForm = ({ quiz }: QuizFormProps) => {
  const router = useRouter()
  const [values, setValues] = useState<QuizFormValues>(
    quiz ?? {
      title: '',
      slug: '',
      description: '',
      status: 'DRAFT',
      durationSeconds: 600,
      autoReleaseAt: '',
      questions: [createEmptyQuestion(0)],
    },
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [slugLocked, setSlugLocked] = useState(Boolean(quiz))
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportedQuestion[]>([])
  const [showAllPreview, setShowAllPreview] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyProgress, setApplyProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 })
  
  const PREVIEW_LIMIT = 5
  const displayedPreview = showAllPreview ? preview : preview.slice(0, PREVIEW_LIMIT)

  useEffect(() => {
    if (slugLocked) return
    const suggested = slugify(values.title || 'quiz-moi')
    if (suggested === values.slug) return
    setValues((prev) => ({ ...prev, slug: suggested }))
  }, [slugLocked, values.title, values.slug])

  const resetPreview = () => {
    setPreview([])
    setImportError(null)
  }

  const isDataUrl = (url?: string) => !!url && url.startsWith('data:')
  const uploadedCacheRef = useRef<Map<string, string>>(new Map())
  const lastUploadIdsRef = useRef<string[]>([])

  const uploadDataUrl = async (dataUrl: string): Promise<string> => {
    const cached = uploadedCacheRef.current.get(dataUrl)
    if (cached) return cached
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = /data:(.*);base64/.exec(header)
    const mime = (mimeMatch?.[1] || 'image/png').toLowerCase()
    // Convert base64 to binary
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const ext = mime.split('/')[1] || 'png'
    const file = new File([bytes], `import-${Date.now()}.${ext}`, { type: mime })
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/media/upload', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error ?? 'Upload ảnh thất bại')
    if (data?.id) lastUploadIdsRef.current.push(data.id as string)
    uploadedCacheRef.current.set(dataUrl, data.url as string)
    return data.url as string
  }

  const applyImportedQuestions = async (items: ImportedQuestion[]) => {
    try {
      setApplying(true)
      // Collect all images that need to be uploaded with their locations
      const imageUploadMap = new Map<string, string>() // dataUrl -> uploadedUrl
      const imageUploadTasks: Array<{ dataUrl: string }> = []
      
      items.forEach((q) => {
        if (isDataUrl(q.imageUrl)) {
          imageUploadTasks.push({ dataUrl: q.imageUrl! })
        }
        q.options.forEach((opt) => {
          if (isDataUrl(opt.imageUrl)) {
            imageUploadTasks.push({ dataUrl: opt.imageUrl! })
          }
        })
      })

      const total = imageUploadTasks.length
      setApplyProgress({ processed: 0, total })

      // Upload all images in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 5 // Upload 5 images at a time
      
      for (let i = 0; i < imageUploadTasks.length; i += CONCURRENCY_LIMIT) {
        const batch = imageUploadTasks.slice(i, i + CONCURRENCY_LIMIT)
        const batchPromises = batch.map(async (task) => {
          try {
            // Check cache first
            if (uploadedCacheRef.current.has(task.dataUrl)) {
              const cachedUrl = uploadedCacheRef.current.get(task.dataUrl)!
              imageUploadMap.set(task.dataUrl, cachedUrl)
              setApplyProgress((p) => ({ processed: p.processed + 1, total: p.total }))
              return
            }
            const newUrl = await uploadDataUrl(task.dataUrl)
            imageUploadMap.set(task.dataUrl, newUrl)
          } catch (error) {
            console.error('Failed to upload image:', error)
            // Keep original dataUrl if upload fails
            imageUploadMap.set(task.dataUrl, task.dataUrl)
          } finally {
            setApplyProgress((p) => ({ processed: p.processed + 1, total: p.total }))
          }
        })
        // Wait for this batch to complete before starting next batch
        await Promise.all(batchPromises)
      }

      // Now process items and replace data URLs with uploaded URLs
      const processedItems: ImportedQuestion[] = items.map((q) => ({
        ...q,
        imageUrl: q.imageUrl && isDataUrl(q.imageUrl) 
          ? (imageUploadMap.get(q.imageUrl) || q.imageUrl)
          : q.imageUrl,
        options: q.options.map((opt) => ({
          ...opt,
          imageUrl: opt.imageUrl && isDataUrl(opt.imageUrl)
            ? (imageUploadMap.get(opt.imageUrl) || opt.imageUrl)
            : opt.imageUrl
        }))
      }))

      const nextQuestions = processedItems.map((item, questionIndex) => {
        // Determine question type
        let questionType: QuizQuestionForm['type'] = 'SINGLE_CHOICE'
        
        if (item.type === 'MATCHING') {
          questionType = 'MATCHING'
        } else if (item.type === 'FILL_IN_BLANK') {
          questionType = 'FILL_IN_BLANK'
        } else {
          const correctCount = item.options.filter((opt) => opt.isCorrect).length
          questionType = correctCount > 1 ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE'
        }
        
        return {
          title: item.title,
          content: item.content || '',
          imageUrl: item.imageUrl || '',
          type: questionType,
          order: questionIndex,
          // Theory questions (no options) have 0 points by default
          points: item.options.length === 0 ? 0 : 1,
          explanation: '',
          options:
            questionType === 'FILL_IN_BLANK'
              ? [{ text: item.options[0]?.text ?? '', imageUrl: undefined, isCorrect: true, order: 0 }]
              : item.options.map((option, optionIndex) => ({
                  text: option.text,
                  imageUrl: option.imageUrl || '',
                  isCorrect: option.isCorrect,
                  order: optionIndex,
                })),
        }
      })

      setValues((prev) => ({
        ...prev,
        questions: nextQuestions.length ? nextQuestions : prev.questions,
      }))

      setPreview([])
      setImportError(null)
    } catch (err) {
      console.error('Apply imported questions failed:', err)
      setImportError((err as Error).message)
    } finally {
      setApplying(false)
      setApplyProgress({ processed: 0, total: 0 })
    }
  }

  const rollbackLastUploadedImages = async () => {
    const ids = [...lastUploadIdsRef.current]
    if (!ids.length) return
    setImporting(true)
    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null))
      )
      lastUploadIdsRef.current = []
      uploadedCacheRef.current.clear()
      setMessage('Đã xoá ảnh tải lên từ lần áp dụng gần nhất.')
    } catch (e) {
      console.error(e)
      setError('Không thể xoá một số ảnh. Kiểm tra lại trong thư viện media.')
    } finally {
      setImporting(false)
    }
  }

  const totalPoints = useMemo(
    () => values.questions.reduce((sum, question) => sum + Math.max(0, Number(question.points ?? 0)), 0),
    [values.questions],
  )

  const updateQuiz = useCallback((partial: Partial<QuizFormValues>) => {
    setValues((prev) => ({ ...prev, ...partial }))
  }, [])

  const updateQuestion = useCallback(
    (index: number, updater: (question: QuizQuestionForm) => QuizQuestionForm) => {
      setValues((prev) => ({
        ...prev,
        questions: prev.questions.map((question, questionIndex) =>
          questionIndex === index ? updater(question) : question,
        ),
      }))
    },
    [],
  )

  const addQuestion = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion(prev.questions.length)],
    }))
  }, [])

  const addTheoryQuestion = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      questions: [...prev.questions, createTheoryQuestion(prev.questions.length)],
    }))
  }, [])

  const addMatchingQuestion = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      questions: [...prev.questions, createMatchingQuestion(prev.questions.length)],
    }))
  }, [])

const addFillInBlankQuestion = useCallback(() => {
  setValues((prev) => ({
    ...prev,
    questions: [...prev.questions, createFillInBlankQuestion(prev.questions.length)],
  }))
}, [])

  const removeQuestion = useCallback((index: number) => {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, order) => ({ ...question, order })),
    }))
  }, [])

  const addOption = useCallback((questionIndex: number) => {
    updateQuestion(questionIndex, (question) => {
      if (question.type === 'FILL_IN_BLANK') {
        return question
      }
      return {
        ...question,
        options: [...question.options, createEmptyOption(question.options.length)],
      }
    })
  }, [updateQuestion])

  const removeOption = useCallback((questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => {
      if (question.type === 'FILL_IN_BLANK') {
        return question
      }
      return {
        ...question,
        options: question.options
          .filter((_, index) => index !== optionIndex)
          .map((option, order) => ({ ...option, order })),
      }
    })
  }, [updateQuestion])

  const setCorrectOption = useCallback((questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => {
      if (question.type === 'FILL_IN_BLANK') {
        return question
      }
      return {
        ...question,
        options: question.options.map((option, index) => ({
          ...option,
          isCorrect: index === optionIndex,
        })),
      }
    })
  }, [updateQuestion])

  const toggleCorrectOption = useCallback((questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => {
      if (question.type === 'FILL_IN_BLANK') {
        return question
      }
      return {
        ...question,
        options: question.options.map((option, index) =>
          index === optionIndex ? { ...option, isCorrect: !option.isCorrect } : option
        ),
      }
    })
  }, [updateQuestion])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImportError(null)

    if (!file) return

    try {
      if (!file.name.endsWith('.docx')) {
        throw new Error('Chỉ hỗ trợ tập tin Word (.docx).')
      }

      // Nếu tệp vượt quá ~4MB (giới hạn Vercel serverless ~4.5MB), gợi ý dùng URL
      if (file.size > 4 * 1024 * 1024) {
        const url = window.prompt('Tệp lớn, vui lòng tải DOCX lên thư viện media trước (cho phép .docx) hoặc nơi lưu trữ công khai rồi dán URL trực tiếp tại đây:')
        if (url && url.startsWith('http')) {
          setImporting(true)
          const response = await fetch('/api/quizzes/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: url }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data?.error ?? 'Không thể phân tích từ URL.')
          }
          setPreview((data.questions as ImportedQuestion[]) ?? [])
          return
        } else {
          throw new Error('Hãy tải DOCX lên thư viện media (/admin/media) hoặc nhập URL hợp lệ.')
        }
      }

      setImporting(true)
      const form = new FormData()
      form.append('file', file)

      const response = await fetch('/api/quizzes/import', {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        // Handle 413 Request Entity Too Large
        if (response.status === 413) {
          throw new Error('Tệp quá lớn. Vui lòng thử tệp nhỏ hơn hoặc liên hệ quản trị viên để tăng giới hạn upload.')
        }
        
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Không thể phân tích tập tin.')
      }

      const data = await response.json()

      setPreview((data.questions as ImportedQuestion[]) ?? [])
    } catch (err) {
      console.error(err)
      setImportError((err as Error).message)
      setPreview([])
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  const uploadDocxToSpaces = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx'
      const picked = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] ?? null)
        input.click()
      })
      if (!picked) return
      if (!picked.name.endsWith('.docx')) throw new Error('Chỉ chọn tệp .docx')

      setImporting(true)

      const ext = 'docx'
      const presignRes = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: ext }),
      })
      const presign = await presignRes.json()
      if (!presignRes.ok) throw new Error(presign?.error ?? 'Không thể tạo URL upload')

      const form = new FormData()
      Object.entries(presign.fields as Record<string, string>).forEach(([k, v]) => form.append(k, v))
      form.append('file', picked)

      const uploadRes = await fetch(presign.url, { method: 'POST', body: form })
      if (!uploadRes.ok) throw new Error('Upload lên Spaces thất bại')

      // Construct public URL
      const publicBase = (process.env.NEXT_PUBLIC_SPACES_PUBLIC_BASE_URL || '').replace(/\/$/, '')
      const fileUrl = publicBase ? `${publicBase}/${presign.fields.key || presign.key}` : `${presign.url}/${presign.fields.key || presign.key}`

      const response = await fetch('/api/quizzes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Không thể phân tích DOCX đã upload')
      setPreview((data.questions as ImportedQuestion[]) ?? [])
    } catch (e) {
      console.error(e)
      setImportError((e as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const handlePasteText = async () => {
    setImportError(null)
    const text = window.prompt('Dán nội dung văn bản, mỗi dòng một nội dung.')
    if (!text) return

    try {
      setImporting(true)
      const response = await fetch('/api/quizzes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? 'Không thể phân tích nội dung.')
      }

      setPreview((data.questions as ImportedQuestion[]) ?? [])
    } catch (err) {
      console.error(err)
      setImportError((err as Error).message)
      setPreview([])
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const isValidCuid = (value: unknown): value is string =>
        typeof value === 'string' && /^c[0-9a-z]{24,}$/i.test(value)

      // Remove empty options (no text and no image)
      // If only 1 option remains after filtering, convert to theory question (0 options)
      const normalizedQuestions = values.questions.map((question) => {
        const validOptions = question.options.filter((opt) => (opt.text && opt.text.trim()) || opt.imageUrl)

        if (question.type === 'FILL_IN_BLANK') {
          const answer = validOptions[0] ?? { text: '', imageUrl: undefined, isCorrect: true, order: 0 }
          return {
            ...question,
            options: [{ ...answer, isCorrect: true, order: 0 }],
          }
        }

        return {
          ...question,
          options: validOptions.length === 1 ? [] : validOptions,
        }
      })

      const response = await fetch(quiz ? `/api/quizzes/${quiz.id}` : '/api/quizzes', {
        method: quiz ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          questions: normalizedQuestions.map((question, index) => ({
            ...(isValidCuid(question.id) ? { id: question.id } : {}),
            title: question.title,
            content: question.content,
            imageUrl: question.imageUrl,
            type: question.type,
            order: index,
            points: question.points,
            explanation: question.explanation,
            options: (question.type === 'FILL_IN_BLANK'
              ? question.options
              : question.options.filter((opt) => (opt.text && opt.text.trim()) || opt.imageUrl)
            ).map((option, optionIndex) => ({
              ...(isValidCuid(option.id) ? { id: option.id } : {}),
              text: option.text,
              imageUrl: option.imageUrl,
              isCorrect: option.isCorrect,
              order: optionIndex,
            })),
          })),
          autoReleaseAt: values.autoReleaseAt || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ? JSON.stringify(data.error) : 'Không thể lưu quiz')
      }

      setMessage('Đã lưu quiz thành công.')
      router.refresh()
      if (!quiz && data?.quiz?.id) {
        setTimeout(() => {
          router.push(`/admin/quizzes/${data.quiz.id}`)
        }, 400)
      }
    } catch (thrown) {
      console.error(thrown)
      setError((thrown as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quiz?.id) return
    const confirm = window.confirm('Bạn có chắc chắn muốn xoá quiz này?')
    if (!confirm) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Không thể xoá quiz')
      }

      router.push('/admin/quizzes')
    } catch (thrown) {
      console.error(thrown)
      setError((thrown as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="p-0 shadow-lg">
        <CardHeader className="border-b border-ink-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 dark:border-ink-800 dark:from-ink-900 dark:to-ink-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                {quiz ? 'Chỉnh sửa quiz' : 'Tạo quiz mới'}
              </CardTitle>
              <CardDescription className="text-base text-ink-600 dark:text-ink-300">
                Quản lý cấu trúc câu hỏi, thời lượng và trạng thái trước khi xuất bản.
              </CardDescription>
            </div>
            {quiz ? (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400">
                Xoá quiz
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="px-8 py-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="rounded-xl border-2 border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 shadow-md dark:border-indigo-800/50 dark:from-ink-900 dark:to-ink-800/50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-ink-800 dark:text-ink-100">📄 Nhập đề từ Word</h3>
                <p className="text-sm text-ink-600 dark:text-ink-400">
                  Tải tập tin .docx hoặc dán nội dung để tự động tách câu hỏi, đáp án.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95">
                  <Upload size={18} />
                  <span>Tải tập tin</span>
                  <input className="hidden" type="file" accept=".docx" onChange={handleUpload} disabled={importing} />
                </label>
                <Button type="button" variant="subtle" onClick={handlePasteText}>
                  <FileText size={16} className="mr-2" /> Dán văn bản
                </Button>
                <Button type="button" variant="ghost" onClick={uploadDocxToSpaces}>
                  Tải lên Spaces
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    const url = window.prompt('Dán URL tới tệp DOCX (đã tải lên media hoặc lưu trữ công khai)')
                    if (!url) return
                    try {
                      setImporting(true)
                      const response = await fetch('/api/quizzes/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileUrl: url.trim() }),
                      })
                      const data = await response.json()
                      if (!response.ok) throw new Error(data?.error ?? 'Không thể phân tích từ URL.')
                      setPreview((data.questions as ImportedQuestion[]) ?? [])
                    } catch (e) {
                      console.error(e)
                      setImportError((e as Error).message)
                    } finally {
                      setImporting(false)
                    }
                  }}
                >
                  Nhập từ URL
                </Button>
                {preview.length ? (
                  <Button type="button" variant="ghost" onClick={resetPreview}>
                    <X size={16} className="mr-1" /> Xoá preview
                  </Button>
                ) : null}
                {preview.length ? (
                  <Button type="button" variant="ghost" onClick={rollbackLastUploadedImages}>
                    Hoàn tác ảnh lần áp dụng trước
                  </Button>
                ) : null}
              </div>
            </div>
            {importError ? (
              <div className="mt-4 rounded-lg border-2 border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">⚠️ {importError}</p>
              </div>
            ) : null}
            {importing ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Đang phân tích tập tin…</p>
              </div>
            ) : null}
            {preview.length ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                    Preview ({displayedPreview.length} / {preview.length} câu hỏi)
                  </h4>
                  <div className="flex items-center gap-2">
                    {applying && (
                      <span className="text-xs text-ink-500 dark:text-ink-400">
                        Đang xử lý ảnh… {applyProgress.processed}/{applyProgress.total}
                      </span>
                    )}
                    <Button type="button" size="sm" onClick={() => applyImportedQuestions(preview)} disabled={applying}>
                      {applying ? 'Đang áp dụng…' : 'Áp dụng vào form'}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 max-h-96 overflow-y-auto rounded-lg border border-ink-200 p-3 dark:border-ink-700">
                  {displayedPreview.map((question) => (
                    <article key={question.id} className="rounded-2xl border border-ink-200/70 bg-white p-4 text-sm dark:border-ink-700 dark:bg-ink-900">
                      <div className="flex items-start gap-2 mb-2">
                        <h5 className="flex-1 font-semibold text-ink-700 dark:text-ink-100">{question.title}</h5>
                        {question.type === 'MATCHING' && (
                          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                            🔗 Ghép cặp
                          </span>
                        )}
                        {question.type === 'MULTIPLE_CHOICE' && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            ☑️ Nhiều đáp án
                          </span>
                        )}
                        {question.type === 'FILL_IN_BLANK' && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            ✏️ Điền khuyết
                          </span>
                        )}
                        {question.type === 'SINGLE_CHOICE' && question.options.length > 0 && (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            ⭕ Một đáp án
                          </span>
                        )}
                      </div>
                      {question.content && (
                        <div className="mt-2 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-xs text-ink-600 dark:bg-ink-800/50 dark:text-ink-300">
                          {question.content}
                        </div>
                      )}
                      {question.imageUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={question.imageUrl} alt="Question" className="max-w-full h-auto rounded-lg border border-ink-200" />
                        </div>
                      )}
                      {question.options.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {question.options.map((option) => (
                            <li
                              key={option.id}
                              className={`flex items-start gap-2 ${
                                option.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-600 dark:text-ink-300'
                              }`}
                            >
                              <span className="font-semibold">{option.order + 1}.</span>
                              <div className="flex-1">
                                <span>{option.text}</span>
                                {option.imageUrl && (
                                  <div className="mt-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={option.imageUrl} alt="Option" className="max-w-xs h-auto rounded border border-ink-200" />
                                  </div>
                                )}
                              </div>
                              {option.isCorrect ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  Đúng
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs italic text-ink-400 dark:text-ink-500">
                          (Câu lý thuyết - không có phương án)
                        </p>
                      )}
                    </article>
                  ))}
                </div>
                {preview.length > PREVIEW_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllPreview(!showAllPreview)}
                    className="w-full rounded-lg border border-ink-200 py-2 text-xs font-semibold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800/50"
                  >
                    {showAllPreview ? '↑ Thu gọn' : '↓ Xem thêm'} ({preview.length - PREVIEW_LIMIT} câu nữa)
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border-2 border-ink-200/70 bg-white p-6 shadow-md dark:border-ink-700 dark:bg-ink-900">
            <h3 className="mb-4 text-lg font-bold text-ink-800 dark:text-ink-100">⚙️ Thông tin cơ bản</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="title">
                  Tiêu đề
                </label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(event) => {
                    if (!slugLocked) {
                      updateQuiz({ slug: slugify(event.target.value) })
                    }
                    updateQuiz({ title: event.target.value })
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="slug">
                  Slug
                </label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(event) => {
                    setSlugLocked(true)
                    updateQuiz({ slug: slugify(event.target.value) })
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="durationMinutes">
                  Thời lượng (phút)
                </label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={1}
                  step={1}
                  value={Math.round(values.durationSeconds / 60)}
                  onChange={(event) => updateQuiz({ durationSeconds: Number(event.target.value) * 60 })}
                  placeholder="Ví dụ: 45"
                  required
                />
                <p className="text-xs text-ink-400 dark:text-ink-500">
                  = {values.durationSeconds} giây
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="status">
                  Trạng thái
                </label>
                <select
                  id="status"
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                  value={values.status}
                  onChange={(event) => updateQuiz({ status: event.target.value as 'DRAFT' | 'PUBLISHED' })}
                >
                  <option value="DRAFT">Nháp</option>
                  <option value="PUBLISHED">Xuất bản</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="autoReleaseAt">
                  Tự động mở (ISO)
                </label>
                <Input
                  id="autoReleaseAt"
                  type="datetime-local"
                  value={values.autoReleaseAt}
                  onChange={(event) => updateQuiz({ autoReleaseAt: event.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="description">
                Mô tả (tuỳ chọn)
              </label>
              <Textarea
                id="description"
                rows={3}
                value={values.description}
                onChange={(event) => updateQuiz({ description: event.target.value })}
                placeholder="Giới thiệu nội dung bài kiểm tra, mức độ và mục tiêu."
              />
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border-2 border-ink-200/70 bg-gradient-to-r from-white to-ink-50/50 p-6 shadow-md dark:border-ink-700 dark:from-ink-900 dark:to-ink-800/50 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-lg font-bold text-ink-800 dark:text-ink-100">📝 Câu hỏi</p>
                <p className="text-sm text-ink-600 dark:text-ink-400">
                  Tổng điểm: <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{totalPoints}</span> điểm • 
                  <span className="ml-2 font-medium">{values.questions.length}</span> câu hỏi
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="subtle" onClick={addQuestion}>
                  + Thêm câu hỏi
                </Button>
                <Button type="button" variant="ghost" onClick={addTheoryQuestion}>
                  + Câu lý thuyết
                </Button>
                <Button type="button" variant="ghost" onClick={addMatchingQuestion}>
                  + Câu ghép cặp
                </Button>
                <Button type="button" variant="ghost" onClick={addFillInBlankQuestion}>
                  + Câu điền khuyết
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              {values.questions.map((question, questionIndex) => (
                <QuizQuestionEditor
                  key={question.id ?? `new-${questionIndex}`}
                  question={question}
                  index={questionIndex}
                  totalQuestions={values.questions.length}
                  onChange={(updater) => updateQuestion(questionIndex, updater)}
                  onRemove={() => removeQuestion(questionIndex)}
                  onAddOption={() => addOption(questionIndex)}
                  onRemoveOption={(optionIndex) => removeOption(questionIndex, optionIndex)}
                  onSetCorrect={(optionIndex) => setCorrectOption(questionIndex, optionIndex)}
                  onToggleCorrect={(optionIndex) => toggleCorrectOption(questionIndex, optionIndex)}
                />
              ))}
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border-2 border-ink-200/70 bg-white p-6 shadow-xl dark:border-ink-700 dark:bg-ink-900 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              {message ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <span className="text-lg">✅</span>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</p>
                </div>
              ) : null}
              {error ? (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 dark:bg-rose-900/20">
                  <span className="text-lg">❌</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Lỗi:</p>
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 whitespace-pre-wrap">{error}</p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading} size="lg" className="min-w-[140px] bg-indigo-600 hover:bg-indigo-700">
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang lưu...
                  </>
                ) : (
                  '💾 Lưu quiz'
                )}
              </Button>
            </div>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  )
}
