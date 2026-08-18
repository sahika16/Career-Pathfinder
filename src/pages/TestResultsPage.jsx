import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getTestResults } from '../utils/api'

function TestResultsPage({ user, onLogout }) {
  const { resumeId, skillName } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results)
      setLoading(false)
    } else {
      fetchResults()
    }
  }, [resumeId, skillName])

  const fetchResults = async () => {
    try {
      const data = await getTestResults(resumeId, skillName)
      console.log('Results data:', data)
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load results.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    return status === 'Passed' ? 'text-green-600' : 'text-red-600'
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendation = (score, status) => {
    if (score >= 90) return 'Excellent! You are ready for advanced challenges.'
    if (score >= 70) return 'Good work! Keep practicing to reach expert level.'
    if (score >= 60) return 'You passed! Focus on improving weak areas.'
    if (score >= 50) return 'You need improvement. Review the basics.'
    return 'Strongly recommend revisiting fundamentals.'
  }

  const handleBackToDashboard = () => {
    navigate('/student-dashboard')
  }

  const handleRetry = () => {
    fetchResults()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
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
            onClick={handleRetry}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summary = results?.summary
  const details = results?.details || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto pt-28 pb-12 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg ${
            summary?.result_status === 'Passed' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
          }`}>
            {summary?.result_status === 'Passed' ? 'Test Passed' : 'Test Failed'}
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-4">
            {summary?.skill_name} Assessment
          </h1>
          <p className="text-gray-600 mt-2">
            {summary?.result_status === 'Passed' ? 'Congratulations!' : 'Keep learning!'}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(summary?.score_percentage)}`}>
              {summary?.score_percentage?.toFixed(1) || 0}%
            </div>
            <p className={`text-xl font-semibold mt-2 ${getStatusColor(summary?.result_status)}`}>
              {summary?.result_status || 'N/A'}
            </p>
            <p className="text-gray-500 mt-1">
              {summary?.correct_answers || 0} correct out of {summary?.total_questions || 0} questions
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold text-gray-800">{summary?.total_questions || 0}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Correct</p>
              <p className="text-2xl font-bold text-green-600">{summary?.correct_answers || 0}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Incorrect</p>
              <p className="text-2xl font-bold text-red-600">
                {(summary?.total_questions || 0) - (summary?.correct_answers || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-2xl p-6 border mb-8 ${
          summary?.score_percentage >= 60 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <h3 className={`font-bold mb-2 ${
            summary?.score_percentage >= 60 ? 'text-blue-800' : 'text-orange-800'
          }`}>
            Recommendation
          </h3>
          <p className={summary?.score_percentage >= 60 ? 'text-blue-700' : 'text-orange-700'}>
            {getRecommendation(summary?.score_percentage, summary?.result_status)}
          </p>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Question Review</h2>
          <div className="space-y-6">
            {details.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No question details available.</p>
            ) : (
              details.map((detail, index) => {
                const isCorrect = detail.is_correct === true || detail.is_correct === 1
                
                const questionText = detail.question_text || 
                                    detail.question || 
                                    `Question ${index + 1}`
                
                const userAnswer = detail.user_answer || 'Not answered'
                const correctAnswer = detail.correct_answer || ''
                
                // Get options
                const options = [
                  { letter: 'A', text: detail.option_a || '' },
                  { letter: 'B', text: detail.option_b || '' },
                  { letter: 'C', text: detail.option_c || '' },
                  { letter: 'D', text: detail.option_d || '' }
                ].filter(opt => opt.text)
                
                return (
                  <div key={index} className={`border-2 rounded-xl overflow-hidden ${
                    isCorrect ? 'border-green-400' : 'border-red-400'
                  }`}>
                    {/* Header with question number and status */}
                    <div className={`px-6 py-3 flex justify-between items-center ${
                      isCorrect ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <h3 className="font-semibold text-gray-700">
                        Question {index + 1}
                      </h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-bold text-white ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    {/* Question Body */}
                    <div className="p-6">
                      {/* Question Text */}
                      <p className="text-gray-800 font-medium mb-4">
                        {questionText}
                      </p>
                      
                      {/* Options */}
                      {options.length > 0 && (
                        <div className="space-y-2">
                          {options.map((opt) => {
                            const isUserAnswer = userAnswer && 
                              userAnswer.toLowerCase() === opt.letter.toLowerCase()
                            const isCorrectAnswer = correctAnswer && 
                              correctAnswer.toLowerCase() === opt.letter.toLowerCase()
                            
                            let bgColor = 'bg-gray-50'
                            let borderColor = 'border-gray-200'
                            let textColor = 'text-gray-700'
                            
                            if (isUserAnswer && isCorrectAnswer) {
                              bgColor = 'bg-green-100'
                              borderColor = 'border-green-400'
                              textColor = 'text-green-700'
                            } else if (isUserAnswer && !isCorrectAnswer) {
                              bgColor = 'bg-red-100'
                              borderColor = 'border-red-400'
                              textColor = 'text-red-700'
                            } else if (isCorrectAnswer) {
                              bgColor = 'bg-green-50'
                              borderColor = 'border-green-300'
                              textColor = 'text-green-700'
                            }
                            
                            return (
                              <div 
                                key={opt.letter} 
                                className={`px-4 py-2 rounded border ${bgColor} ${borderColor} ${textColor}`}
                              >
                                <span className="font-medium">{opt.letter}. </span>
                                {opt.text}
                                {isUserAnswer && (
                                  <span className="ml-2 text-sm font-medium">
                                    (Your Answer)
                                  </span>
                                )}
                                {isCorrectAnswer && !isUserAnswer && (
                                  <span className="ml-2 text-sm font-medium">
                                    (Correct Answer)
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBackToDashboard}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-3 rounded-xl hover:shadow-lg transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestResultsPage