import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getUserProgress, getAssessmentSkills } from '../../utils/api'

function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [assessmentSkills, setAssessmentSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Student')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const storedUser = sessionStorage.getItem('careerUser')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser?.name) setUserName(parsedUser.name)
        if (parsedUser?.email) setUserEmail(parsedUser.email)
        if (parsedUser?.resumeId) {
          fetchAllData(parsedUser)
        } else {
          setLoading(false)
        }
      } catch (e) {}
    } else {
      setLoading(false)
    }
  }, [])

  const fetchAllData = async (currentUser) => {
    try {
      setLoading(true)
      if (!currentUser?.resumeId) {
        setLoading(false)
        return
      }
      const progressData = await getUserProgress(currentUser.resumeId)
      setProgress(progressData)
      const skills = await getAssessmentSkills(currentUser.resumeId)
      setAssessmentSkills(skills || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    const storedUser = sessionStorage.getItem('careerUser')
    if (!storedUser) return
    let currentUser = null
    try {
      currentUser = JSON.parse(storedUser)
    } catch (e) {
      return
    }
    if (!progress || !currentUser) return
    if (progress.skills_rated && progress.total_skills > 0) {
      return
    }
    if (progress.has_skills && progress.total_skills > 0) {
      navigate(`/skill-rating/${currentUser.resumeId}`)
      return
    }
    navigate(`/skill-review/${currentUser.resumeId}`)
  }

  const handleStartTest = (skillName) => {
    const storedUser = sessionStorage.getItem('careerUser')
    if (!storedUser) {
      alert('Please login again')
      return
    }
    let currentUser = null
    try {
      currentUser = JSON.parse(storedUser)
    } catch (e) {
      alert('Please login again')
      return
    }
    if (!skillName) {
      alert('No skill selected.')
      return
    }
    navigate(`/assessment/${currentUser.resumeId}/${skillName}`)
  }

  const handleViewResults = (skillName) => {
    const storedUser = sessionStorage.getItem('careerUser')
    if (!storedUser) return
    let currentUser = null
    try {
      currentUser = JSON.parse(storedUser)
    } catch (e) {
      return
    }
    navigate(`/results/${currentUser.resumeId}/${skillName}`)
  }

  const handleStartNew = () => {
    navigate('/')
  }

  const handleLearningResources = () => {
    navigate('/learning-resources')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your progress...</p>
          </div>
        </div>
      </div>
    )
  }

  const getCurrentStepIndex = () => {
    if (progress?.skills_rated) return 3
    if (progress?.has_skills) return 2
    return 1
  }

  const currentStepIndex = getCurrentStepIndex()
  const totalSteps = 4
  const progressPercentage = (currentStepIndex / totalSteps) * 100
  const isAssessmentAvailable = progress?.skills_rated && assessmentSkills.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-6xl mx-auto pt-28 pb-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{userName}</span>
          </h1>
          <p className="text-gray-500 text-sm">Continue your career journey</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Your Progress</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Resume Upload</span>
              <span>Skill Review</span>
              <span>Skill Rating</span>
              <span>Assessment</span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span className={currentStepIndex >= 1 ? 'text-green-600 font-medium' : ''}>
                {currentStepIndex >= 1 ? 'Complete' : 'Pending'}
              </span>
              <span className={currentStepIndex >= 2 ? 'text-green-600 font-medium' : ''}>
                {currentStepIndex >= 2 ? 'Complete' : 'Pending'}
              </span>
              <span className={currentStepIndex >= 3 ? 'text-green-600 font-medium' : ''}>
                {currentStepIndex >= 3 ? 'Complete' : 'Pending'}
              </span>
              <span className={currentStepIndex >= 4 ? 'text-green-600 font-medium' : ''}>
                {currentStepIndex >= 4 ? 'Complete' : 'Locked'}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Current Step:</span> 
              {progress?.skills_rated ? ' Assessment' : 
               progress?.has_skills ? ' Skill Rating' : ' Skill Review'}
            </p>
            {progress?.skills_rated && (
              <p className="text-xs text-gray-500 mt-1">
                Select a skill below to start your test
              </p>
            )}
          </div>
        </div>

        {isAssessmentAvailable && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Available Assessments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessmentSkills.map((skill) => (
                <div key={skill.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{skill.skill_name}</h3>
                      <p className="text-sm text-gray-500">
                        Rating: {skill.rating}/10 • {skill.rating_level || 'Not Rated'}
                      </p>
                    </div>
                    {skill.already_taken ? (
                      <button
                        onClick={() => handleViewResults(skill.skill_name)}
                        className="text-blue-600 font-medium text-sm px-3 py-1 bg-blue-50 rounded-full hover:bg-blue-100 transition"
                      >
                        View Results
                      </button>
                    ) : skill.questions_available === 0 ? (
                      <span className="text-gray-400 font-medium text-sm px-3 py-1 bg-gray-100 rounded-full">
                        No Questions
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartTest(skill.skill_name)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Start Test
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md"
          >
            Continue Where You Left Off
            <span className="block text-xs font-normal opacity-80 mt-0.5">
              {progress?.skills_rated ? 'Assessment' : 
               progress?.has_skills ? 'Skill Rating' : 
               'Skill Review'}
            </span>
          </button>
          
          <button
            onClick={handleStartNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md"
          >
            Start New Resume
          </button>
          
          <button
            onClick={handleLearningResources}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm hover:shadow-md"
          >
            Learning Resources
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard