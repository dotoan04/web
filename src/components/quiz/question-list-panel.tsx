"use client"

import { memo, useMemo } from 'react'
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
  score?: number
  totalPoints?: number
  submittedAt?: string
}

type QuestionListPanelProps = {
  questions: QuizQuestion[]
  currentQuestionIndex: number
  onQuestionSelect: (index: number) => void
  progress: SubmissionState
  enableVirtualization?: boolean
}

const QuestionButton = memo(({
  question,
  index,
  isSelected,
  isAnswered,
  isCorrect,
  onClick,
}: {
  question: QuizQuestion
  index: number
  isSelected: boolean
  isAnswered: boolean
  isCorrect: boolean | null
  onClick: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex h-10 w-full items-center justify-center rounded text-xs font-semibold
        transition-all touch-manipulation
        ${
          isSelected
            ? 'border-2 border-indigo-500 bg-indigo-500 text-white shadow-sm scale-105'
            : isCorrect === true
            ? 'border border-emerald-400 bg-emerald-500 text-white'
            : isCorrect === false
            ? 'border border-rose-400 bg-rose-500 text-white'
            : isAnswered
            ? 'border border-emerald-400 bg-emerald-500 text-white'
            : 'border border-gray-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/40'
        }
      `}
    >
      <span className="relative">{index + 1}</span>
    </button>
  )
})

QuestionButton.displayName = 'QuestionButton'

export const QuestionListPanel = memo(({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  progress,
  enableVirtualization = false,
}: QuestionListPanelProps) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  // Determine if each question is answered and correct
  const questionStates = useMemo(() => {
    return questions.map((question) => {
      const answerValue = progress.answers[question.id]
      const isAnswered = Array.isArray(answerValue) 
        ? answerValue.length > 0 
        : (typeof answerValue === 'string' && answerValue.trim().length > 0)
      
      let isCorrect: boolean | null = null
      if (progress.completed) {
        const selected = answerValue ?? []
        
        if (question.type === 'MATCHING') {
          const correctPairs = new Set<string>()
          for (let i = 0; i < question.options.length; i += 2) {
            const leftId = question.options[i]?.id
            const rightId = question.options[i + 1]?.id
            if (leftId && rightId) {
              correctPairs.add(`${leftId}:${rightId}`)
            }
          }
          const selectedPairs = new Set(Array.isArray(selected) ? selected : [])
          isCorrect = correctPairs.size === selectedPairs.size &&
            [...correctPairs].every(pair => selectedPairs.has(pair))
        } else if (question.type === 'FILL_IN_BLANK') {
          const correctAnswer = question.options[0]?.text || ''
          const userAnswer = Array.isArray(selected) ? selected[0] : selected
          const userAnswerStr = typeof userAnswer === 'string' ? userAnswer : ''
          isCorrect = userAnswerStr.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        } else {
          const correctIds = question.options
            .filter((option) => option.isCorrect)
            .map((option) => option.id)
            .sort()
          const selectedIds = Array.isArray(selected) ? selected.sort() : [selected].sort()
          isCorrect = correctIds.length === selectedIds.length &&
            correctIds.every((id, i) => id === selectedIds[i])
        }
      }
      
      return { isAnswered, isCorrect }
    })
  }, [questions, progress])

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
        <div className="mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Danh sách câu hỏi
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {questions.length} câu
          </p>
        </div>
        
        <div ref={parentRef} className="flex-1 overflow-auto">
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
                      const { isAnswered, isCorrect } = questionStates[absoluteIndex]
                      
                      return (
                        <QuestionButton
                          key={question.id}
                          question={question}
                          index={absoluteIndex}
                          isSelected={currentQuestionIndex === absoluteIndex}
                          isAnswered={isAnswered}
                          isCorrect={isCorrect}
                          onClick={() => onQuestionSelect(absoluteIndex)}
                        />
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
      <div className="mb-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Danh sách câu hỏi
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
          {questions.length} câu
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((question, index) => {
            const { isAnswered, isCorrect } = questionStates[index]
            
            return (
              <QuestionButton
                key={question.id}
                question={question}
                index={index}
                isSelected={currentQuestionIndex === index}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                onClick={() => onQuestionSelect(index)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
})

QuestionListPanel.displayName = 'QuestionListPanel'

