"use client"

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QuestionListPanel } from './question-list-panel'
import { Button } from '@/components/ui/button'

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

type MobileQuizMenuProps = {
  isOpen: boolean
  onClose: () => void
  questions: QuizQuestion[]
  currentQuestionIndex: number
  onQuestionSelect: (index: number) => void
  progress: SubmissionState
  onSubmit?: () => void
  onReset?: () => void
  enableVirtualization?: boolean
}

export const MobileQuizMenu = memo(({
  isOpen,
  onClose,
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  progress,
  onSubmit,
  onReset,
  enableVirtualization = false,
}: MobileQuizMenuProps) => {
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleQuestionSelect = (index: number) => {
    onQuestionSelect(index)
    onClose()
  }

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl
                   dark:bg-slate-900/95 transform transition-transform duration-300 ease-out
                   flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Menu
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700
                     dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2 border-b border-gray-200/50 dark:border-gray-700/50">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Font size decrease - could implement this feature later
              console.log('Decrease font size')
            }}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Giảm cỡ chữ
          </Button>
          
          <Button
            type="button"
            variant="subtle"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Font size increase - could implement this feature later
              console.log('Increase font size')
            }}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tăng cỡ chữ
          </Button>
          
          {!progress.completed && onSubmit && (
            <Button
              type="button"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onSubmit()
                onClose()
              }}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nộp bài
            </Button>
          )}
          
          {progress.completed && onReset && (
            <Button
              type="button"
              size="sm"
              variant="subtle"
              className="w-full justify-start"
              onClick={() => {
                onReset()
                onClose()
              }}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm lại
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-rose-600 dark:text-rose-400"
            onClick={onClose}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Thoát
          </Button>
        </div>

        {/* Question List */}
        <div className="flex-1 p-4 overflow-hidden">
          <QuestionListPanel
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionSelect={handleQuestionSelect}
            progress={progress}
            enableVirtualization={enableVirtualization}
          />
        </div>
      </div>
    </>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
})

MobileQuizMenu.displayName = 'MobileQuizMenu'

