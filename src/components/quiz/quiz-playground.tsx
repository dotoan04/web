"use client"

import { useCallback, useEffect, useMemo, useRef, useState, memo, lazy, Suspense } from 'react'
import { useSwipeable } from 'react-swipeable'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SmartImage } from '@/components/ui/smart-image'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { collectUserInfo, type UserInfo } from '@/lib/user-info'
import { QuestionListPanel } from './question-list-panel'
import { MobileQuizMenu } from './mobile-quiz-menu'

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
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [loadingGifUrl, setLoadingGifUrl] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const pendingSubmissionRef = useRef<{ answers: AnswerState; durationSeconds: number } | null>(null)
  const hasPromptedRef = useRef(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const normalized = useRef(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

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
      Object.entries(progress.answers).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.trim().length > 0
        return false
      }),
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
          }
        }
        
        const isMulti = isMultipleChoice(question)
        // Ensure current is treated as array for non-fill-in-blank questions
        const currentArray = Array.isArray(current) ? current : [current].filter(Boolean)
        let newSelected: string[]
        if (isMulti) {
          newSelected = currentArray.includes(optionId)
            ? currentArray.filter((id) => id !== optionId)
            : [...currentArray, optionId]
        } else {
          newSelected = currentArray.includes(optionId) ? [] : [optionId]
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
    // Scroll to the question
    if (questionRefs.current[newIndex]) {
      questionRefs.current[newIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [])

  // Track which question is currently visible in viewport
  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = questionRefs.current.findIndex((ref) => ref === entry.target)
            if (index !== -1 && index !== currentQuestionIndex) {
              setCurrentQuestionIndex(index)
            }
          }
        })
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5,
      }
    )

    questionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [quiz.questions.length])

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
    () => Object.values(progress.answers).filter((value) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return false
    }).length,
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
      Object.entries(progress.answers).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.trim().length > 0
        return false
      }),
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
    setFilter('all')
    setError(null)
    setShowNamePrompt(false)
    setSubmitting(false)
    setShowMobileMenu(false)
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
      if (question.type === 'FILL_IN_BLANK') return null // Fill-in-blank doesn't use this
      const selected = progress.answers[question.id] ?? []
      const selectedArray = Array.isArray(selected) ? selected : []
      if (selectedArray.includes(option.id)) {
        return option.isCorrect ? 'correct' : 'incorrect'
      } else if (option.isCorrect) {
        return 'missed'
      }
      return null
    },
    [progress.answers, progress.completed],
  )

  // No swipe handlers needed for scrollable list

  // For matching questions, we need to shuffle right items and allow pairing
  const [shuffledRightItemsMap, setShuffledRightItemsMap] = useState<Record<string, QuizOption[]>>({})
  const [selectedLeftMap, setSelectedLeftMap] = useState<Record<string, string | null>>({})
  
  useEffect(() => {
    // Initialize shuffled items for all matching questions
    const newShuffledMap: Record<string, QuizOption[]> = {}
    const newSelectedMap: Record<string, string | null> = {}
    
    quiz.questions.forEach((question) => {
      if (question.type === 'MATCHING') {
        const rightItems = question.options.filter((_, idx) => idx % 2 === 1)
        newShuffledMap[question.id] = [...rightItems].sort(() => Math.random() - 0.5)
        newSelectedMap[question.id] = null
      }
    })
    
    setShuffledRightItemsMap(newShuffledMap)
    setSelectedLeftMap(newSelectedMap)
  }, [quiz.questions])
  
  const handleMatchingPair = useCallback((questionId: string, leftOptionId: string, rightOptionId: string) => {
    if (progress.completed) return
    
    const pairString = `${leftOptionId}:${rightOptionId}`
    setProgress((prev) => {
      const current = prev.answers[questionId] ?? []
      // Ensure current is treated as array for matching questions
      const currentArray = Array.isArray(current) ? current : []

      // Check if this left item is already paired
      const existingPairIndex = currentArray.findIndex(pair => pair.startsWith(`${leftOptionId}:`))
      
      let newSelected: string[]
      if (existingPairIndex !== -1) {
        // If clicking the same pair, unpair it
        if (currentArray[existingPairIndex] === pairString) {
          newSelected = currentArray.filter((_, idx) => idx !== existingPairIndex)
        } else {
          // Replace the existing pair
          newSelected = currentArray.map((pair, idx) => idx === existingPairIndex ? pairString : pair)
        }
      } else {
        // Add new pair
        newSelected = [...currentArray, pairString]
      }
      
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: newSelected,
        },
      }
    })
    setSelectedLeftMap(prev => ({ ...prev, [questionId]: null }))
  }, [progress.completed, setProgress])
  
  // Helper function to render matching questions for each question in the list
  const renderMatchingQuestionForIndex = useCallback((question: QuizQuestion, index: number) => {
    const leftItems = question.options.filter((_, idx) => idx % 2 === 0)
    const shuffledRightItems = shuffledRightItemsMap[question.id] || []
    const selectedLeft = selectedLeftMap[question.id]
    const rawAnswer = progress.answers[question.id]
    const currentPairs = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer ? [rawAnswer] : []
    
    const pairMap = new Map<string, string>()
    currentPairs.forEach(pair => {
      const [left, right] = pair.split(':')
      if (left && right) pairMap.set(left, right)
    })
    
    const correctPairMap = new Map<string, string>()
    for (let i = 0; i < question.options.length; i += 2) {
      const leftId = question.options[i]?.id
      const rightId = question.options[i + 1]?.id
      if (leftId && rightId) {
        correctPairMap.set(leftId, rightId)
      }
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Bên trái</h4>
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
                    setSelectedLeftMap(prev => ({
                      ...prev,
                      [question.id]: isSelected ? null : leftOption.id
                    }))
                  }
                }}
                disabled={progress.completed}
                className={`w-full text-left rounded-lg border p-2 text-sm transition-colors ${
                  isCorrectPair
                    ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700'
                    : isIncorrectPair
                    ? 'border-rose-400/60 bg-rose-100/55 text-rose-700'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-100/55 text-indigo-700'
                    : isPaired
                    ? 'border-indigo-400/60 bg-indigo-50/55 text-indigo-600'
                    : 'border-gray-300 bg-white/80 hover:border-gray-400'
                }`}
              >
                {leftOption.text}
              </button>
            )
          })}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Bên phải</h4>
          {shuffledRightItems.map((rightOption) => {
            const isPaired = [...pairMap.values()].includes(rightOption.id)
            const leftId = [...pairMap.entries()].find(([, right]) => right === rightOption.id)?.[0]
            const isCorrectPair = progress.completed && leftId && correctPairMap.get(leftId) === rightOption.id
            const isIncorrectPair = progress.completed && isPaired && !isCorrectPair
            
            return (
              <button
                key={rightOption.id}
                type="button"
                onClick={() => {
                  if (!progress.completed && selectedLeft) {
                    handleMatchingPair(question.id, selectedLeft, rightOption.id)
                  }
                }}
                disabled={progress.completed || !selectedLeft}
                className={`w-full text-left rounded-lg border p-2 text-sm transition-colors ${
                  isCorrectPair
                    ? 'border-emerald-400/60 bg-emerald-100/55 text-emerald-700'
                    : isIncorrectPair
                    ? 'border-rose-400/60 bg-rose-100/55 text-rose-700'
                    : isPaired
                    ? 'border-indigo-400/60 bg-indigo-50/55 text-indigo-600'
                    : selectedLeft
                    ? 'border-gray-300 bg-white/80 hover:border-indigo-400 cursor-pointer'
                    : 'border-gray-300 bg-gray-50/80 opacity-60'
                }`}
              >
                {rightOption.text}
              </button>
            )
          })}
        </div>
      </div>
    )
  }, [shuffledRightItemsMap, selectedLeftMap, progress, handleMatchingPair])

  // Helper function to render fill-in-blank questions for each question in the list
  const renderFillInBlankQuestionForIndex = useCallback((question: QuizQuestion, index: number) => {
    const currentAnswer = Array.isArray(progress.answers[question.id])
      ? (progress.answers[question.id] as string[])[0] || ''
      : (progress.answers[question.id] as string) ?? ''
    const correctAnswer = question.options[0]?.text || ''
    const isCorrect = currentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    
    return (
      <div>
        <Input
          type="text"
          value={currentAnswer}
          onChange={(e) => {
            if (progress.completed) return
            setProgress((prev) => ({
              ...prev,
              answers: {
                ...prev.answers,
                [question.id]: e.target.value,
              },
            }))
          }}
          placeholder="Nhập câu trả lời của bạn..."
          disabled={progress.completed}
          className={`w-full px-4 py-3 text-base border-2 rounded-xl transition-colors ${
            progress.completed
              ? (isCorrect
                ? 'border-emerald-400/60 bg-emerald-50'
                : 'border-rose-400/60 bg-rose-50')
              : 'border-gray-300 bg-white'
          }`}
        />
        
        {progress.completed && (
          <div className={`mt-2 p-2 rounded-lg text-sm ${
            isCorrect
              ? 'bg-emerald-100/55 text-emerald-700'
              : 'bg-rose-100/55 text-rose-700'
          }`}>
            {isCorrect ? '✓ Đúng!' : `✗ Sai. Đáp án: ${correctAnswer}`}
          </div>
        )}
      </div>
    )
  }, [progress, setProgress])


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
              const rawAnswer = progress.answers[question.id]
              const selected = Array.isArray(rawAnswer) ? rawAnswer : []
              const correctIds = question.options
                .filter((o) => o.isCorrect)
                .map((o) => o.id)
                .sort()
              const selectedIds = selected.sort()
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

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`
  }

  const displayName = storedName || 'Thí sinh'

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'var(--font-body), sans-serif' }}>
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
      
      {renderFilterModal()}
      
      {/* Mobile Quiz Menu */}
      <MobileQuizMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        questions={quiz.questions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionSelect={goToQuestion}
        progress={progress}
        onSubmit={!progress.completed ? handleSubmit : undefined}
        onReset={progress.completed ? handleReset : undefined}
        enableVirtualization={quiz.questions.length > 50}
      />
      
      {/* Header - Matching the design */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Quay lại</span>
          </button>

          {/* Center: User Name */}
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-700">
              Thí sinh: {displayName}
            </span>
          </div>

          {/* Right: Timer, Icons, Submit Button */}
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {formatTimer(progress.remainingSeconds)}
              </span>
            </div>

            {/* Icons */}
            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Tìm kiếm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              type="button"
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Phóng to"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Danh sách"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Submit Button */}
            {!progress.completed ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : 'Nộp bài'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600">
                  {progress.score}/{progress.totalPoints}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Làm lại
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          {/* Left Side - Scrollable Questions List */}
          <div 
            ref={scrollContainerRef}
            className="space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto pr-2 scroll-smooth"
          >
            {quiz.questions.map((question, index) => {
              const isMulti = isMultipleChoice(question)
              const rawAnswer = progress.answers[question.id]
              
              return (
                <div
                  key={question.id}
                  ref={(el) => {
                    questionRefs.current[index] = el
                  }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  {/* Question Number */}
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Câu {index + 1}
                  </h2>

                  {/* Question Title */}
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {question.title}
                  </p>

                  {/* Question Content */}
                  {question.content && (
                    <div className="mb-4 text-sm text-gray-700 leading-relaxed">
                      {question.content}
                    </div>
                  )}

                  {/* Question Image */}
                  {question.imageUrl && (
                    <div className="relative w-full min-h-[200px] mb-4 rounded border border-gray-200 bg-gray-50 overflow-hidden">
                      <SmartImage
                        src={question.imageUrl}
                        alt={question.title}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        priority={index < 3}
                      />
                    </div>
                  )}

                  {/* Answer Options */}
                  <div>
                    {question.type === 'MATCHING' ? (
                      renderMatchingQuestionForIndex(question, index)
                    ) : question.type === 'FILL_IN_BLANK' ? (
                      renderFillInBlankQuestionForIndex(question, index)
                    ) : (
                      <>
                        {/* "Chọn một đáp án đúng" text */}
                        <div className="text-right mb-3">
                          <span className="text-xs text-gray-600">
                            Chọn một đáp án đúng
                          </span>
                        </div>
                        
                        {/* Options */}
                        <div className="space-y-2">
                          {question.options.map((option, optionIdx) => {
                            const state = getOptionState(question, option)
                            const answerArray = Array.isArray(rawAnswer) ? rawAnswer : []
                            const checked = answerArray.includes(option.id)
                            const optionLabel = String.fromCharCode(65 + optionIdx) // A, B, C, D
                            
                            return (
                              <label
                                key={option.id}
                                htmlFor={`${question.id}-${option.id}`}
                                className={`flex items-start gap-3 p-3 rounded border transition-all cursor-pointer ${
                                  state === 'correct'
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : state === 'incorrect'
                                    ? 'border-rose-400 bg-rose-50'
                                    : state === 'missed'
                                    ? 'border-sky-400 bg-sky-50'
                                    : checked
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  <input
                                    type={isMulti ? 'checkbox' : 'radio'}
                                    id={`${question.id}-${option.id}`}
                                    name={isMulti ? undefined : question.id}
                                    checked={checked}
                                    onChange={() => handleToggleOption(question.id, option.id)}
                                    disabled={progress.completed}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                                      {optionLabel}.
                                    </span>
                                    {option.text && (
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {option.text}
                                      </p>
                                    )}
                                  </div>
                                  {option.imageUrl && (
                                    <div className="relative w-full h-24 mt-2 rounded overflow-hidden border border-gray-200">
                                      <SmartImage
                                        src={option.imageUrl}
                                        alt={option.text || 'option image'}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                      />
                                    </div>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Explanation (if completed) */}
                  {progress.completed && question.explanation && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">💡</span>
                        <p className="text-xs font-semibold text-emerald-700">
                          Giải thích
                        </p>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-700">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {error && (
              <div className="rounded-lg border border-rose-400 bg-rose-50 p-3 text-rose-700">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Side - Question List Panel */}
          <div className="hidden lg:block sticky top-[73px] h-[calc(100vh-89px)]">
            <div className="h-full bg-[#F8FAFC] rounded-lg border border-gray-200 p-4">
              <QuestionListPanel
                questions={quiz.questions}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionSelect={goToQuestion}
                progress={progress}
                enableVirtualization={quiz.questions.length > 50}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
