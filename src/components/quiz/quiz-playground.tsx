"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, useScroll } from 'framer-motion'

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
  title: string
  description: string | null
  durationSeconds: number
  questions: QuizQuestion[]
}

type QuizPlaygroundProps = {
  quiz: Quiz
}

type AnswerState = Record<string, string | null>

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
  answers: Object.fromEntries(quiz.questions.map((question) => [question.id, null])),
  startedAt: new Date().toISOString(),
  remainingSeconds: quiz.durationSeconds,
})

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const computeResult = (quiz: Quiz, answers: AnswerState) => {
  let score = 0
  let totalPoints = 0

  quiz.questions.forEach((question) => {
    totalPoints += question.points
    const submitted = answers[question.id]
    const correct = question.options.find((option) => option.isCorrect)?.id
    if (submitted && correct && submitted === correct) {
      score += question.points
    }
  })

  return { score, totalPoints }
}

const gradientId = (quizId: string) => `quiz-glow-${quizId}`

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
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(false)

  const timerProgress = useMotionValue(1)
  const timerScale = useTransform(timerProgress, [0, 1], [0.95, 1])
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    timerProgress.set(progress.remainingSeconds / quiz.durationSeconds)
  }, [progress.remainingSeconds, quiz.durationSeconds, timerProgress])

  useEffect(() => {
    timerProgress.set(progress.remainingSeconds / quiz.durationSeconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        timerProgress.set(next.remainingSeconds / quiz.durationSeconds)
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
  }, [quiz.durationSeconds, setProgress, progress.completed, timerProgress])

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

  const currentQuestion = quiz.questions[currentQuestionIndex]

  const answeredCount = useMemo(
    () => Object.values(progress.answers).filter((value) => value !== null).length,
    [progress.answers],
  )

  const filteredQuestions = useMemo(() => {
    if (!progress.completed || filter === 'all' || progress.score == null) {
      return quiz.questions
    }

    return quiz.questions.filter((question) => {
      const submitted = progress.answers[question.id]
      const correct = question.options.find((option) => option.isCorrect)?.id
      if (!submitted || !correct) return false
      return filter === 'correct' ? submitted === correct : submitted !== correct
    })
  }, [filter, progress.answers, progress.completed, progress.score, quiz.questions])

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      if (progress.completed) return
      setProgress((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: optionId,
        },
      }))
    },
    [progress.completed, setProgress],
  )

  const handleSubmit = useCallback(async () => {
    if (progress.completed) return

    setSubmitting(true)
    setError(null)

    try {
      const payloadAnswers = Object.fromEntries(
        Object.entries(progress.answers).filter(([, value]) => value != null) as [string, string][],
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
    setFilter('all')
    setError(null)
  }, [clearProgress, quiz, setProgress])

  const isOptionCorrect = useCallback(
    (question: QuizQuestion, option: QuizOption) => {
      if (!progress.completed) return null
      const correct = question.options.find((item) => item.isCorrect)?.id
      const submitted = progress.answers[question.id]
      if (!correct) return null
      if (option.id === correct) return true
      if (submitted === option.id && option.id !== correct) return false
      return null
    },
    [progress.answers, progress.completed],
  )

  const renderTimer = () => (
    <motion.div
      style={{ scale: timerScale }}
      className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-ink-100 bg-white/40 shadow-xl backdrop-blur dark:border-ink-700 dark:bg-ink-900/40"
    >
      <div className="absolute inset-0 rounded-full border-2 border-white/60 dark:border-ink-700" />
      <svg className="absolute inset-0" viewBox="0 0 120 120">
        <defs>
          <linearGradient id={gradientId(quiz.id)} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <circle
          className="text-ink-200 dark:text-ink-700"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
        />
        <motion.circle
          stroke={`url(#${gradientId(quiz.id)})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
          animate={{ pathLength: timerProgress.get() }}
          style={{ rotate: -90, transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className="font-display text-xl font-semibold text-ink-800 dark:text-ink-50">
        {formatDuration(progress.remainingSeconds)}
      </span>
    </motion.div>
  )

  const renderQuestionNavigator = () => (
    <div className="flex flex-wrap gap-2">
      {quiz.questions.map((question, index) => {
        const selected = currentQuestionIndex === index
        const answered = Boolean(progress.answers[question.id])
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => setCurrentQuestionIndex(index)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition ${selected ? 'border-transparent bg-gradient-to-r from-violet-500 via-indigo-400 to-sky-400 text-white shadow-lg' : answered ? 'border-emerald-400/60 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-ink-200 bg-white/60 text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300'}`}
          >
            {index + 1}
          </button>
        )
      })}
    </div>
  )

  const renderOptions = () => (
    <div className="mt-6 space-y-4">
      {currentQuestion.options.map((option) => {
        const state = isOptionCorrect(currentQuestion, option)
        const selected = progress.answers[currentQuestion.id] === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelectOption(currentQuestion.id, option.id)}
            className={`group relative flex w-full items-center rounded-2xl border px-4 py-4 text-left transition-all ${state === true ? 'border-emerald-500/60 bg-emerald-50/80 text-emerald-700 shadow-[0_12px_40px_rgba(16,185,129,0.25)] dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : state === false ? 'border-rose-400/70 bg-rose-50/80 text-rose-700 shadow-[0_12px_40px_rgba(244,114,182,0.25)] dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300' : selected ? 'border-indigo-400/60 bg-indigo-50/70 text-indigo-700 shadow-[0_12px_40px_rgba(99,102,241,0.25)] dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-ink-200/80 bg-white/70 text-ink-600 shadow-[0_12px_40px_rgba(31,38,135,0.12)] dark:border-ink-700/60 dark:bg-ink-900/50 dark:text-ink-200'}`}
          >
            <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 font-semibold">
              {option.order + 1}
            </span>
            <span className="flex-1 text-sm leading-relaxed">{option.text}</span>
            {state !== null ? (
              <span className="ml-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {state ? 'Đúng' : 'Sai'}
              </span>
            ) : null}
          </button>
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
          onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Câu trước
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentQuestionIndex((index) => Math.min(quiz.questions.length - 1, index + 1))}
          disabled={currentQuestionIndex === quiz.questions.length - 1}
        >
          Câu tiếp
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
    <div className="rounded-3xl border border-ink-100 bg-white/60 p-5 shadow-[0_20px_60px_rgba(31,38,135,0.12)] backdrop-blur dark:border-ink-800 dark:bg-ink-900/60">
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
              className="rounded-2xl border border-ink-100 bg-white/50 px-4 py-3 text-sm shadow-inner dark:border-ink-800 dark:bg-ink-900/60"
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
                Đáp án đã chọn: {Object.values(entry.answers).filter(Boolean).length} / {quiz.questions.length}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <motion.div
        style={{ y: backgroundY, opacity: glowOpacity }}
        className="fixed inset-x-0 top-24 z-0 min-h-[40vh] bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.24),_rgba(13,16,45,0))]"
      />
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ opacity: glowOpacity }}
        animate={{ scale: [1, 1.02, 1], rotate: [0, 0.6, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <div className="absolute left-1/3 top-20 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute right-1/4 top-40 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
      </motion.div>
      <div className="relative z-10 space-y-10">
        <section className="overflow-hidden rounded-3xl border border-white/20 bg-white/60 shadow-[0_30px_80px_rgba(31,38,135,0.15)] backdrop-blur-lg dark:border-white/10 dark:bg-ink-900/60">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-emerald-200/10 to-transparent dark:from-indigo-500/20 dark:via-emerald-300/10 dark:to-transparent" />
            <div className="relative grid gap-10 p-10 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-4">
                {renderTimer()}
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400">Làm bài</p>
                  <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100 lg:text-4xl">
                    {quiz.title}
                  </h1>
                  {quiz.description ? (
                    <p className="mt-3 text-sm text-ink-500 dark:text-ink-300">{quiz.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid gap-3 text-sm text-ink-500 dark:text-ink-300 sm:grid-cols-2">
                  <div className="rounded-2xl border border-ink-100 bg-white/70 p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Thời lượng</p>
                    <p className="mt-2 text-lg font-medium text-ink-800 dark:text-ink-100">
                      {Math.round(quiz.durationSeconds / 60)} phút
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ink-100 bg-white/70 p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Số câu hỏi</p>
                    <p className="mt-2 text-lg font-medium text-ink-800 dark:text-ink-100">
                      {quiz.questions.length}
                    </p>
                  </div>
                </div>
                {renderQuestionNavigator()}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-ink-100 bg-white/70 p-8 shadow-[0_20px_60px_rgba(31,38,135,0.12)] dark:border-ink-800 dark:bg-ink-900/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400">Câu hỏi {currentQuestionIndex + 1}</p>
                  <h2 className="mt-2 font-display text-2xl text-ink-900 dark:text-ink-100">
                    {currentQuestion.title}
                  </h2>
                </div>
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {currentQuestion.points} điểm
                </span>
              </div>
              {currentQuestion.content ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{currentQuestion.content}</p>
              ) : null}
              {renderOptions()}
              {progress.completed && currentQuestion.explanation ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-50/70 p-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <p className="font-medium uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-300">Giải thích</p>
                  <p className="mt-2 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              ) : null}
              {renderControls()}
              {error ? <p className="mt-4 text-sm text-rose-500 dark:text-rose-300">{error}</p> : null}
            </div>
          </div>
          <div className="space-y-6">
            {progress.completed ? (
              <div className="rounded-3xl border border-ink-100 bg-white/70 p-6 shadow-[0_20px_60px_rgba(31,38,135,0.12)] dark:border-ink-800 dark:bg-ink-900/70">
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
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === item.key ? 'bg-indigo-500/90 text-white shadow-lg' : 'bg-ink-100/70 text-ink-500 hover:bg-ink-200/60 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:bg-ink-700/60'}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs text-ink-500 dark:text-ink-300">
                  {filteredQuestions.map((question) => {
                    const submitted = progress.answers[question.id]
                    const correct = question.options.find((option) => option.isCorrect)?.id
                    const isCorrect = submitted && correct && submitted === correct
                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(quiz.questions.findIndex((item) => item.id === question.id))}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${isCorrect ? 'border-emerald-400/50 bg-emerald-50/60 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-300/60 bg-rose-50/60 text-rose-500 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'}`}
                      >
                        <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
                          Câu {quiz.questions.findIndex((item) => item.id === question.id) + 1}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {renderHistory()}
          </div>
        </section>
      </div>
    </div>
  )
}
