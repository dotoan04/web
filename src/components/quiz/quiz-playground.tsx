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
  const [showSidebar, setShowSidebar] = useState(true)
  
  const QUESTIONS_PER_NAV_PAGE = 20

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(false)

  const timerProgress = useRef(1)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    timerProgress.current = progress.remainingSeconds / quiz.durationSeconds
  }, [progress.remainingSeconds, quiz.durationSeconds])

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
    () => Object.values(progress.answers).filter((value) => value.length > 0).length,
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

  const renderTimer = () => (
    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-ink-200 bg-gradient-to-br from-white to-ink-50 shadow-lg dark:border-ink-700 dark:from-ink-900 dark:to-ink-800">
      <div 
        className={`absolute inset-2 rounded-full border-4 transition-colors ${
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
      <div className="absolute inset-3 rounded-full bg-white dark:bg-ink-900" />
      <div className="relative text-center">
        <span className={`font-display text-2xl font-bold transition-colors ${
          isCriticalTime 
            ? 'text-rose-600 dark:text-rose-400' 
            : isLowTime 
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-ink-800 dark:text-ink-50'
        }`}>
          {formatDuration(progress.remainingSeconds)}
        </span>
        {isLowTime && !progress.completed && (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-500">
            Cẩn thận!
          </p>
        )}
      </div>
    </div>
  )

  const totalNavPages = Math.ceil(quiz.questions.length / QUESTIONS_PER_NAV_PAGE)
  const navStartIndex = navPage * QUESTIONS_PER_NAV_PAGE
  const navEndIndex = Math.min(navStartIndex + QUESTIONS_PER_NAV_PAGE, quiz.questions.length)
  const visibleQuestions = quiz.questions.slice(navStartIndex, navEndIndex)

  const renderQuestionNavigator = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visibleQuestions.map((question, relativeIndex) => {
          const index = navStartIndex + relativeIndex
          const selected = currentQuestionIndex === index
          const answered = Boolean(progress.answers[question.id])
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentQuestionIndex(index)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition hover:scale-110 ${selected ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm' : answered ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300'}`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
      {totalNavPages > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-ink-800/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNavPage((p) => Math.max(0, p - 1))}
            disabled={navPage === 0}
            className="h-7 px-2 text-xs"
          >
            ← Trước
          </Button>
          <span className="text-ink-500 dark:text-ink-400">
            Câu {navStartIndex + 1}–{navEndIndex} / {quiz.questions.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNavPage((p) => Math.min(totalNavPages - 1, p + 1))}
            disabled={navPage === totalNavPages - 1}
            className="h-7 px-2 text-xs"
          >
            Sau →
          </Button>
        </div>
      )}
    </div>
  )

  const renderOptions = () => (
    <div className="mt-6 space-y-3">
      <div className="hidden rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 lg:flex lg:items-center lg:gap-4">
        <span className="font-semibold">💡 Hotkeys:</span>
        <span>Bấm <kbd className="rounded bg-white px-2 py-0.5 dark:bg-ink-800">Enter</kbd> hoặc <kbd className="rounded bg-white px-2 py-0.5 dark:bg-ink-800">↓</kbd> để câu tiếp</span>
        <span>•</span>
        <span><kbd className="rounded bg-white px-2 py-0.5 dark:bg-ink-800">↑</kbd> câu trước</span>
      </div>
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

  const renderControls = () => (
    <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? 'Ẩn sidebar' : 'Hiện sidebar'}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {!progress.completed ? (
          <>
            <span className="text-sm text-ink-500 dark:text-ink-300">
              Đã trả lời {answeredCount}/{quiz.questions.length}
            </span>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <p className="text-sm text-ink-500 dark:text-ink-300">Kết quả:</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {progress.score}/{progress.totalPoints}
              </p>
            </div>
            <Button type="button" variant="subtle" onClick={handleReset}>
              Làm lại
            </Button>
          </>
        )}
      </div>
    </div>
  )

  const renderHistory = () => (
    <div className="rounded-3xl border-2 border-ink-200 bg-white p-6 shadow-xl dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">Lịch sử làm bài</h3>
        {history.length ? (
          <button
            type="button"
            className="text-xs font-medium text-ink-400 underline-offset-4 hover:underline dark:text-ink-500"
            onClick={() => setHistory(() => [])}
          >
            Xoá lịch sử
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
        Lưu cục bộ trên thiết bị để bạn có thể xem lại kết quả.
      </p>
      <div className="mt-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-ink-400 dark:text-ink-500">Chưa có lượt làm nào.</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.submissionId}
              className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm dark:border-ink-800 dark:bg-ink-900/60"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="font-medium text-ink-700 dark:text-ink-200">
                  {new Date(entry.submittedAt).toLocaleString('vi-VN')}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400">
                  {entry.score}/{entry.totalPoints} điểm
                </p>
              </div>
              <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">
                Đáp án đã chọn: {Object.values(entry.answers).filter((val) => Array.isArray(val) ? val.length > 0 : Boolean(val)).length} / {quiz.questions.length}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
      <section className={`grid gap-6 ${showSidebar ? 'lg:grid-cols-[minmax(0,7fr) minmax(0,1fr)]' : 'grid-cols-1'} lg:gap-8`}>
        <div className="flex flex-col items-center gap-5 lg:items-start">
          {renderTimer()}
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400">Làm bài</p>
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-100 lg:text-3xl">{quiz.title}</h1>
            {quiz.description ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{quiz.description}</p>
            ) : null}
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Thời lượng</p>
              <p className="mt-2 text-2xl font-bold text-ink-800 dark:text-ink-100">
                {Math.round(quiz.durationSeconds / 60)} phút
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink-200 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Số câu hỏi</p>
              <p className="mt-2 text-2xl font-bold text-ink-800 dark:text-ink-100">{quiz.questions.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-ink-200 bg-white p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900/70">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Danh sách câu hỏi</p>
            {renderQuestionNavigator()}
          </div>
        </div>
      </section>

      <section className={`grid gap-6 ${showSidebar ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,2fr)]' : 'grid-cols-1'} lg:gap-8`}>
        <div className="space-y-6">
          <article className="rounded-3xl border-2 border-ink-200 bg-white p-4 shadow-xl dark:border-ink-800 dark:bg-ink-900 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400">
                  Câu hỏi {currentQuestionIndex + 1} / {quiz.questions.length}
                </p>
                <h2 className="font-display text-2xl font-bold leading-snug text-ink-900 dark:text-ink-100 md:text-3xl">{currentQuestion.title}</h2>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white shadow-lg dark:from-indigo-400 dark:to-indigo-500">
                {currentQuestion.points}
              </span>
            </div>
            {currentQuestion.content ? (
              <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{currentQuestion.content}</p>
            ) : null}
            {renderOptions()}
            {progress.completed && currentQuestion.explanation ? (
              <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-lg dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Giải thích</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">{currentQuestion.explanation}</p>
              </div>
            ) : null}
            {renderControls()}
            {error ? <p className="mt-4 text-sm text-rose-500 dark:text-rose-300">{error}</p> : null}
          </article>
        </div>
        {showSidebar && (
          <div className="space-y-6">
            {progress.completed && (
              <div className="rounded-3xl border-2 border-ink-200 bg-white p-6 shadow-xl dark:border-ink-800 dark:bg-ink-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">Lọc kết quả</h3>
                <div className="flex gap-2">
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
              <div className="mt-4 space-y-2 text-xs text-ink-500 dark:text-ink-300">
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
                      onClick={() => goToQuestion(quiz.questions.findIndex((item) => item.id === question.id))}
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
            )}
            {renderHistory()}
          </div>
        )}
      </section>
    </div>
  )
}
