import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { generateTest, submitTest } from '../utils/api'

function AssessmentPage({ user, onLogout }) {
  const { resumeId, skillName } = useParams()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [testInfo, setTestInfo] = useState(null)

  useEffect(() => {
    fetchTest()
  }, [resumeId, skillName])

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  const fetchTest = async () => {
    try {
      setLoading(true)
      const data = await generateTest(resumeId, skillName)
      setQuestions(data.questions || [])
      setTestInfo({
        skill: data.skill,
        difficulty: data.difficulty,
        rating: data.rating,
        total: data.total_questions
      })
      // 1.5 minutes per question
      setTimeRemaining(Math.ceil(data.total_questions * 1.5 * 60))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
      await submitTestHandler()
    }
  }

  const handleAutoSubmit = async () => {
    alert('⏰ Time is up! Your test will be submitted automatically.')
    await submitTestHandler()
  }

  const submitTestHandler = async () => {
    try {
      setSubmitting(true)
      const submissionData = {
        resume_id: parseInt(resumeId),
        skill_name: skillName,
        answers: answers
      }
      const results = await submitTest(submissionData)
      navigate(`/results/${resumeId}/${skillName}`, { state: { results } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit test. Please try again.')
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your test...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="max-w-2xl mx-auto pt-32 px-6 text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            {error}
          </div>
          <button
            onClick={fetchTest}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="max-w-2xl mx-auto pt-32 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-700">No questions available</h2>
          <p className="text-gray-500 mt-2">Please contact admin to add questions for this skill.</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = answers[currentQuestion?.id] !== undefined
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{testInfo?.skill}</h1>
            <p className="text-sm text-gray-500">
              Difficulty: {testInfo?.difficulty} • Rating: {testInfo?.rating}/10
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-500">
              {answeredCount}/{questions.length} answered
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion?.question_text}
          </h2>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option}.</span> {currentQuestion?.[`option_${option.toLowerCase()}`]}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-6 py-2 rounded-lg ${
              currentIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition`}
          >
            ← Previous
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-2 rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className={`px-6 py-2 rounded-lg ${
              currentIndex === questions.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition`}
          >
            Next →
          </button>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : answers[q.id] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssessmentPage