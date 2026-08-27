import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { generateTest, submitTest } from '../utils/api'

function AssessmentPage({ user, onLogout }) {
  const { resumeId, skillName } = useParams()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [testInfo, setTestInfo] = useState(null)

  useEffect(() => {
    if (resumeId && skillName) {
      fetchTest()
    }
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
      setError(null)
      
      const data = await generateTest(resumeId, skillName)
      
      if (data.already_taken) {
        setError(`You have already completed the test for ${skillName}!`)
        setLoading(false)
        return
      }
      
      if (!data.questions || data.questions.length === 0) {
        setError(`No questions available for ${skillName}. Please contact admin.`)
        setLoading(false)
        return
      }
      
      setQuestions(data.questions || [])
      setTestInfo({
        skill: data.skill || skillName,
        difficulty: data.difficulty || 'Medium',
        rating: data.rating || 5,
        total: data.total_questions || data.questions.length
      })
      setTimeRemaining(Math.ceil((data.total_questions || data.questions.length) * 1.5 * 60))
      setLoading(false)
    } catch (err) {
      console.error('Error fetching test:', err)
      setError(err.response?.data?.detail || 'Failed to load test. Please try again.')
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleAutoSubmit = async () => {
    alert('Time is up! Your test will be submitted automatically.')
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
      
      //console.log('📊 Full results from API:', results)
      
      if (results.already_taken) {
        alert('You have already completed this test!')
        navigate('/student-dashboard')
        return
      }
      
      if (!results || !results.details) {
        alert('No results data received. Please try again.')
        setSubmitting(false)
        return
      }
      
      //alert(`Test completed! Score: ${results.score_percentage.toFixed(1)}% - ${results.result_status}`)
      
      navigate(`/results/${resumeId}/${skillName}`, { 
        state: { 
          results: {
            summary: {
              skill_name: results.skill_name || skillName,
              total_questions: results.total_questions || 0,
              correct_answers: results.correct_answers || 0,
              score_percentage: results.score_percentage || 0,
              result_status: results.result_status || 'Failed'
            },
            details: results.details || []
          }
        } 
      })
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.detail || 'Failed to submit test.')
      setSubmitting(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/student-dashboard')
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
            <p className="font-bold">{error}</p>
            <p className="text-sm mt-2">Skill: {skillName}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              onClick={fetchTest}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Retry
            </button>
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Dashboard
            </button>
          </div>
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
          <p className="text-gray-500 mt-2">Please contact admin to add questions for {skillName}.</p>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const isTestComplete = answeredCount === questions.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{testInfo?.skill}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${
                testInfo?.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                testInfo?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {testInfo?.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Rating: {testInfo?.rating}/10 • Question {currentQuestionIndex + 1} of {questions.length}
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

        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
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

        <div className="mt-6 flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-2 rounded-lg ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } transition`}
          >
            ← Previous
          </button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={submitting || !isTestComplete}
              className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-2 rounded-lg hover:shadow-lg transition font-semibold ${
                !isTestComplete ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Next →
            </button>
          )}
        </div>

        {!isTestComplete && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Please answer all questions before submitting.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                index === currentQuestionIndex
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