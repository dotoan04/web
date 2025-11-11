"use client"

import { memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

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
  correctAnswers?: number
  totalQuestions?: number
  submittedAt?: string
}

type QuestionListPanelProps = {
  questions: QuizQuestion[]
  currentQuestionIndex: number
  onQuestionSelect: (index: number) => void
  progress: SubmissionState
  enableVirtualization?: boolean
}

const isQuestionCorrect = (question: QuizQuestion, answers: AnswerState) => {
  const selected = answers[question.id] ?? []

  if (question.type === 'MATCHING') {
    const correctPairs = new Set<string>()
    for (let i = 0; i < question.options.length; i += 2) {
      const leftId = question.options[i]?.id
      const rightId = question.options[i + 1]?.id
      if (leftId && rightId) {
        correctPairs.add(`${leftId}:${rightId}`)
      }
    }

    const selectedPairs = new Set(selected)
    return correctPairs.size === selectedPairs.size &&
           [...correctPairs].every(pair => selectedPairs.has(pair))
  } else if (question.type === 'FILL_IN_BLANK') {
    const correctAnswer = question.options[0]?.text || ''
    const userAnswer = Array.isArray(selected) ? selected[0] : selected
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
  } else {
    const correctIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort()
    const selectedIds = Array.isArray(selected) ? selected.sort() : [selected].sort()
    return correctIds.length === selectedIds.length &&
           correctIds.every((id, i) => id === selectedIds[i])
  }
}

export const QuestionListPanel = memo(({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  progress,
  enableVirtualization = false,
}: QuestionListPanelProps) => {
  const parentRef = useRef<HTMLDivElement>(null)

  // Virtualization for long lists
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(questions.length / 5), // 5 items per row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Height of each row
    overscan: 3,
    enabled: enableVirtualization,
  })

  if (enableVirtualization) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-3 pb-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            Danh sách câu hỏi
          </h3>
        </div>
        
        <div ref={parentRef} className="flex-1 overflow-auto pr-1">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * 5
              const endIndex = Math.min(startIndex + 5, questions.length)
              const rowQuestions = questions.slice(startIndex, endIndex)
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="grid grid-cols-5 gap-2 pb-2">
                    {rowQuestions.map((question, relativeIndex) => {
                      const absoluteIndex = startIndex + relativeIndex
                      const isSelected = currentQuestionIndex === absoluteIndex
                      const isCompleted = progress.completed
                      const isCorrect = isCompleted ? isQuestionCorrect(question, progress.answers) : null

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => onQuestionSelect(absoluteIndex)}
                          className={`
                            h-10 w-full flex items-center justify-center rounded text-xs font-medium
                            transition-all
                            ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : isCompleted && isCorrect === true
                                ? 'bg-emerald-500 text-white border border-emerald-600'
                                : isCompleted && isCorrect === false
                                ? 'bg-rose-500 text-white border border-rose-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }
                          `}
                        >
                          {(absoluteIndex + 1).toString().padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Non-virtualized version for shorter lists
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 pb-3 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">
          Danh sách câu hỏi
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const isSelected = currentQuestionIndex === index
            const isCompleted = progress.completed
            const isCorrect = isCompleted ? isQuestionCorrect(question, progress.answers) : null

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onQuestionSelect(index)}
                className={`
                  h-10 w-full flex items-center justify-center rounded text-xs font-medium
                  transition-all
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isCompleted && isCorrect === true
                      ? 'bg-emerald-500 text-white border border-emerald-600'
                      : isCompleted && isCorrect === false
                      ? 'bg-rose-500 text-white border border-rose-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }
                `}
              >
                {(index + 1).toString().padStart(2, '0')}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

QuestionListPanel.displayName = 'QuestionListPanel'

