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
    // Check if results passed from state
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
    if (score >= 90) return '🏆 Excellent! You\'re ready for advanced challenges.'
    if (score >= 70) return '✅ Good work! Keep practicing to reach expert level.'
    if (score >= 60) return '⚠️ You passed! Focus on improving weak areas.'
    if (score >= 50) return '🔄 You need improvement. Review the basics.'
    return '❌ Strongly recommend revisiting fundamentals.'
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
            onClick={fetchResults}
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
      
      <div className="max-w-3xl mx-auto pt-28 pb-12 px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
            ✅ Test Completed
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-4">
            {summary?.skill_name} Assessment
          </h1>
          <p className="text-gray-600 mt-2">
            {summary?.result_status === 'Passed' ? '🎉 Congratulations!' : '📚 Keep learning!'}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(summary?.score_percentage)}`}>
              {summary?.score_percentage.toFixed(1)}%
            </div>
            <p className={`text-xl font-semibold mt-2 ${getStatusColor(summary?.result_status)}`}>
              {summary?.result_status}
            </p>
            <p className="text-gray-500 mt-1">
              {summary?.correct_answers} correct out of {summary?.total_questions} questions
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold text-gray-800">{summary?.total_questions}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Correct</p>
              <p className="text-2xl font-bold text-green-600">{summary?.correct_answers}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Incorrect</p>
              <p className="text-2xl font-bold text-red-600">
                {summary?.total_questions - summary?.correct_answers}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
          <h3 className="font-bold text-blue-800 mb-2">💡 Recommendation</h3>
          <p className="text-blue-700">
            {getRecommendation(summary?.score_percentage, summary?.result_status)}
          </p>
        </div>

        {/* Question Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Question Review</h2>
          <div className="space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-700">Question {index + 1}</p>
                  <p className="text-sm text-gray-500">
                    Your answer: <span className={`font-semibold ${detail.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                      {detail.user_answer || 'Not answered'}
                    </span>
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  detail.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {detail.is_correct ? '✅ Correct' : '❌ Incorrect'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/student-dashboard')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition font-semibold"
          >
            🏠 Back to Dashboard
          </button>
          <button
            onClick={() => navigate(`/assessment/${resumeId}/${skillName}`)}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition font-semibold"
          >
            📝 Retake Test (If Allowed)
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestResultsPage