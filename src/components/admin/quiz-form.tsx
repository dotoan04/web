"use client"

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { slugify } from '@/lib/utils'

type ImportedQuestion = {
  id: string
  title: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number
  }>
  multi: boolean
}

type QuizOptionForm = {
  id?: string
  text: string
  isCorrect: boolean
  order: number
}

type QuizQuestionForm = {
  id?: string
  title: string
  content: string
  type: 'SINGLE_CHOICE'
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

type QuestionEditorProps = {
  question: QuizQuestionForm
  index: number
  totalQuestions: number
  onChange: (updater: (prev: QuizQuestionForm) => QuizQuestionForm) => void
  onRemove: () => void
  onAddOption: () => void
  onRemoveOption: (optionIndex: number) => void
  onSetCorrect: (optionIndex: number) => void
}

type OptionRowProps = {
  option: QuizOptionForm
  questionIndex: number
  optionIndex: number
  isCorrect: boolean
  disableRemove: boolean
  onSelectCorrect: () => void
  onChangeText: (value: string) => void
  onRemove: () => void
}

const OptionRow = memo(({ option, questionIndex, optionIndex, isCorrect, disableRemove, onSelectCorrect, onChangeText, onRemove }: OptionRowProps) => (
  <div className="rounded-xl border border-ink-200/60 bg-white/80 p-3 dark:border-ink-700 dark:bg-ink-800/60">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">
        <input
          type="radio"
          name={`question-${questionIndex}`}
          checked={isCorrect}
          onChange={onSelectCorrect}
        />
        Đáp án đúng
      </label>
      <Input
        value={option.text}
        onChange={(event) => onChangeText(event.target.value)}
        placeholder={`Phương án ${option.order + 1}`}
        className="flex-1"
        required
      />
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-ink-100 px-2 py-1 text-xs font-medium text-ink-500 dark:bg-ink-900/40 dark:text-ink-300">
          {option.order + 1}
        </span>
        {!disableRemove ? (
          <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 hover:text-rose-600">
            Xoá
          </Button>
        ) : null}
      </div>
    </div>
  </div>
))

OptionRow.displayName = 'OptionRow'

const QuizQuestionEditor = memo(({ question, index, totalQuestions, onChange, onRemove, onAddOption, onRemoveOption, onSetCorrect }: QuestionEditorProps) => (
  <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900">
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

    <div className="mt-4 space-y-3">
      <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">Mô tả (tuỳ chọn)</label>
      <Textarea
        rows={3}
        value={question.content}
        onChange={(event) => onChange((current) => ({ ...current, content: event.target.value }))}
        placeholder="Nhập dữ kiện hoặc mô tả bổ sung cho câu hỏi"
      />
    </div>

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
            disableRemove={question.options.length <= 2}
            onSelectCorrect={() => onSetCorrect(optionIndex)}
            onChangeText={(value) =>
              onChange((current) => ({
                ...current,
                options: current.options.map((item, idx) => (idx === optionIndex ? { ...item, text: value } : item)),
              }))
            }
            onRemove={() => onRemoveOption(optionIndex)}
          />
        ))}
      </div>
    </div>

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

  const applyImportedQuestions = (items: ImportedQuestion[]) => {
    const nextQuestions = items.map((item, questionIndex) => ({
      title: item.title,
      content: '',
      type: 'SINGLE_CHOICE' as const,
      order: questionIndex,
      points: 1,
      explanation: '',
      options: item.options.map((option, optionIndex) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        order: optionIndex,
      })),
    }))

    setValues((prev) => ({
      ...prev,
      questions: nextQuestions.length ? nextQuestions : prev.questions,
    }))

    setPreview([])
    setImportError(null)
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

  const removeQuestion = useCallback((index: number) => {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, order) => ({ ...question, order })),
    }))
  }, [])

  const addOption = useCallback((questionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: [...question.options, createEmptyOption(question.options.length)],
    }))
  }, [updateQuestion])

  const removeOption = useCallback((questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options
        .filter((_, index) => index !== optionIndex)
        .map((option, order) => ({ ...option, order })),
    }))
  }, [updateQuestion])

  const setCorrectOption = useCallback((questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.map((option, index) => ({
        ...option,
        isCorrect: index === optionIndex,
      })),
    }))
  }, [updateQuestion])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImportError(null)

    if (!file) return

    try {
      if (!file.name.endsWith('.docx')) {
        throw new Error('Chỉ hỗ trợ tập tin Word (.docx).')
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error('Tập tin quá lớn. Giới hạn 8MB.')
      }

      setImporting(true)
      const form = new FormData()
      form.append('file', file)

      const response = await fetch('/api/quizzes/import', {
        method: 'POST',
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? 'Không thể phân tích tập tin.')
      }

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

      const response = await fetch(quiz ? `/api/quizzes/${quiz.id}` : '/api/quizzes', {
        method: quiz ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          questions: values.questions.map((question, index) => ({
            ...(isValidCuid(question.id) ? { id: question.id } : {}),
            title: question.title,
            content: question.content,
            type: question.type,
            order: index,
            points: question.points,
            explanation: question.explanation,
            options: question.options.map((option, optionIndex) => ({
              ...(isValidCuid(option.id) ? { id: option.id } : {}),
              text: option.text,
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
    <Card className="p-0">
      <CardHeader className="border-b border-ink-100 px-6 py-6 dark:border-ink-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{quiz ? 'Chỉnh sửa quiz' : 'Tạo quiz mới'}</CardTitle>
            <CardDescription>
              Quản lý cấu trúc câu hỏi, thời lượng và trạng thái trước khi xuất bản.
            </CardDescription>
          </div>
          {quiz ? (
            <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading}>
              Xoá quiz
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink-700 dark:text-ink-200">Nhập đề từ Word</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  Tải tập tin .docx hoặc dán nội dung để tự động tách câu hỏi, đáp án.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">
                  <Upload size={16} />
                  <span>Tải tập tin</span>
                  <input className="hidden" type="file" accept=".docx" onChange={handleUpload} />
                </label>
                <Button type="button" variant="subtle" onClick={handlePasteText}>
                  <FileText size={16} className="mr-2" /> Dán văn bản
                </Button>
                {preview.length ? (
                  <Button type="button" variant="ghost" onClick={resetPreview}>
                    <X size={16} className="mr-1" /> Xoá preview
                  </Button>
                ) : null}
              </div>
            </div>
            {importError ? (
              <p className="mt-3 text-sm text-rose-500 dark:text-rose-300">{importError}</p>
            ) : null}
            {importing ? (
              <p className="mt-4 text-sm text-indigo-500 dark:text-indigo-300">Đang phân tích tập tin…</p>
            ) : null}
            {preview.length ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                    Preview ({preview.length} câu hỏi)
                  </h4>
                  <Button type="button" size="sm" onClick={() => applyImportedQuestions(preview)}>
                    Áp dụng vào form
                  </Button>
                </div>
                <div className="grid gap-3">
                  {preview.map((question) => (
                    <article key={question.id} className="rounded-2xl border border-ink-200/70 bg-white p-4 text-sm dark:border-ink-700 dark:bg-ink-900">
                      <h5 className="font-semibold text-ink-700 dark:text-ink-100">{question.title}</h5>
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option) => (
                          <li
                            key={option.id}
                            className={`flex items-center gap-2 ${
                              option.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-600 dark:text-ink-300'
                            }`}
                          >
                            <span className="font-semibold">{option.order + 1}.</span>
                            <span>{option.text}</span>
                            {option.isCorrect ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                Đúng
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900">
            <div className="grid gap-4 md:grid-cols-2">
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
                <label className="text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500" htmlFor="durationSeconds">
                  Thời lượng (giây)
                </label>
                <Input
                  id="durationSeconds"
                  type="number"
                  min={30}
                  value={values.durationSeconds}
                  onChange={(event) => updateQuiz({ durationSeconds: Number(event.target.value) })}
                  required
                />
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
            <div className="flex flex-col gap-2 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">Câu hỏi</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Tổng điểm hiện tại: <span className="font-medium text-emerald-600 dark:text-emerald-400">{totalPoints}</span>
                </p>
              </div>
              <Button type="button" variant="subtle" onClick={addQuestion}>
                + Thêm câu hỏi
              </Button>
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
                />
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              {message ? <p className="text-emerald-600 dark:text-emerald-400">{message}</p> : null}
              {error ? <p className="text-rose-600 dark:text-rose-400">{error}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu quiz'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
