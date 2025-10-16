"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useLocalStorage } from '@/hooks/use-local-storage'

type QuizOption = {
  id: string
  text: string
  isCorrect: boolean
  order: number
}

type QuizQuestion = {
  id: string
  title: string
  content: string | null
  order: number
  points: number
  explanation: string | null
  options: QuizOption[]
}

type Quiz = {
  id: string
  slug: string
  title: string
  description: string | null
  durationSeconds: number
  questions: QuizQuestion[]
}

type QuizPlaygroundProps = {
  quiz: Quiz
}

type AnswerState = Record<string, string[]>

type SubmissionState = {
  quizId: string
  answers: AnswerState
  startedAt: string
  remainingSeconds: number
  completed?: boolean
  score?: number
  totalPoints?: number
  submittedAt?: string
}

type HistoryEntry = {
  submissionId: string
  score: number
  totalPoints: number
  submittedAt: string
  answers: AnswerState
}

const createInitialState = (quiz: Quiz): SubmissionState => ({
  quizId: quiz.id,
  answers: Object.fromEntries(quiz.questions.map((question) => [question.id, []])),
  startedAt: new Date().toISOString(),
  remainingSeconds: quiz.durationSeconds,
})

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const isMultipleChoice = (question: QuizQuestion) => 
  question.options.filter((o) => o.isCorrect).length > 1

const computeResult = (quiz: Quiz, answers: AnswerState) => {
  let score = 0
  let totalPoints = 0

  quiz.questions.forEach((question) => {
    totalPoints += question.points
    const selected = answers[question.id] ?? []
    const correctIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort()
    const selectedIds = [...selected].sort()
    const isCorrectAnswer =
      correctIds.length === selectedIds.length &&
      correctIds.every((id, i) => id === selectedIds[i])
    if (isCorrectAnswer) {
      score += question.points
    }
  })

  return { score, totalPoints }
}

export const QuizPlayground = ({ quiz }: QuizPlaygroundProps) => {
  const storageKey = useMemo(() => `quiz-progress:${quiz.id}`, [quiz.id])
  const historyKey = useMemo(() => `quiz-history:${quiz.id}`, [quiz.id])

  const [progress, setProgress, clearProgress] = useLocalStorage<SubmissionState>(storageKey, {
    defaultValue: createInitialState(quiz),
  })

  const [history, setHistory] = useLocalStorage<HistoryEntry[]>(historyKey, {
    defaultValue: [],
  })

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [navPage, setNavPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  const QUESTIONS_PER_NAV_PAGE = 20

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(false)
  const normalized = useRef(false)

  const timerProgress = useRef(1)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    timerProgress.current = progress.remainingSeconds / quiz.durationSeconds
  }, [progress.remainingSeconds, quiz.durationSeconds])

  // Normalize legacy localStorage data (convert null to empty arrays)
  useEffect(() => {
    if (normalized.current) return
    const needsNormalization = Object.values(progress.answers).some((value) => !Array.isArray(value))
    if (needsNormalization) {
      normalized.current = true
      setProgress((prev) => ({
        ...prev,
        answers: Object.fromEntries(
          Object.entries(prev.answers).map(([key, value]) => [key, Array.isArray(value) ? value : []])
        ),
      }))
    }
  }, [progress.answers, setProgress])
  
  const currentQuestion = quiz.questions[currentQuestionIndex]

  const handleToggleOption = useCallback(
    (questionId: string, optionId: string) => {
      if (progress.completed) return
      setProgress((prev) => {
        const current = prev.answers[questionId] ?? []
        const question = quiz.questions.find((q) => q.id === questionId)
        if (!question) return prev
        const isMulti = isMultipleChoice(question)
        let newSelected: string[]
        if (isMulti) {
          newSelected = current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId]
        } else {
          newSelected = current.includes(optionId) ? [] : [optionId]
        }
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: newSelected,
          },
        }
      })
    },
    [progress.completed, quiz.questions, setProgress],
  )

  const goToQuestion = useCallback((newIndex: number) => {
    setCurrentQuestionIndex(newIndex)
    const newNavPage = Math.floor(newIndex / QUESTIONS_PER_NAV_PAGE)
    setNavPage(newNavPage)
  }, [QUESTIONS_PER_NAV_PAGE])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (progress.completed) return
      
      const key = event.key.toLowerCase()
      
      if (key === 'enter') {
        event.preventDefault()
        goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))
      } else if (key === 'arrowup') {
        event.preventDefault()
        goToQuestion(Math.max(0, currentQuestionIndex - 1))
      } else if (key === 'arrowdown') {
        event.preventDefault()
        goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [progress.completed, currentQuestionIndex, goToQuestion, quiz.questions.length])

  useEffect(() => {
    if (progress.completed) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev.completed) return prev
        const next = { ...prev, remainingSeconds: Math.max(0, prev.remainingSeconds - 1) }
        timerProgress.current = next.remainingSeconds / quiz.durationSeconds
        if (next.remainingSeconds === 0) {
          next.completed = true
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [quiz.durationSeconds, setProgress, progress.completed])

  useEffect(() => {
    if (progress.completed && progress.score != null && progress.totalPoints != null && !progress.submittedAt) {
      const entry: HistoryEntry = {
        submissionId: `${quiz.id}-${Date.now()}`,
        score: progress.score,
        totalPoints: progress.totalPoints,
        submittedAt: new Date().toISOString(),
        answers: progress.answers,
      }
      setHistory((prev) => [entry, ...prev].slice(0, 10))
      setProgress((prev) => ({ ...prev, submittedAt: entry.submittedAt }))
    }
  }, [progress.answers, progress.completed, progress.score, progress.totalPoints, progress.submittedAt, quiz.id, setHistory, setProgress])

  const answeredCount = useMemo(
    () => Object.values(progress.answers).filter((value) => Array.isArray(value) && value.length > 0).length,
    [progress.answers],
  )

  const filteredQuestions = useMemo(() => {
    if (!progress.completed || filter === 'all' || progress.score == null) {
      return quiz.questions
    }

    return quiz.questions.filter((question) => {
      const selected = progress.answers[question.id] ?? []
      const correctIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort()
      const selectedIds = [...selected].sort()
      const isCorrectAnswer =
        correctIds.length === selectedIds.length &&
        correctIds.every((id, i) => id === selectedIds[i])
      return filter === 'correct' ? isCorrectAnswer : !isCorrectAnswer
    })
  }, [filter, progress.answers, progress.completed, progress.score, quiz.questions])

  const handleSubmit = useCallback(async () => {
    if (progress.completed) return

    setSubmitting(true)
    setError(null)

    try {
      const payloadAnswers = Object.fromEntries(
        Object.entries(progress.answers).filter(([, value]) => value.length > 0)
      )

      const response = await fetch(`/api/quizzes/${quiz.slug}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: payloadAnswers,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Không thể nộp bài kiểm tra')
      }

      const { score, totalPoints } = data?.score != null && data?.totalPoints != null
        ? { score: data.score as number, totalPoints: data.totalPoints as number }
        : computeResult(quiz, progress.answers)

      setProgress((prev) => ({
        ...prev,
        completed: true,
        score,
        totalPoints,
      }))
    } catch (error) {
      console.error(error)
      setError((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }, [progress.answers, progress.completed, quiz, setProgress])

  const handleReset = useCallback(() => {
    clearProgress()
    setProgress(createInitialState(quiz))
    setCurrentQuestionIndex(0)
    setNavPage(0)
    setFilter('all')
    setError(null)
  }, [clearProgress, quiz, setProgress])

  const getOptionState = useCallback(
    (question: QuizQuestion, option: QuizOption) => {
      if (!progress.completed) return null
      const selected = progress.answers[question.id] ?? []
      if (selected.includes(option.id)) {
        return option.isCorrect ? 'correct' : 'incorrect'
      } else if (option.isCorrect) {
        return 'missed'
      }
      return null
    },
    [progress.answers, progress.completed],
  )

  const timePercentage = (progress.remainingSeconds / quiz.durationSeconds) * 100
  const isLowTime = timePercentage < 20
  const isCriticalTime = timePercentage < 10

  const renderCompactTimer = () => (
    <div className="flex items-center gap-2">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
        <div 
          className={`absolute inset-0.5 rounded-full border-2 transition-colors ${
            isCriticalTime 
              ? 'border-rose-500 dark:border-rose-400' 
              : isLowTime 
              ? 'border-orange-400 dark:border-orange-300'
              : 'border-indigo-400/70 dark:border-indigo-500/40'
          }`}
          style={{
            background: `conic-gradient(${isCriticalTime ? 'rgb(244 63 94)' : isLowTime ? 'rgb(251 146 60)' : 'rgb(99 102 241)'} ${timePercentage * 3.6}deg, transparent 0deg)`
          }}
        />
        <div className="absolute inset-1 rounded-full bg-white dark:bg-ink-900" />
        <span className={`relative text-xs font-bold transition-colors ${
          isCriticalTime 
            ? 'text-rose-600 dark:text-rose-400' 
            : isLowTime 
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-ink-800 dark:text-ink-50'
        }`}>
          {formatDuration(progress.remainingSeconds)}
        </span>
      </div>
      {isLowTime && !progress.completed && (
        <span className="text-xs font-semibold text-rose-500">Cẩn thận!</span>
      )}
    </div>
  )

  const totalNavPages = Math.ceil(quiz.questions.length / QUESTIONS_PER_NAV_PAGE)
  const navStartIndex = navPage * QUESTIONS_PER_NAV_PAGE
  const navEndIndex = Math.min(navStartIndex + QUESTIONS_PER_NAV_PAGE, quiz.questions.length)
  const visibleQuestions = quiz.questions.slice(navStartIndex, navEndIndex)

  const renderOptions = () => (
    <div className="space-y-3">
      {currentQuestion.options.map((option, optionIdx) => {
        const state = getOptionState(currentQuestion, option)
        const isMulti = isMultipleChoice(currentQuestion)
        const checked = (progress.answers[currentQuestion.id] ?? []).includes(option.id)
        return (
          <label
            key={option.id}
            htmlFor={option.id}
            className={`group flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:scale-100 ${
              state === 'correct'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300'
                : state === 'incorrect'
                ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-md dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-300'
                : state === 'missed'
                ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-md dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-300'
                : checked
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:shadow-sm dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:border-ink-600'
            }`}
          >
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              id={option.id}
              name={isMulti ? undefined : currentQuestion.id}
              checked={checked}
              onChange={() => handleToggleOption(currentQuestion.id, option.id)}
              disabled={progress.completed}
              className="h-5 w-5 rounded border-ink-300 text-indigo-600 focus:ring-indigo-500 dark:border-ink-600 dark:bg-ink-800"
            />
            <span className="flex-1 text-base font-medium leading-relaxed">{option.text}</span>
            {state !== null ? (
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                state === 'correct' ? 'bg-emerald-600 text-white dark:bg-emerald-500' 
                : state === 'incorrect' ? 'bg-rose-600 text-white dark:bg-rose-500'
                : 'bg-blue-600 text-white dark:bg-blue-500'
              }`}>
                {state === 'correct' ? '✓ Đúng' 
                 : state === 'incorrect' ? '✗ Sai'
                 : '✓ Đúng (chưa chọn)'}
              </span>
            ) : null}
          </label>
        )
      })}
    </div>
  )

  const renderFilterModal = () => {
    if (!showFilterModal || !progress.completed) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFilterModal(false)}>
        <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border-2 border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
          <div className="border-b border-ink-200 p-4 dark:border-ink-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">Danh sách câu hỏi</h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="rounded-full p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'correct', label: 'Đúng' },
                { key: 'incorrect', label: 'Sai' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as typeof filter)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === item.key ? 'bg-indigo-500 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto p-4">
            {filteredQuestions.map((question) => {
              const selected = progress.answers[question.id] ?? []
              const correctIds = question.options
                .filter((o) => o.isCorrect)
                .map((o) => o.id)
                .sort()
              const selectedIds = [...selected].sort()
              const isCorrectAnswer =
                correctIds.length === selectedIds.length &&
                correctIds.every((id, i) => id === selectedIds[i])
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    goToQuestion(quiz.questions.findIndex((item) => item.id === question.id))
                    setShowFilterModal(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:scale-[1.02] ${isCorrectAnswer ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-300 bg-rose-50 text-rose-500 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'}`}
                >
                  <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Câu {quiz.questions.findIndex((item) => item.id === question.id) + 1}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">
                    {isCorrectAnswer ? 'Đúng' : 'Sai'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      {renderFilterModal()}
      
      {/* Compact Header */}
      <header className="sticky top-0 z-10 mb-4 rounded-xl border-2 border-ink-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm dark:border-ink-700 dark:bg-ink-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {renderCompactTimer()}
            <div className="h-8 w-px bg-ink-200 dark:bg-ink-700" />
            <div>
              <h1 className="text-sm font-bold text-ink-800 dark:text-ink-100">{quiz.title}</h1>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {quiz.questions.length} câu · {answeredCount} đã trả lời
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {progress.completed && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowFilterModal(true)}
                className="text-xs"
              >
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Lọc câu hỏi
              </Button>
            )}
            {!progress.completed ? (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {progress.score}/{progress.totalPoints}
                </span>
                <Button type="button" size="sm" variant="subtle" onClick={handleReset}>
                  Làm lại
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Question Navigator */}
        <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
          <div className="flex flex-wrap gap-2">
            {visibleQuestions.map((question, relativeIndex) => {
              const index = navStartIndex + relativeIndex
              const selected = currentQuestionIndex === index
              const answered = Array.isArray(progress.answers[question.id]) && progress.answers[question.id].length > 0
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition hover:scale-105 ${selected ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm' : answered ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300'}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          {totalNavPages > 1 && (
            <div className="mt-2 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNavPage((p) => Math.max(0, p - 1))}
                disabled={navPage === 0}
                className="h-6 px-2 text-xs"
              >
                ← Trước
              </Button>
              <span>
                Câu {navStartIndex + 1}–{navEndIndex} / {quiz.questions.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNavPage((p) => Math.min(totalNavPages - 1, p + 1))}
                disabled={navPage === totalNavPages - 1}
                className="h-6 px-2 text-xs"
              >
                Sau →
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Question Area */}
      <main className="mx-auto max-w-4xl">
        <article className="rounded-2xl border-2 border-ink-200 bg-white p-6 shadow-lg dark:border-ink-800 dark:bg-ink-900 md:p-8">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Câu hỏi {currentQuestionIndex + 1} / {quiz.questions.length}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink-900 dark:text-ink-100 md:text-3xl">
                {currentQuestion.title}
              </h2>
            </div>
            <span className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white shadow-lg dark:from-indigo-400 dark:to-indigo-500">
              {currentQuestion.points}
            </span>
          </div>

          {currentQuestion.content && (
            <p className="mb-6 text-base leading-relaxed text-ink-600 dark:text-ink-300">
              {currentQuestion.content}
            </p>
          )}

          {renderOptions()}

          {progress.completed && currentQuestion.explanation && (
            <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-md dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Giải thích
                </p>
              </div>
              <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6 dark:border-ink-800">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                ← Câu trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
              >
                Câu tiếp →
              </Button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-500 dark:text-rose-300">{error}</p>}
        </article>
      </main>
    </div>
  )
}
