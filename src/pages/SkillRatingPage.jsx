import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getSkills, updateAllRatings, updateResumeStatus } from '../utils/api'

function SkillRatingPage({ user, onLogout }) {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSkills()
  }, [resumeId])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSkills(resumeId)
      setSkills(data.map(s => ({ ...s, rating: s.rating || 5 })))
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError('Failed to load skills. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (skillId, value) => {
    setSkills(skills.map(s => 
      s.id === skillId ? { ...s, rating: parseInt(value) } : s
    ))
  }

  const getRatingLevel = (rating) => {
    if (rating <= 4) return { text: 'Basic', color: 'text-blue-500' }
    if (rating <= 7) return { text: 'Intermediate', color: 'text-purple-500' }
    return { text: 'Advanced', color: 'text-green-500' }
  }

  const handleSaveRatings = async () => {
    try {
      setSaving(true)
      const ratings = skills.map(s => ({
        id: s.id,
        rating: s.rating
      }))
      await updateAllRatings(resumeId, ratings)
      
      await updateResumeStatus(resumeId, {
        skills_rated: true,
        current_step: 'assessment'
      })
      
      alert('✅ Ratings saved successfully!')
      
      // ====== DIRECTLY GO TO ASSESSMENT ======
      // This ensures user goes to assessment right after rating
      navigate(`/assessment/${resumeId}`, { replace: true })
      
    } catch (err) {
      setError('Failed to save ratings. Please try again.')
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate(`/skill-review/${resumeId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
            Step 2 of 2
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-6">
            Rate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f093fb] to-[#f5576c]">Skills</span>
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Rate your proficiency in each skill from 1 to 10
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
            <span className="text-2xl block">📘</span>
            <span className="font-bold text-blue-600">Basic</span>
            <span className="block text-sm text-gray-500">Rating 1-4</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-200">
            <span className="text-2xl block">📗</span>
            <span className="font-bold text-purple-600">Intermediate</span>
            <span className="block text-sm text-gray-500">Rating 5-7</span>
          </div>
          <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
            <span className="text-2xl block">📕</span>
            <span className="font-bold text-green-600">Advanced</span>
            <span className="block text-sm text-gray-500">Rating 8-10</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6">
            {error}
            <button 
              onClick={fetchSkills} 
              className="ml-4 text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-6">
          {skills.map((skill) => {
            const level = getRatingLevel(skill.rating)
            return (
              <div key={skill.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold text-gray-800">
                    {skill.skill_name}
                  </span>
                  <span className={`font-bold text-xl ${level.color}`}>
                    {skill.rating}/10
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={skill.rating}
                    onChange={(e) => handleRatingChange(skill.id, e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-500">10</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-sm text-gray-400">Basic</span>
                  <span className={`text-sm font-semibold ${level.color}`}>
                    {level.text}
                  </span>
                  <span className="text-sm text-gray-400">Advanced</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl hover:bg-gray-300 transition font-semibold"
          >
            ← Back
          </button>
          <button
            onClick={handleSaveRatings}
            disabled={saving}
            className="flex-2 bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white py-4 rounded-xl hover:shadow-lg transition font-bold text-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkillRatingPage