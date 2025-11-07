"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo, lazy, Suspense } from 'react'
import { useSwipeable } from 'react-swipeable'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SmartImage } from '@/components/ui/smart-image'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { collectUserInfo, type UserInfo } from '@/lib/user-info'

// Lazy load the theme notification to improve initial load performance
const ThemeFeatureNotification = lazy(() => import('@/components/theme-feature-notification').then(mod => ({ default: mod.ThemeFeatureNotification })))

type QuizOption = {
  id: string
  text: string
  imageUrl?: string | null
  isCorrect: boolean
  order: number
}

type QuizQuestion = {
  id: string
  title: string
  content: string | null
  imageUrl?: string | null
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'FILL_IN_BLANK'
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

type AnswerState = Record<string, string[] | string>

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
  userInfo?: UserInfo
}
const createInitialState = (quiz: Quiz): SubmissionState => ({
  quizId: quiz.id,
  answers: Object.fromEntries(quiz.questions.map((question) => [question.id, question.type === 'FILL_IN_BLANK' ? '' : []])),
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
    
    let isCorrectAnswer = false
    
    if (question.type === 'MATCHING') {
      // For matching questions, answers are in format "leftId:rightId"
      // Correct pairs are: option[0] with option[1], option[2] with option[3], etc.
      const correctPairs = new Set<string>()
      for (let i = 0; i < question.options.length; i += 2) {
        const leftId = question.options[i]?.id
        const rightId = question.options[i + 1]?.id
        if (leftId && rightId) {
          correctPairs.add(`${leftId}:${rightId}`)
        }
      }
      
      const selectedPairs = new Set(selected)
      isCorrectAnswer =
        correctPairs.size === selectedPairs.size &&
        [...correctPairs].every(pair => selectedPairs.has(pair))
    } else if (question.type === 'FILL_IN_BLANK') {
      // For fill-in-the-blank questions, answers are strings
      const correctAnswer = question.options[0]?.text || ''
      const userAnswer = Array.isArray(selected) ? selected[0] : selected
      
      isCorrectAnswer = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    } else {
      // For regular questions
      const correctIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id)
        .sort()
      const selectedIds = Array.isArray(selected) ? selected.sort() : [selected].sort()
      isCorrectAnswer =
        correctIds.length === selectedIds.length &&
        correctIds.every((id, i) => id === selectedIds[i])
    }
    
    if (isCorrectAnswer) {
      score += question.points
    }
  })

  return { score, totalPoints }
}

// Memoized components for better performance
const TimerDisplay = memo(({ timePercentage, isCriticalTime, isLowTime, remainingSeconds, completed }: {
  timePercentage: number
  isCriticalTime: boolean
  isLowTime: boolean
  remainingSeconds: number
  completed: boolean
}) => (
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
        {formatDuration(remainingSeconds)}
      </span>
    </div>
    {isLowTime && !completed && (
      <span className="hidden sm:inline text-xs font-semibold text-rose-600 rounded-full px-2 py-1 bg-rose-50/80 backdrop-blur-sm border border-rose-200/50 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300 font-sans">
        ⚠️ Cẩn thận!
      </span>
    )}
  </div>
))

TimerDisplay.displayName = 'TimerDisplay'

const QuestionNavigator = memo(({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  progress,
  navPage,
  setNavPage,
  QUESTIONS_PER_NAV_PAGE
}: {
  questions: QuizQuestion[]
  currentQuestionIndex: number
  setCurrentQuestionIndex: (index: number) => void
  progress: SubmissionState
  navPage: number
  setNavPage: (page: number) => void
  QUESTIONS_PER_NAV_PAGE: number
}) => {
  const totalNavPages = Math.ceil(questions.length / QUESTIONS_PER_NAV_PAGE)
  const navStartIndex = navPage * QUESTIONS_PER_NAV_PAGE
  const navEndIndex = Math.min(navStartIndex + QUESTIONS_PER_NAV_PAGE, questions.length)
  const visibleQuestions = questions.slice(navStartIndex, navEndIndex)
  
  return (
    <div className="mt-2 border-t border-gray-200/50 pt-2">
      <div className="flex flex-wrap gap-1">
        {visibleQuestions.map((question, relativeIndex) => {
          const index = navStartIndex + relativeIndex
          const selected = currentQuestionIndex === index
          const answered = Array.isArray(progress.answers[question.id]) && progress.answers[question.id].length > 0
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentQuestionIndex(index)}
              className={`relative flex h-6 w-6 items-center justify-center rounded border text-[10px] font-medium transition-colors touch-manipulation ${
                selected
                  ? 'border-indigo-400/70 bg-indigo-500/85 text-white'
                  : answered
                  ? 'border-emerald-400/60 bg-emerald-500/80 text-white'
                  : 'border-white/30 bg-white/40 text-slate-600 hover:border-white/45 hover:bg-white/55 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-900/55'
              }`}
            >
              <span className="relative">{index + 1}</span>
            </button>
          )
        })}
      </div>
      {totalNavPages > 1 && (
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-500 dark:text-ink-400">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNavPage(Math.max(0, navPage - 1))}
            disabled={navPage === 0}
            className="h-5 px-1.5 text-[10px]"
          >
            ←
          </Button>
          <span className="text-[10px]">
            {navStartIndex + 1}–{navEndIndex} / {questions.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNavPage(Math.min(totalNavPages - 1, navPage + 1))}
            disabled={navPage === totalNavPages - 1}
            className="h-5 px-1.5 text-[10px]"
          >
            →
          </Button>
        </div>
      )}
    </div>
  )
})

QuestionNavigator.displayName = 'QuestionNavigator'

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
    if (!progress.completed || storedName || pendingSubmissionRef.current || hasPromptedRef.current) {
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
        
        // Handle fill-in-the-blank questions (single string answer)
        if (question.type === 'FILL_IN_BLANK') {
          return {
            ...prev,
            answers: {
              ...prev.answers,
              [questionId]: optionId, // For fill-in-the-blank, optionId is the text answer
            },
          },
        }
        }
        
        const isMulti = isMultipleChoice(question)
        let newSelected: string[]
        if (isMulti) {
          newSelected = Array.isArray(current)
            ? current.includes(optionId)
              ? current.filter((id) => id !== optionId)
              : [...current, optionId]
            : [optionId]
        } else {
          newSelected = Array.isArray(current)
            ? current.includes(optionId) ? [] : [optionId]
            : [optionId]
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
    async (payload: { answers: AnswerState; durationSeconds: number; participant: string; userInfo?: UserInfo }) => {
      const response = await fetch(`/api/quizzes/${quiz.slug}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: payload.answers,
          durationSeconds: payload.durationSeconds,
          participant: payload.participant,
          userInfo: payload.userInfo,
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
    if (progress.completed || submitting || hasPromptedRef.current) return

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
      hasPromptedRef.current = true
      return
    }

    setSubmitting(true)
    try {
      const userInfo = collectUserInfo()
      await submitQuiz({
        answers: answered,
        durationSeconds,
        participant: storedName,
        userInfo,
      })
      setSubmitting(false)
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
    setSubmitting(false)
    hasPromptedRef.current = false
    pendingSubmissionRef.current = null
  }, [clearProgress, quiz, setProgress])

  const handleSaveName = useCallback(async () => {
    if (submitting) return
    
    const trimmed = nameInput.trim()
    const finalName = trimmed.length > 0 ? trimmed : 'Anonymous'
    setStoredName(finalName)
    setShowNamePrompt(false)
    
    if (pendingSubmissionRef.current) {
      setSubmitting(true)
      try {
        const userInfo = collectUserInfo()
        await submitQuiz({ ...pendingSubmissionRef.current, participant: finalName, userInfo })
        setSubmitting(false)
      } catch (error) {
        console.error(error)
        setError((error as Error).message)
        setSubmitting(false)
        hasPromptedRef.current = false
      }
      pendingSubmissionRef.current = null
    }
  }, [nameInput, setStoredName, submitQuiz, submitting])

  const handleSkipName = useCallback(async () => {
    if (submitting) return
    
    setShowNamePrompt(false)
    
    if (pendingSubmissionRef.current) {
      setSubmitting(true)
      try {
        const userInfo = collectUserInfo()
        await submitQuiz({ ...pendingSubmissionRef.current, participant: 'Anonymous', userInfo })
        setSubmitting(false)
      } catch (error) {
        console.error(error)
        setError((error as Error).message)
        setSubmitting(false)
        hasPromptedRef.current = false
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

  // For matching questions, we need to shuffle right items and allow pairing
  const [shuffledRightItems, setShuffledRightItems] = useState<QuizOption[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  
  useEffect(() => {
    if (currentQuestion.type === 'MATCHING') {
      // Extract and shuffle right items (odd indices)
      const rightItems = currentQuestion.options.filter((_, idx) => idx % 2 === 1)
      const shuffled = [...rightItems].sort(() => Math.random() - 0.5)
      setShuffledRightItems(shuffled)
      setSelectedLeft(null)
    }
  }, [currentQuestion])
  
  const handleMatchingPair = useCallback((leftOptionId: string, rightOptionId: string) => {
    if (progress.completed) return
    
    const pairString = `${leftOptionId}:${rightOptionId}`
    setProgress((prev) => {
      const current = prev.answers[currentQuestion.id] ?? []
      
      // Check if this left item is already paired
      const existingPairIndex = current.findIndex(pair => pair.startsWith(`${leftOptionId}:`))
      
      let newSelected: string[]
      if (existingPairIndex !== -1) {
        // If clicking the same pair, unpair it
        if (current[existingPairIndex] === pairString) {
          newSelected = current.filter((_, idx) => idx !== existingPairIndex)
        } else {
          // Replace the existing pair
          newSelected = current.map((pair, idx) => idx === existingPairIndex ? pairString : pair)
        }
      } else {
        // Add new pair
        newSelected = [...current, pairString]
      }
      
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: newSelected,
        },
      }
    })
    setSelectedLeft(null)
  }, [progress.completed, currentQuestion.id, setProgress])
  
  const renderMatchingQuestion = useMemo(() => {
    if (currentQuestion.type !== 'MATCHING') return null
    
    const leftItems = currentQuestion.options.filter((_, idx) => idx % 2 === 0)
    const currentPairs = progress.answers[currentQuestion.id] ?? []
    
    // Create map of left to right pairs for easier lookup
    const pairMap = new Map<string, string>()
    currentPairs.forEach(pair => {
      const [left, right] = pair.split(':')
      if (left && right) pairMap.set(left, right)
    })
    
    // Get correct pairs for result display
    const correctPairMap = new Map<string, string>()
    for (let i = 0; i < currentQuestion.options.length; i += 2) {
      const leftId = currentQuestion.options[i]?.id
      const rightId = currentQuestion.options[i + 1]?.id
      if (leftId && rightId) {
        correctPairMap.set(leftId, rightId)
      }
    }
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm">
          💡 Nhấp vào mục bên trái, sau đó nhấp vào mục bên phải để ghép cặp. Bên phải đã được đảo thứ tự.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left side */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bên trái</h4>
            {leftItems.map((leftOption) => {
              const pairedRightId = pairMap.get(leftOption.id)
              const isPaired = Boolean(pairedRightId)
              const isSelected = selectedLeft === leftOption.id
              const isCorrectPair = progress.completed && correctPairMap.get(leftOption.id) === pairedRightId
              const isIncorrectPair = progress.completed && isPaired && !isCorrectPair
              
              return (
                <button
                  key={leftOption.id}
                  type="button"
                  onClick={() => {
                    if (!progress.completed) {
                      setSelectedLeft(isSelected ? null : leftOption.id)
                    }
                  }}
                  disabled={progress.completed}
                  className={`w-full text-left rounded-xl border p-3 backdrop-blur-xl transition-colors ${
                    isCorrectPair
                      ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15'
                      : isIncorrectPair
                      ? 'border-rose-400/60 bg-rose-100/55 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-100/55 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15'
                      : isPaired
                      ? 'border-indigo-400/60 bg-indigo-50/55 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/10'
                      : 'border-white/25 bg-white/45 text-slate-700 hover:border-white/40 hover:bg-white/55 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium">{leftOption.text}</span>
                    {isPaired && !progress.completed && <span className="text-xs">✓</span>}
                  </div>
                  {isPaired && pairedRightId && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      → {shuffledRightItems.find(r => r.id === pairedRightId)?.text}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Right side */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bên phải (đã đảo)</h4>
            {shuffledRightItems.map((rightOption) => {
              const isPaired = [...pairMap.values()].includes(rightOption.id)
              const leftId = [...pairMap.entries()].find(([, right]) => right === rightOption.id)?.[0]
              const isCorrectPair = progress.completed && leftId && correctPairMap.get(leftId) === rightOption.id
              const isIncorrectPair = progress.completed && isPaired && !isCorrectPair
              const shouldShowAsCorrect = progress.completed && !isPaired && [...correctPairMap.values()].includes(rightOption.id)
              
              return (
                <button
                  key={rightOption.id}
                  type="button"
                  onClick={() => {
                    if (!progress.completed && selectedLeft) {
                      handleMatchingPair(selectedLeft, rightOption.id)
                    }
                  }}
                  disabled={progress.completed || !selectedLeft}
                  className={`w-full text-left rounded-xl border p-3 backdrop-blur-xl transition-colors ${
                    isCorrectPair
                      ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15'
                      : isIncorrectPair
                      ? 'border-rose-400/60 bg-rose-100/55 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15'
                      : shouldShowAsCorrect
                      ? 'border-sky-400/60 bg-sky-100/55 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15'
                      : isPaired
                      ? 'border-indigo-400/60 bg-indigo-50/55 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/10'
                      : selectedLeft
                      ? 'border-white/40 bg-white/55 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer dark:border-slate-600/60 dark:bg-slate-800/40 dark:text-slate-200'
                      : 'border-white/25 bg-white/45 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 opacity-70'
                  }`}
                >
                  <span className="text-sm font-medium">{rightOption.text}</span>
                  {progress.completed && shouldShowAsCorrect && (
                    <div className="mt-1 text-xs text-sky-600 dark:text-sky-300">
                      ✓ Đúng (chưa chọn)
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }, [currentQuestion, progress.answers, progress.completed, selectedLeft, shuffledRightItems, handleMatchingPair])

  const renderFillInBlankQuestion = useMemo(() => {
    if (currentQuestion.type !== 'FILL_IN_BLANK') return null
    
    const currentAnswer = progress.answers[currentQuestion.id] ?? ''
    const correctAnswer = currentQuestion.options[0]?.text || ''
    const isCorrect = currentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 rounded-lg p-3 backdrop-blur-sm">
          💡 Nhập câu trả lời của bạn vào ô trống.
        </p>
        
        <div className="relative">
          <Input
            type="text"
            value={currentAnswer}
            onChange={(e) => {
              if (progress.completed) return
              setProgress((prev) => ({
                ...prev,
                answers: {
                  ...prev.answers,
                  [currentQuestion.id]: e.target.value,
                },
              }))
            }}
            placeholder="Nhập câu trả lời của bạn..."
            disabled={progress.completed}
            className={`w-full px-4 py-3 text-lg border-2 rounded-xl transition-colors ${
              progress.completed
                ? isCorrect
                  ? 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15'
                  : 'border-rose-400/60 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15'
                  : 'border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-300'
                : 'border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0'
            }`}
          />
          
          {progress.completed && (
            <div className={`mt-3 p-3 rounded-lg border-2 ${
              isCorrect
                ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15'
                : 'border-rose-400/60 bg-rose-100/55 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {isCorrect ? '✓ Đúng!' : '✗ Sai'}
                </span>
                {!isCorrect && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-300">
                    Đáp án đúng: {correctAnswer}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }, [currentQuestion, progress.answers, progress.completed])

  const renderOptions = useMemo(() => {
    if (currentQuestion.type === 'MATCHING') {
      return renderMatchingQuestion
    }
    
    if (currentQuestion.type === 'FILL_IN_BLANK') {
      return renderFillInBlankQuestion
    }
    
    const hasImages = currentQuestion.options.some((opt) => opt.imageUrl)
    const gridCols = hasImages ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
    
    return (
      <div className="space-y-3">
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
              className={`group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all touch-manipulation cursor-pointer hover:shadow-md focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-400/50 dark:focus-within:ring-indigo-500/40 ${
                checked ? 'border-indigo-400 bg-indigo-50/80 dark:border-indigo-500 dark:bg-indigo-500/20' : 'border-gray-200 bg-white/80 dark:border-gray-700 dark:bg-slate-800/80'
              } ${toneClasses}`}
            >
              {/* Radio/Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  id={option.id}
                  name={isMulti ? undefined : currentQuestion.id}
                  checked={checked}
                  onChange={() => handleToggleOption(currentQuestion.id, option.id)}
                  disabled={progress.completed}
                  className="h-5 w-5 rounded border-2 border-gray-300 bg-white text-indigo-600 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0 dark:border-gray-600 dark:bg-slate-700"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Option Number Badge */}
                <div className="flex items-center gap-3 mb-2">
                  <span className={`flex items-center justify-center rounded-lg text-xs font-bold h-6 w-6 ${badgeTone}`}>
                    {shortcutKey}
                  </span>
                  {state !== null && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeTone}`}>
                      {state === 'correct' ? '✓ Đúng'
                       : state === 'incorrect' ? '✗ Sai'
                       : '✓ Đúng (chưa chọn)'}
                    </span>
                  )}
                </div>

                {/* Option Text */}
                {option.text && (
                  <p className={`text-base font-medium leading-relaxed mb-3 ${
                    state === 'correct' ? 'text-emerald-700 dark:text-emerald-300'
                    : state === 'incorrect' ? 'text-rose-700 dark:text-rose-300'
                    : state === 'missed' ? 'text-sky-700 dark:text-sky-300'
                    : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {option.text}
                  </p>
                )}

                {/* Option Image */}
                {option.imageUrl && (
                  <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 aspect-[4/3] min-h-[180px]">
                    <SmartImage
                      src={option.imageUrl}
                      alt={option.text || 'option image'}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </div>
    )
  }, [currentQuestion, progress.answers, progress.completed, getOptionState, handleToggleOption, renderMatchingQuestion, renderFillInBlankQuestion])

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
      <Suspense fallback={null}>
        <ThemeFeatureNotification />
      </Suspense>
      
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
      
      {/* Header - Compact */}
      <header className="sticky top-0 z-10 mb-4 rounded-xl border border-white/40 bg-white/70 p-4 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TimerDisplay
              timePercentage={timePercentage}
              isCriticalTime={isCriticalTime}
              isLowTime={isLowTime}
              remainingSeconds={progress.remainingSeconds}
              completed={progress.completed ?? false}
            />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-sans truncate">{quiz.title}</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">
                {quiz.questions.length} câu · {answeredCount} đã trả lời
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {progress.completed && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowFilterModal(true)}
                className="text-[10px] px-2 h-7"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </Button>
            )}
            {!progress.completed ? (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting} className="text-xs h-7 px-3">
                {submitting ? '...' : 'Nộp'}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {progress.score}/{progress.totalPoints}
                </span>
                <Button type="button" size="sm" variant="subtle" onClick={handleReset} className="text-xs h-7 px-2">
                  Làm lại
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Question Navigator - Compact */}
        <QuestionNavigator
          questions={quiz.questions}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          progress={progress}
          navPage={navPage}
          setNavPage={setNavPage}
          QUESTIONS_PER_NAV_PAGE={QUESTIONS_PER_NAV_PAGE}
        />
      </header>

      {/* Split View Layout - Optimized for Focus */}
      <main className="relative mx-auto w-full max-w-[98%] lg:max-w-[1600px] px-2 sm:px-4" {...swipeHandlers}>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)]">
          {/* Left Side - Question (Sticky) */}
          <div className="lg:sticky lg:top-[140px] lg:h-[calc(100vh-200px)] flex flex-col">
            <article className="relative flex-1 flex flex-col rounded-xl border border-white/40 bg-white/70 p-4 sm:p-6 lg:p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 overflow-y-auto">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/20 rounded-full px-3 py-1.5">
                    Câu {currentQuestionIndex + 1}/{quiz.questions.length}
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/20 rounded-full px-3 py-1.5">
                    {currentQuestion.points}đ
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="h-7 px-2 text-xs"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => goToQuestion(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === quiz.questions.length - 1}
                    className="h-7 px-2 text-xs"
                  >
                    →
                  </Button>
                </div>
              </div>

              {/* Question Title */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 mb-4 font-sans">
                {currentQuestion.title}
              </h2>

              {/* Question Content */}
              {currentQuestion.content && (
                <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                  {currentQuestion.content}
                </p>
              )}

              {/* Question Image */}
              {currentQuestion.imageUrl && (
                <div className="relative flex-1 min-h-[200px] mb-4 rounded-lg border-2 border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">
                  <SmartImage
                    src={currentQuestion.imageUrl}
                    alt={currentQuestion.title}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}

              {/* Explanation (if completed) */}
              {progress.completed && currentQuestion.explanation && (
                <div className="mt-auto pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Giải thích
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </article>
          </div>

          {/* Right Side - Options (Scrollable) */}
          <div className="flex flex-col lg:h-[calc(100vh-180px)]">
            <div className="flex-1 rounded-xl border border-white/40 bg-white/70 p-4 sm:p-6 lg:p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 overflow-y-auto">
              <div className="mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Chọn đáp án
                </h3>
              </div>
              
              <div className="space-y-3">
                {renderOptions}
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">1-9</span>
                  <span>chọn đáp án</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Enter</span>
                  <span>câu tiếp</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">↑↓</span>
                  <span>di chuyển</span>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-rose-500 dark:text-rose-300">{error}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
