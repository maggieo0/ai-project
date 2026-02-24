'use client'

import { useState } from 'react'

interface ExamQuestion {
  id: number
  type: string
  question: string
  options?: string[]
  points: number
  grading_rubric?: string
}

interface ExamSection {
  section_number: number
  title: string
  instructions: string
  point_value_per_question: number
  questions: ExamQuestion[]
}

interface ExamData {
  exam_title: string
  subject: string
  total_points: number
  time_limit_minutes: number
  difficulty: string
  instructions: string
  sections: ExamSection[]
  answer_key: Record<string, string>
  point_distribution: Record<string, number>
  grading_scale: Record<string, string>
}

interface Props {
  data: ExamData
  onReset: () => void
}

export default function ExamViewer({ data, onReset }: Props) {
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'exam' | 'key'>('exam')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.exam_title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{data.subject}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{data.total_points} points</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{data.time_limit_minutes} min</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-all font-medium"
          >
            🖨️ Print
          </button>
          <button onClick={onReset} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2">
            ← New Set
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('exam')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'exam' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📋 Exam
        </button>
        <button
          onClick={() => setActiveTab('key')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'key' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🔑 Answer Key
        </button>
      </div>

      {activeTab === 'exam' && (
        <div>
          {/* Exam Header Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="text-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-gray-900">{data.exam_title}</h3>
              <p className="text-gray-500 text-sm">{data.subject}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
              <div>
                <p className="text-gray-400 text-xs">Total Points</p>
                <p className="font-bold text-gray-800">{data.total_points}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Time Limit</p>
                <p className="font-bold text-gray-800">{data.time_limit_minutes} minutes</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Difficulty</p>
                <p className="font-bold text-gray-800 capitalize">{data.difficulty}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">INSTRUCTIONS</p>
              <p className="text-sm text-gray-700">{data.instructions}</p>
            </div>

            {/* Student Info Lines */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="border-b border-gray-300 pb-1">
                <p className="text-xs text-gray-400">Name</p>
              </div>
              <div className="border-b border-gray-300 pb-1">
                <p className="text-xs text-gray-400">Date</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {(data.sections || []).map((section) => (
            <div key={section.section_number} className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 shadow-sm">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h4 className="text-lg font-bold text-gray-900">{section.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{section.instructions}</p>
              </div>

              <div className="space-y-5">
                {section.questions.map((q, idx) => (
                  <div key={q.id} className="pb-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                        {q.question}
                      </p>
                      <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">({q.points} pt{q.points !== 1 ? 's' : ''})</span>
                    </div>

                    {/* MC Options */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="ml-5 mt-2 space-y-1">
                        {q.options.map((opt) => (
                          <p key={opt} className="text-sm text-gray-600">{opt}</p>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {q.type === 'true_false' && (
                      <p className="ml-5 mt-1 text-sm text-gray-500">True &nbsp;&nbsp;&nbsp; False</p>
                    )}

                    {/* Short Answer / Essay blank lines */}
                    {(q.type === 'short_answer' || q.type === 'essay') && (
                      <div className="ml-5 mt-2 space-y-2">
                        {Array.from({ length: q.type === 'essay' ? 8 : 3 }).map((_, i) => (
                          <div key={i} className="border-b border-gray-200 h-6" />
                        ))}
                        {q.grading_rubric && (
                          <p className="text-xs text-gray-300 italic">(Rubric: {q.grading_rubric})</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Point Distribution */}
          {data.point_distribution && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Point Distribution</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(data.point_distribution).map(([type, pts]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 capitalize">{type.replace('_', ' ')}</p>
                    <p className="font-bold text-gray-800">{pts} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grading Scale */}
          {data.grading_scale && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Grading Scale</h4>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(data.grading_scale).map(([grade, range]) => (
                  <div key={grade} className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <p className="font-bold text-indigo-600">{grade}</p>
                    <p className="text-xs text-gray-500">{range}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer Key Tab */}
      {activeTab === 'key' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 Answer Key</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(data.answer_key || {}).map(([qNum, answer]) => (
              <div key={qNum} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                <span className="text-sm font-bold text-indigo-600 min-w-[24px]">{qNum}.</span>
                <span className="text-sm text-gray-700">{answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
