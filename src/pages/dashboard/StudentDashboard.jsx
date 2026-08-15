import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getUserProgress, getAssessmentSkills } from '../../utils/api'

function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [assessmentSkills, setAssessmentSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.resumeId) {
      fetchProgress()
      fetchAssessmentSkills()
    }
  }, [user])

  const fetchProgress = async () => {
    try {
      const data = await getUserProgress(user.resumeId)
      setProgress(data)
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const fetchAssessmentSkills = async () => {
    try {
      const skills = await getAssessmentSkills(user.resumeId)
      setAssessmentSkills(skills)
    } catch (error) {
      console.error('Error fetching assessment skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!progress) return
    
    if (progress.skills_rated && progress.total_skills > 0) {
      // User has rated skills - go to assessment
      if (assessmentSkills.length > 0) {
        // Start with first skill
        navigate(`/assessment/${user.resumeId}/${assessmentSkills[0].skill_name}`)
      } else {
        alert('No skills available for assessment. Please contact admin.')
      }
    } else if (progress.has_skills && progress.total_skills > 0) {
      navigate(`/skill-rating/${user.resumeId}`)
    } else {
      navigate(`/skill-review/${user.resumeId}`)
    }
  }

  const handleStartAssessment = (skillName) => {
    navigate(`/assessment/${user.resumeId}/${skillName}`)
  }

  const handleStartNew = () => {
    navigate('/')
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

  const steps = [
    { name: 'Upload Resume', completed: true },
    { name: 'Skill Review', completed: progress?.has_skills || false },
    { name: 'Skill Rating', completed: progress?.skills_rated || false },
    { name: 'Assessment', completed: false, locked: !progress?.skills_rated }
  ]

  const getCurrentStep = () => {
    if (progress?.skills_rated) return 'Assessment'
    if (progress?.has_skills) return 'Skill Rating'
    return 'Skill Review'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto pt-28 pb-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user?.name || 'Student'}</span>
          </h1>
          <p className="text-gray-600 mt-2">Continue your career journey from where you left off</p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Your Progress</h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.locked 
                      ? 'bg-gray-200 text-gray-400' 
                      : 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                }`}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.completed ? 'text-gray-700' : step.locked ? 'text-gray-400' : 'text-gray-800'
                  }`}>
                    {step.name}
                    {step.completed && ' ✅'}
                    {step.locked && ' 🔒'}
                  </p>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        step.completed ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: step.completed ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Skills Section */}
        {progress?.skills_rated && assessmentSkills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📝 Available Assessments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assessmentSkills.map((skill) => (
                <div key={skill.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{skill.skill_name}</h3>
                      <p className="text-sm text-gray-500">
                        Rating: {skill.rating}/10 • {skill.rating_level || 'Not Rated'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartAssessment(skill.skill_name)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition"
                    >
                      Start Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:shadow-lg transition font-bold text-lg"
          >
            🚀 Continue Where You Left Off
            <span className="block text-sm font-normal opacity-80">
              You're on: {getCurrentStep()}
            </span>
          </button>
          
          <button
            onClick={handleStartNew}
            className="bg-gray-200 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-300 transition font-semibold"
          >
            Start New Resume
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard