'use client'

import { useState } from 'react'

interface Question {
  id: number
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  bloom_level: string
  question: string
  options?: string[]
  answer: string
  explanation: string
  key_points?: string[]
}

interface PracticeData {
  topic: string
  question_count: number
  difficulty: string
  bloom_levels_covered: string[]
  questions: Question[]
  study_recommendations: string[]
}

interface Props {
  data: PracticeData
  onReset: () => void
}

export default function PracticeQuiz({ data, onReset }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [shortAnswerText, setShortAnswerText] = useState<Record<number, string>>({})

  const questions = data.questions || []
  const score = submitted
    ? questions.filter(q =>
        q.type !== 'short_answer' &&
        answers[q.id]?.toLowerCase() === q.answer?.toLowerCase()
      ).length
    : 0

  const totalGradable = questions.filter(q => q.type !== 'short_answer').length
  const percentage = totalGradable > 0 ? Math.round((score / totalGradable) * 100) : 0

  const gradeColor =
    percentage >= 90 ? 'text-green-600' :
    percentage >= 70 ? 'text-yellow-600' :
    'text-red-500'

  const handleAnswer = (qId: number, answer: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  const bloomColors: Record<string, string> = {
    remember: 'bg-blue-50 text-blue-600',
    understand: 'bg-purple-50 text-purple-600',
    apply: 'bg-green-50 text-green-700',
    analyze: 'bg-orange-50 text-orange-600',
    evaluate: 'bg-red-50 text-red-600',
    create: 'bg-pink-50 text-pink-600',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.topic}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-gray-500">{data.question_count} questions</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500 capitalize">{data.difficulty}</span>
            {data.bloom_levels_covered?.map(level => (
              <span key={level} className={`text-xs px-2 py-0.5 rounded-full ${bloomColors[level] || 'bg-gray-100 text-gray-600'}`}>
                {level}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onReset} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          ← New Study Set
        </button>
      </div>

      {/* Score Banner (after submit) */}
      {submitted && (
        <div className={`rounded-2xl p-6 mb-6 text-center ${percentage >= 70 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-4xl font-bold mb-1 ${gradeColor}">
            <span className={gradeColor}>{score}/{totalGradable}</span>
          </p>
          <p className={`text-2xl font-semibold ${gradeColor}`}>{percentage}%</p>
          <p className="text-gray-600 text-sm mt-1">
            {percentage >= 90 ? '🎉 Excellent work!' : percentage >= 70 ? '👍 Good job! Review the missed ones.' : '📖 Keep studying and try again!'}
          </p>
          {questions.some(q => q.type === 'short_answer') && (
            <p className="text-xs text-gray-400 mt-2">Short answer questions are not auto-graded — review them below.</p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id]
          const isCorrect = submitted && q.type !== 'short_answer' && userAnswer?.toLowerCase() === q.answer?.toLowerCase()
          const isWrong = submitted && q.type !== 'short_answer' && userAnswer && !isCorrect

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
                submitted && isCorrect ? 'border-green-300' :
                submitted && isWrong ? 'border-red-300' :
                'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-400">Q{idx + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${bloomColors[q.bloom_level] || 'bg-gray-100 text-gray-500'}`}>
                    {q.bloom_level}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{q.type.replace('_', ' ')}</span>
                </div>
                {submitted && q.type !== 'short_answer' && (
                  <span className={`text-lg ${isCorrect ? '✅' : '❌'}`}>
                    {isCorrect ? '✅' : '❌'}
                  </span>
                )}
              </div>

              <p className="text-gray-900 font-medium mb-4">{q.question}</p>

              {/* Multiple Choice */}
              {q.type === 'multiple_choice' && q.options?.map((opt) => {
                const optLetter = opt.charAt(0)
                const isSelected = userAnswer === optLetter
                const isCorrectOpt = submitted && q.answer === optLetter
                const isWrongOpt = submitted && isSelected && !isCorrectOpt

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, optLetter)}
                    className={`w-full text-left px-4 py-3 rounded-xl mb-2 text-sm border transition-all ${
                      isCorrectOpt ? 'bg-green-50 border-green-400 text-green-800 font-medium' :
                      isWrongOpt ? 'bg-red-50 border-red-400 text-red-800' :
                      isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-800' :
                      'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}

              {/* True / False */}
              {q.type === 'true_false' && ['True', 'False'].map((opt) => {
                const isSelected = userAnswer === opt
                const isCorrectOpt = submitted && q.answer === opt
                const isWrongOpt = submitted && isSelected && !isCorrectOpt

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`mr-3 px-6 py-2.5 rounded-xl text-sm border font-medium transition-all ${
                      isCorrectOpt ? 'bg-green-50 border-green-400 text-green-800' :
                      isWrongOpt ? 'bg-red-50 border-red-400 text-red-800' :
                      isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-800' :
                      'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}

              {/* Short Answer */}
              {q.type === 'short_answer' && (
                <div>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[80px]"
                    placeholder="Write your answer here..."
                    value={shortAnswerText[q.id] || ''}
                    onChange={(e) => setShortAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                    disabled={submitted}
                  />
                  {submitted && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Model Answer:</p>
                      <p className="text-sm text-blue-800">{q.answer}</p>
                      {q.key_points && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-blue-700">Key points to include:</p>
                          <ul className="mt-1 space-y-0.5">
                            {q.key_points.map((pt, i) => (
                              <li key={i} className="text-xs text-blue-700 flex gap-1"><span>•</span>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {submitted && q.explanation && q.type !== 'short_answer' && (
                <div className={`mt-3 rounded-xl p-3 text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                  <span className="font-semibold">Explanation: </span>{q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit / Reset */}
      <div className="mt-6 flex gap-3 justify-center">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length === 0}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Submit Answers
          </button>
        ) : (
          <button
            onClick={onReset}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
          >
            Generate New Practice Set
          </button>
        )}
      </div>

      {/* Study Recommendations */}
      {submitted && data.study_recommendations?.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-medium text-amber-800 mb-2">📖 Study Recommendations</h4>
          <ul className="space-y-1">
            {data.study_recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2"><span>•</span><span>{rec}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
