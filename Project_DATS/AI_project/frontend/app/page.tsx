'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import FlashcardDeck from '../components/FlashcardDeck'
import PracticeQuiz from '../components/PracticeQuiz'
import ExamViewer from '../components/ExamViewer'

type StudyMode = 'flashcards' | 'practice' | 'exam' | 'clarification' | null

interface StudyData {
  mode: StudyMode
  [key: string]: unknown
}

export default function Home() {
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [studyData, setStudyData] = useState<StudyData | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const userIdRef = useRef(`user_${Math.random().toString(36).substr(2, 9)}`)

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${wsUrl}/ws/${userIdRef.current}`)

    ws.onopen = () => {
      setIsConnected(true)
      setStatusMessage('')
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'status') {
        setStatusMessage(msg.message)
      } else if (msg.type === 'study_content') {
        setStudyData(msg.data)
        setIsLoading(false)
        setStatusMessage('')
      } else if (msg.type === 'error') {
        setStatusMessage(`Error: ${msg.message}`)
        setIsLoading(false)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setTimeout(connect, 3000)
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  const handleSubmit = () => {
    if (!input.trim() || !wsRef.current || isLoading) return

    setIsLoading(true)
    setStudyData(null)
    wsRef.current.send(JSON.stringify({ message: input }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  const handleReset = () => {
    setStudyData(null)
    setInput('')
    setStatusMessage('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📚</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StudyAI</h1>
              <p className="text-xs text-gray-500">AI-Powered Study Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-500">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Hero / Input Section */}
        {!studyData && (
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Study smarter with AI 🎓
            </h2>
            <p className="text-lg text-gray-500 mb-10">
              Create flashcards, practice questions, or a full exam — just describe what you need.
            </p>

            {/* Mode Chips */}
            <div className="flex justify-center gap-3 flex-wrap mb-8">
              {[
                { label: '🃏 Flashcards', example: 'Create flashcards for: Mitosis, Meiosis, DNA replication, Cell cycle' },
                { label: '📝 Practice Questions', example: 'Give me practice questions on the American Civil War' },
                { label: '📋 Full Exam', example: 'Build a 100-point exam on Algebra: linear equations, quadratics, systems' },
              ].map(({ label, example }) => (
                <button
                  key={label}
                  onClick={() => setInput(example)}
                  className="px-4 py-2 bg-white border border-indigo-200 rounded-full text-sm text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-sm"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to study?
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-4 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[120px]"
                placeholder={`Try:\n• "Make flashcards for: Photosynthesis, Cellular respiration, Osmosis"\n• "Quiz me on World War II causes and effects"\n• "Build a 50-point biology midterm on cells and genetics"`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">Press Cmd+Enter to generate</span>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading || !isConnected}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Generating...' : 'Generate ✨'}
                </button>
              </div>
            </div>

            {/* Status */}
            {statusMessage && (
              <div className="mt-6 flex items-center justify-center gap-3 text-indigo-600">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{statusMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Clarification */}
        {studyData?.mode === 'clarification' && (
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 text-center">
            <p className="text-gray-700 text-lg mb-6">{(studyData as { message: string }).message}</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {((studyData as { options: string[] }).options || []).map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => {
                    setInput(opt)
                    setStudyData(null)
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Study Content */}
        {studyData?.mode === 'flashcards' && (
          <FlashcardDeck data={studyData as never} onReset={handleReset} />
        )}
        {studyData?.mode === 'practice' && (
          <PracticeQuiz data={studyData as never} onReset={handleReset} />
        )}
        {studyData?.mode === 'exam' && (
          <ExamViewer data={studyData as never} onReset={handleReset} />
        )}

      </div>
    </main>
  )
}
