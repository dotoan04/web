"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { useSwipeable } from 'react-swipeable'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
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

const NAME_STORAGE_KEY = 'quiz-user-name'

type SubmissionPayload = {
  answers: Record<string, string[]>
  durationSeconds: number
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
  question.type === 'MULTIPLE_CHOICE' || question.options.filter((o) => o.isCorrect).length > 1

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

  const [storedName, setStoredName] = useLocalStorage<string | null>(NAME_STORAGE_KEY, {
    defaultValue: null,
  })

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [navPage, setNavPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [loadingGifUrl, setLoadingGifUrl] = useState<string | null>(null)
  const pendingSubmissionRef = useRef<{ answers: AnswerState; durationSeconds: number } | null>(null)
  const hasPromptedRef = useRef(false)
  
  const QUESTIONS_PER_NAV_PAGE = 20

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(false)
  const normalized = useRef(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

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

  useEffect(() => {
    if (!progress.completed || storedName || pendingSubmissionRef.current) {
      return
    }

    const answered = Object.fromEntries(
      Object.entries(progress.answers).filter(([, value]) => value.length > 0),
    )

    const durationSeconds = Math.max(
      0,
      Math.min(
        quiz.durationSeconds,
        Math.round((Date.now() - new Date(progress.startedAt).getTime()) / 1000),
      ),
    )

    pendingSubmissionRef.current = { answers: answered, durationSeconds }
    setShowNamePrompt(true)
    hasPromptedRef.current = true
  }, [progress.answers, progress.completed, progress.startedAt, quiz.durationSeconds, storedName])

  useEffect(() => {
    if (!showNamePrompt) return
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNamePrompt(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNamePrompt])

  useEffect(() => {
    if (showNamePrompt) {
      setNameInput(storedName ?? '')
      requestAnimationFrame(() => nameInputRef.current?.focus())
    }
  }, [showNamePrompt, storedName])

  useEffect(() => {
    if (submitting) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [submitting])

  useEffect(() => {
    const fetchGifUrl = async () => {
      try {
        const response = await fetch('/api/quiz-settings')
        const data = await response.json()
        setLoadingGifUrl(data.loadingGifUrl)
      } catch (error) {
        console.error('Failed to fetch quiz settings:', error)
      }
    }
    void fetchGifUrl()
  }, [])
  
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
      
      // Handle number keys for answer selection (1-9)
      if (/^[1-9]$/.test(key)) {
        event.preventDefault()
        const optionIndex = parseInt(key) - 1
        if (optionIndex < currentQuestion.options.length) {
          handleToggleOption(currentQuestion.id, currentQuestion.options[optionIndex].id)
        }
      }
      // Handle 0 key for option 10 if exists
      else if (key === '0') {
        event.preventDefault()
        if (currentQuestion.options.length >= 10) {
          handleToggleOption(currentQuestion.id, currentQuestion.options[9].id)
        }
      }
      // Handle navigation keys
      else if (key === 'enter') {
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
  }, [progress.completed, currentQuestionIndex, goToQuestion, quiz.questions.length, currentQuestion, handleToggleOption])

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

  const submitQuiz = useCallback(
    async (payload: { answers: AnswerState; durationSeconds: number; participant: string }) => {
      const response = await fetch(`/api/quizzes/${quiz.slug}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: payload.answers,
          durationSeconds: payload.durationSeconds,
          participant: payload.participant,
        }),
      })

      if (!response.ok) {
        throw new Error('Không thể lưu kết quả quiz')
      }

      const result = await response.json()
      const submittedAt = new Date().toISOString()

      setProgress((prev) => ({
        ...prev,
        completed: true,
        submittedAt,
        score: result.score,
        totalPoints: result.totalPoints,
      }))

      setHistory((prev) => [
        {
          submissionId: result.submissionId,
          score: result.score,
          totalPoints: result.totalPoints,
          submittedAt,
          answers: payload.answers,
        },
        ...prev,
      ].slice(0, 10))
    },
    [quiz.slug, setHistory, setProgress],
  )

  const handleSubmit = useCallback(async () => {
    if (progress.completed || submitting) return

    setError(null)

    const answered = Object.fromEntries(
      Object.entries(progress.answers).filter(([, value]) => value.length > 0),
    )

    const durationSeconds = Math.max(
      0,
      Math.min(
        quiz.durationSeconds,
        Math.round((Date.now() - new Date(progress.startedAt).getTime()) / 1000),
      ),
    )

    if (!storedName) {
      pendingSubmissionRef.current = { answers: answered, durationSeconds }
      setShowNamePrompt(true)
      return
    }

    setSubmitting(true)
    try {
      await submitQuiz({
        answers: answered,
        durationSeconds,
        participant: storedName,
      })
    } catch (error) {
      console.error(error)
      setError((error as Error).message)
      setSubmitting(false)
    }
  }, [progress.answers, progress.completed, progress.startedAt, quiz.durationSeconds, storedName, submitQuiz, submitting])

  const handleReset = useCallback(() => {
    clearProgress()
    setProgress(createInitialState(quiz))
    setCurrentQuestionIndex(0)
    setNavPage(0)
    setFilter('all')
    setError(null)
    setShowNamePrompt(false)
  }, [clearProgress, quiz, setProgress])

  const handleSaveName = useCallback(async () => {
    if (submitting) return
    
    const trimmed = nameInput.trim()
    const finalName = trimmed.length > 0 ? trimmed : 'Anonymous'
    setStoredName(finalName)
    setShowNamePrompt(false)
    hasPromptedRef.current = true
    
    if (pendingSubmissionRef.current) {
      setSubmitting(true)
      try {
        await submitQuiz({ ...pendingSubmissionRef.current, participant: finalName })
      } catch (error) {
        console.error(error)
        setError((error as Error).message)
        setSubmitting(false)
      }
      pendingSubmissionRef.current = null
    }
  }, [nameInput, setStoredName, submitQuiz, submitting])

  const handleSkipName = useCallback(async () => {
    if (submitting) return
    
    setShowNamePrompt(false)
    hasPromptedRef.current = true
    
    if (pendingSubmissionRef.current) {
      setSubmitting(true)
      try {
        await submitQuiz({ ...pendingSubmissionRef.current, participant: 'Anonymous' })
      } catch (error) {
        console.error(error)
        setError((error as Error).message)
        setSubmitting(false)
      }
      pendingSubmissionRef.current = null
    }
  }, [submitQuiz, submitting])

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

  const renderCompactTimer = useMemo(() => (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-lg shadow-white/10 dark:border-white/10 dark:bg-white/5 dark:shadow-white/5">
        <div 
          className={`absolute inset-1 rounded-lg sm:rounded-xl transition-all ${
            isCriticalTime 
              ? 'border-2 border-rose-500/50' 
              : isLowTime 
              ? 'border-2 border-orange-400/50'
              : 'border-2 border-indigo-400/50'
          }`}
          style={{
            background: `conic-gradient(${isCriticalTime ? 'rgb(244 63 94)' : isLowTime ? 'rgb(251 146 60)' : 'rgb(99 102 241)'} ${timePercentage * 3.6}deg, transparent 0deg)`,
          }}
        />
        <div className="absolute inset-2 rounded-md sm:rounded-lg bg-white/60 backdrop-blur-sm dark:bg-white/10" />
        <span className={`relative text-[10px] sm:text-xs font-bold transition-colors font-sans ${
          isCriticalTime 
            ? 'text-rose-600 dark:text-rose-400' 
            : isLowTime 
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-gray-700 dark:text-gray-200'
        }`}>
          {formatDuration(progress.remainingSeconds)}
        </span>
      </div>
      {isLowTime && !progress.completed && (
        <span className="hidden sm:inline text-xs font-semibold text-rose-600 rounded-full px-2 py-1 bg-rose-50/80 backdrop-blur-sm border border-rose-200/50 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300 font-sans">
          ⚠️ Cẩn thận!
        </span>
      )}
    </div>
  ), [timePercentage, isCriticalTime, isLowTime, progress.remainingSeconds, progress.completed])

  const totalNavPages = Math.ceil(quiz.questions.length / QUESTIONS_PER_NAV_PAGE)
  const navStartIndex = navPage * QUESTIONS_PER_NAV_PAGE
  const navEndIndex = Math.min(navStartIndex + QUESTIONS_PER_NAV_PAGE, quiz.questions.length)
  const visibleQuestions = quiz.questions.slice(navStartIndex, navEndIndex)

  // Swipe handlers for mobile navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!progress.completed && currentQuestionIndex < quiz.questions.length - 1) {
        goToQuestion(currentQuestionIndex + 1)
      }
    },
    onSwipedRight: () => {
      if (!progress.completed && currentQuestionIndex > 0) {
        goToQuestion(currentQuestionIndex - 1)
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50,
  })

  const renderOptions = useMemo(() => (
    <div className="space-y-2 sm:space-y-3">
      {currentQuestion.options.map((option, optionIdx) => {
        const state = getOptionState(currentQuestion, option)
        const isMulti = isMultipleChoice(currentQuestion)
        const checked = (progress.answers[currentQuestion.id] ?? []).includes(option.id)
        const shortcutKey = optionIdx < 9 ? (optionIdx + 1).toString() : '0'
        const toneClasses =
          state === 'correct'
            ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
            : state === 'incorrect'
            ? 'border-rose-400/60 bg-rose-100/55 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200'
            : state === 'missed'
            ? 'border-sky-400/60 bg-sky-100/55 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200'
            : checked
            ? 'border-indigo-400/60 bg-indigo-100/55 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200'
            : 'border-white/25 bg-white/45 text-slate-700 hover:border-white/40 hover:bg-white/55 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500/60 dark:hover:bg-slate-900/55'
        const badgeTone =
          state === 'correct'
            ? 'border border-transparent bg-emerald-500 text-white'
            : state === 'incorrect'
            ? 'border border-transparent bg-rose-500 text-white'
            : state === 'missed'
            ? 'border border-transparent bg-sky-500 text-white'
            : checked
            ? 'border border-transparent bg-indigo-500 text-white'
            : 'border border-white/40 bg-white/45 text-slate-600 dark:border-slate-600/40 dark:bg-slate-900/60 dark:text-slate-300'
        const statusBadgeTone =
          state === 'correct'
            ? 'bg-emerald-500/85 text-white'
            : state === 'incorrect'
            ? 'bg-rose-500/85 text-white'
            : 'bg-sky-500/85 text-white'
        
        return (
          <label
            key={option.id}
            htmlFor={option.id}
            className={`group relative flex w-full items-center gap-2 sm:gap-3 md:gap-4 overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-xl transition-colors touch-manipulation cursor-pointer p-3 sm:p-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-200/60 dark:focus-within:ring-indigo-500/40 ${toneClasses}`}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />
            
            {/* Shortcut key indicator */}
            <div className={`relative z-10 hidden shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold md:text-xs sm:flex h-7 w-7 md:h-8 md:w-8 ${badgeTone}`}>
              {shortcutKey}
            </div>
            
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              id={option.id}
              name={isMulti ? undefined : currentQuestion.id}
              checked={checked}
              onChange={() => handleToggleOption(currentQuestion.id, option.id)}
              disabled={progress.completed}
              className="relative z-10 h-4 w-4 shrink-0 rounded border border-white/40 bg-white/40 text-indigo-600 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0 dark:border-slate-600/50 dark:bg-slate-900/50"
            />
            
            <span className="relative z-10 flex-1 text-sm sm:text-base font-medium leading-relaxed font-sans break-words">{option.text}</span>
            
            {state !== null ? (
              <span className={`relative z-10 shrink-0 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm ${statusBadgeTone}`}>
                <span className="hidden sm:inline">
                  {state === 'correct' ? '✓ Đúng' 
                   : state === 'incorrect' ? '✗ Sai'
                   : '✓ Đúng (chưa chọn)'}
                </span>
                <span className="sm:hidden">
                  {state === 'correct' ? '✓' 
                   : state === 'incorrect' ? '✗'
                   : '✓'}
                </span>
              </span>
            ) : null}
          </label>
        )
      })}
    </div>
  ), [currentQuestion, progress.answers, progress.completed, getOptionState, handleToggleOption])

  const renderFilterModal = () => {
    if (!showFilterModal || !progress.completed) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFilterModal(false)}>
        <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/70 shadow-[0_24px_60px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_24px_60px_rgba(2,6,23,0.7)]" onClick={(e) => e.stopPropagation()}>
          <div className="border-b border-white/20 p-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Danh sách câu hỏi</h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/40 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === item.key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/40 text-slate-600 hover:bg-white/55 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800/75'
                  }`}
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
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                    isCorrectAnswer
                      ? 'border-emerald-300/70 bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100/70 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25'
                      : 'border-rose-300/70 bg-rose-50/80 text-rose-500 hover:bg-rose-100/70 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Câu {quiz.questions.findIndex((item) => item.id === question.id) + 1}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
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
    <div className="relative mx-auto min-h-screen max-w-7xl p-3 sm:p-4 md:p-6">
      {showNamePrompt &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={handleSkipName}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Tên của bạn là gì?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Bạn có thể lưu lại tên của mình cho các lần nộp tiếp theo hoặc bỏ qua.
              </p>
              <div className="mt-4 space-y-4">
                <Input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Nhập tên của bạn"
                  autoComplete="name"
                  className="h-11"
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={handleSkipName} className="sm:flex-1">
                    Bỏ qua
                  </Button>
                  <Button type="button" onClick={handleSaveName} className="sm:flex-1">
                    Lưu tên
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {submitting &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90">
              <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
                Chờ xíu !!
              </h2>
              
              {/* Loading GIF */}
              {loadingGifUrl && (
                <div className="my-8 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={loadingGifUrl} 
                    alt="Loading..." 
                    className="h-32 w-32 object-contain"
                  />
                </div>
              )}
              
              <p className="text-center text-base font-medium text-slate-700 dark:text-slate-300">
                Đang chấm điểm cho bạn
              </p>
            </div>
          </div>,
          document.body,
        )}

      {/* Ambient gradient to emulate liquid glass */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_15%,rgba(195,221,255,0.6),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(214,187,255,0.55),transparent_60%),radial-gradient(circle_at_50%_80%,rgba(165,243,252,0.45),transparent_65%)] dark:bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.45),transparent_60%),radial-gradient(circle_at_85%_10%,rgba(109,40,217,0.5),transparent_65%),radial-gradient(circle_at_50%_80%,rgba(6,182,212,0.35),transparent_70%)]" />
      
      {/* Soft light blobs to reinforce depth without affecting layout */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-72 w-72 rounded-[40%] bg-white/30 blur-3xl dark:bg-white/10" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-[45%] bg-white/20 blur-3xl dark:bg-white/5" />
        <div className="absolute top-1/4 right-0 h-64 w-64 rounded-[38%] bg-white/15 blur-2xl dark:bg-white/5" />
      </div>
      
      {renderFilterModal()}
      
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-10 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-white/40 bg-white/60 p-3 sm:p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)] ring-1 ring-white/30 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[0_18px_45px_rgba(2,6,23,0.55)] dark:ring-white/5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {renderCompactTimer}
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-sans truncate">{quiz.title}</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-sans">
                {quiz.questions.length} câu · {answeredCount} đã trả lời
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {progress.completed && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowFilterModal(true)}
                className="text-[10px] sm:text-xs px-2 sm:px-3"
              >
                <svg className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Lọc câu hỏi</span>
                <span className="sm:hidden">Lọc</span>
              </Button>
            )}
            {!progress.completed ? (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting} className="text-xs sm:text-sm">
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {progress.score}/{progress.totalPoints}
                </span>
                <Button type="button" size="sm" variant="subtle" onClick={handleReset} className="text-xs sm:text-sm">
                  Làm lại
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Question Navigator - Mobile Optimized */}
        <div className="mt-3 sm:mt-4 border-t border-gray-200/50 pt-3 sm:pt-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {visibleQuestions.map((question, relativeIndex) => {
              const index = navStartIndex + relativeIndex
              const selected = currentQuestionIndex === index
              const answered = Array.isArray(progress.answers[question.id]) && progress.answers[question.id].length > 0
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-medium transition-colors touch-manipulation backdrop-blur-sm ${
                    selected 
                      ? 'border-indigo-400/70 bg-indigo-500/85 text-white' 
                      : answered 
                      ? 'border-emerald-400/60 bg-emerald-500/80 text-white' 
                      : 'border-white/30 bg-white/40 text-slate-600 hover:border-white/45 hover:bg-white/55 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-900/55'
                  }`}
                >
                  {selected && (
                    <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/20" />
                  )}
                  <span className="relative">{index + 1}</span>
                </button>
              )
            })}
          </div>
          {totalNavPages > 1 && (
            <div className="mt-2 flex items-center justify-between text-[10px] sm:text-xs text-ink-500 dark:text-ink-400">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNavPage((p) => Math.max(0, p - 1))}
                disabled={navPage === 0}
                className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs"
              >
                ← <span className="hidden sm:inline">Trước</span>
              </Button>
              <span className="text-[10px] sm:text-xs">
                Câu {navStartIndex + 1}–{navEndIndex} / {quiz.questions.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNavPage((p) => Math.min(totalNavPages - 1, p + 1))}
                disabled={navPage === totalNavPages - 1}
                className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs"
              >
                <span className="hidden sm:inline">Sau</span> →
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Question Area with Swipe Support */}
      <main className="relative mx-auto max-w-4xl" {...swipeHandlers}>
        <article className="relative rounded-xl sm:rounded-2xl border border-white/40 bg-white/65 p-4 sm:p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-white/30 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_22px_55px_rgba(2,6,23,0.6)] dark:ring-white/5">
          {/* Subtle overlay effect */}
          <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/45 via-white/10 to-transparent dark:from-white/10 dark:via-white/5" />
          
          {/* Swipe indicator for mobile */}
          {!progress.completed && (
            <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-gray-400 dark:text-gray-600 text-[10px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Vuốt để chuyển câu</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          )}
          
          <div className="relative mb-4 sm:mb-6 flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 rounded-full px-2 sm:px-3 py-1 w-fit backdrop-blur-sm font-sans">
                Câu hỏi {currentQuestionIndex + 1} / {quiz.questions.length}
              </p>
              <h2 className="mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 font-sans">
                {currentQuestion.title}
              </h2>
            </div>
            <span className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500/90 to-indigo-600/90 text-xs sm:text-sm font-bold text-white shadow-lg backdrop-blur-sm border border-white/20 dark:from-indigo-400/90 dark:to-indigo-500/90">
              {currentQuestion.points}
            </span>
          </div>

          {currentQuestion.content && (
            <p className="relative mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-200 bg-gray-50/60 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-gray-200/30 dark:bg-gray-800/40 dark:border-gray-700/30 font-sans">
              {currentQuestion.content}
            </p>
          )}

          <div className="relative">
            {renderOptions}
          </div>

          {progress.completed && currentQuestion.explanation && (
            <div className="relative mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-emerald-400/50 bg-emerald-50/60 p-4 sm:p-5 shadow-xl backdrop-blur-xl dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100/40 to-transparent pointer-events-none" />
              <div className="relative mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-lg sm:text-xl">💡</span>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-500/20 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 backdrop-blur-sm font-sans">
                  Giải thích
                </p>
              </div>
              <p className="relative text-xs sm:text-sm leading-relaxed text-emerald-800 dark:text-emerald-200 font-sans">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="relative mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 border-t border-gray-200/50 pt-4 sm:pt-6">
            <div className="flex gap-2 sm:gap-3 order-2 sm:order-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex-1 sm:flex-initial text-xs sm:text-sm border border-white/35 bg-white/45 backdrop-blur-md hover:bg-white/55 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/55"
              >
                ← Câu trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                className="flex-1 sm:flex-initial text-xs sm:text-sm border border-white/35 bg-white/45 backdrop-blur-md hover:bg-white/55 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/55"
              >
                Câu tiếp →
              </Button>
            </div>
            
            {/* Keyboard shortcuts hint - Desktop only */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 border border-white/25 bg-white/45 backdrop-blur-md rounded-lg px-3 py-2 dark:border-white/10 dark:bg-slate-900/35 order-1 sm:order-2">
              <span className="font-mono">1-9</span>
              <span>chọn</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <span className="font-mono">Enter</span>
              <span>tiếp theo</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <span className="font-mono">↑↓</span>
              <span>di chuyển</span>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-500 dark:text-rose-300">{error}</p>}
        </article>
      </main>
    </div>
  )
}
