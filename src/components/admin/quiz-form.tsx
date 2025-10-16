"use client"

import { useEffect, useMemo, useState } from 'react'
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

  const updateQuiz = (partial: Partial<QuizFormValues>) => setValues((prev) => ({ ...prev, ...partial }))

  const updateQuestion = (index: number, updater: (question: QuizQuestionForm) => QuizQuestionForm) => {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions.map((question, questionIndex) =>
        questionIndex === index ? updater(question) : question,
      ),
    }))
  }

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

  const addQuestion = () => {
    setValues((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion(prev.questions.length)],
    }))
  }

  const removeQuestion = (index: number) => {
    setValues((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, questionIndex) => questionIndex !== index).map((question, order) => ({
        ...question,
        order,
      })),
    }))
  }

  const addOption = (questionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: [...question.options, createEmptyOption(question.options.length)],
    }))
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.filter((_, index) => index !== optionIndex).map((option, order) => ({
        ...option,
        order,
      })),
    }))
  }

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,
      options: question.options.map((option, index) => ({
        ...option,
        isCorrect: index === optionIndex,
      })),
    }))
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
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-2xl">{quiz ? 'Chỉnh sửa quiz' : 'Tạo quiz mới'}</CardTitle>
          <CardDescription>
            Xây dựng bài kiểm tra chuyên nghiệp với thời gian, chấm điểm tự động và kết quả chi tiết.
          </CardDescription>
        </div>
        {quiz ? (
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading}>
            Xoá quiz
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="rounded-3xl border border-ink-100 bg-white/70 p-5 shadow-inner dark:border-ink-800 dark:bg-ink-900/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">Nhập đề từ Word</h3>
                <p className="text-sm text-ink-500 dark:text-ink-300">
                  Tải tập tin .docx chứa câu hỏi, đáp án bôi đỏ hoặc đánh dấu * sẽ được nhận diện tự động.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-400">
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
                  <h4 className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                    Preview ({preview.length} câu hỏi)
                  </h4>
                  <Button type="button" size="sm" onClick={() => applyImportedQuestions(preview)}>
                    Áp dụng vào form
                  </Button>
                </div>
                <div className="grid gap-3">
                  {preview.map((question) => (
                    <article
                      key={question.id}
                      className="rounded-2xl border border-ink-100/70 bg-white/60 p-4 text-sm shadow-sm dark:border-ink-800 dark:bg-ink-900/70"
                    >
                      <h5 className="font-semibold text-ink-700 dark:text-ink-100">{question.title}</h5>
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option) => (
                          <li
                            key={option.id}
                            className={`flex items-center gap-2 ${
                              option.isCorrect
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-ink-600 dark:text-ink-300'
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="title">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="slug">
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="description">
              Mô tả
            </label>
            <Textarea
              id="description"
              rows={3}
              value={values.description}
              onChange={(event) => updateQuiz({ description: event.target.value })}
              placeholder="Giới thiệu nội dung bài kiểm tra, mức độ và mục tiêu."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="durationSeconds">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="status">
                Trạng thái
              </label>
              <select
                id="status"
                className="w-full rounded-xl border border-ink-200 bg-white/70 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                value={values.status}
                onChange={(event) => updateQuiz({ status: event.target.value as 'DRAFT' | 'PUBLISHED' })}
              >
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Xuất bản</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600" htmlFor="autoReleaseAt">
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

          <div className="rounded-2xl border border-ink-100 bg-white/70 p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-ink-800 dark:text-ink-100">Câu hỏi</h3>
                <p className="text-sm text-ink-500">
                  Tổng điểm hiện tại: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalPoints}</span>
                </p>
              </div>
              <Button type="button" variant="subtle" onClick={addQuestion}>
                + Thêm câu hỏi
              </Button>
            </div>

            <div className="mt-4 space-y-6">
              {values.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="rounded-2xl border border-ink-100 bg-white/50 p-4 shadow-inner dark:border-ink-700 dark:bg-ink-900/70">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/10 font-medium text-ink-800 dark:bg-ink-50/10 dark:text-ink-100">
                        {questionIndex + 1}
                      </span>
                      <Input
                        value={question.title}
                        onChange={(event) =>
                          updateQuestion(questionIndex, (current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Nhập nội dung câu hỏi"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="w-24"
                        value={question.points}
                        onChange={(event) =>
                          updateQuestion(questionIndex, (current) => ({ ...current, points: Number(event.target.value) }))
                        }
                      />
                      <span className="text-sm text-ink-400">điểm</span>
                      {values.questions.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          Xoá
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <Textarea
                    className="mt-3"
                    rows={3}
                    value={question.content}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({ ...current, content: event.target.value }))
                    }
                    placeholder="Mô tả chi tiết hoặc dữ kiện cho câu hỏi (tuỳ chọn)"
                  />

                  <div className="mt-3 space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex flex-col gap-2 rounded-xl border border-ink-100 bg-white/60 p-3 dark:border-ink-700 dark:bg-ink-800/60 md:flex-row md:items-center md:gap-3">
                        <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-200">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={option.isCorrect}
                            onChange={() => setCorrectOption(questionIndex, optionIndex)}
                          />
                          Đáp án đúng
                        </label>
                        <Input
                          value={option.text}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (current) => ({
                              ...current,
                              options: current.options.map((item, itemIndex) =>
                                itemIndex === optionIndex ? { ...item, text: event.target.value } : item,
                              ),
                            }))
                          }
                          placeholder={`Phương án ${optionIndex + 1}`}
                          required
                        />
                        {question.options.length > 2 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            Xoá
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between">
                    <Button type="button" variant="subtle" onClick={() => addOption(questionIndex)}>
                      + Thêm phương án
                    </Button>
                    <Textarea
                      className="w-full max-w-xl"
                      rows={2}
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(questionIndex, (current) => ({ ...current, explanation: event.target.value }))
                      }
                      placeholder="Giải thích hoặc ghi chú cho đáp án (tuỳ chọn)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              {message ? <p className="text-emerald-600 dark:text-emerald-400">{message}</p> : null}
              {error ? <p className="text-rose-600 dark:text-rose-400">{error}</p> : null}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu quiz'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
