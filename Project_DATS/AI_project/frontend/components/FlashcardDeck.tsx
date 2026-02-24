'use client'

import { useState } from 'react'

interface Flashcard {
  id: number
  term: string
  definition: string
  hint: string
  example: string
  category: string
}

interface FlashcardDeckData {
  deck_title: string
  subject: string
  card_count: number
  difficulty: string
  flashcards: Flashcard[]
  study_tips: string[]
}

interface Props {
  data: FlashcardDeckData
  onReset: () => void
}

export default function FlashcardDeck({ data, onReset }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const cards = data.flashcards || []
  const current = cards[currentIndex]

  const goNext = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, cards.length - 1)), 100)
  }

  const goPrev = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 100)
  }

  const markKnown = () => {
    setKnownCards((prev) => new Set([...prev, current.id]))
    goNext()
  }

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.deck_title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{data.subject}</span>
            <span className="text-gray-300">•</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[data.difficulty] || 'bg-gray-100 text-gray-600'}`}>
              {data.difficulty}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{data.card_count} cards</span>
          </div>
        </div>
        <button onClick={onReset} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          ← New Study Set
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{knownCards.size} known ✓</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flip Card */}
      {current && !showAll && (
        <div className="mb-6">
          <div
            className="relative w-full cursor-pointer"
            style={{ height: '280px', perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front - Term */}
              <div
                className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-indigo-100 flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {current.category && (
                  <span className="text-xs text-indigo-400 uppercase tracking-wider mb-4">{current.category}</span>
                )}
                <p className="text-3xl font-bold text-gray-900 text-center">{current.term}</p>
                <p className="text-sm text-gray-400 mt-6">Click to reveal definition</p>
              </div>

              {/* Back - Definition */}
              <div
                className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-xl text-white text-center font-medium mb-4">{current.definition}</p>
                {current.hint && (
                  <div className="bg-indigo-500 rounded-xl px-4 py-2 mt-2">
                    <p className="text-indigo-200 text-sm text-center">💡 {current.hint}</p>
                  </div>
                )}
                {current.example && (
                  <p className="text-indigo-300 text-sm text-center mt-3 italic">"{current.example}"</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, cards.length - 1)), 150) }}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 text-sm font-medium transition-all"
              >
                Still Learning
              </button>
              <button
                onClick={markKnown}
                className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 text-sm font-medium transition-all"
              >
                Got It ✓
              </button>
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === cards.length - 1}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* View All Toggle */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
        >
          {showAll ? 'Back to card view' : 'View all cards'}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
        >
          {showTips ? 'Hide tips' : 'Study tips'}
        </button>
      </div>

      {/* Study Tips */}
      {showTips && data.study_tips?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h4 className="font-medium text-amber-800 mb-2">📚 Study Tips</h4>
          <ul className="space-y-1">
            {data.study_tips.map((tip, i) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2">
                <span>•</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Cards List */}
      {showAll && (
        <div className="grid gap-3">
          {cards.map((card) => (
            <div key={card.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{card.term}</p>
                  <p className="text-gray-600 text-sm mt-1">{card.definition}</p>
                  {card.hint && <p className="text-indigo-500 text-xs mt-1">💡 {card.hint}</p>}
                </div>
                {knownCards.has(card.id) && (
                  <span className="text-green-500 text-lg ml-3">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
