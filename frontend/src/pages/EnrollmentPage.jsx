import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAllTrainers, enrollStudent, getStudentEnrollments } from '../utils/api'

function EnrollmentPage({ user, onLogout }) {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [enrolledSessions, setEnrolledSessions] = useState([])
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const studentId = user?.resumeId

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all trainers with their sessions
      const trainersData = await getAllTrainers()
      const approvedTrainers = trainersData.filter(t => t.is_approved === true)
      setTrainers(approvedTrainers)

      // Get student's enrolled sessions
      if (studentId) {
        const enrolled = await getStudentEnrollments(studentId)
        setEnrolledSessions(enrolled || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (sessionId) => {
    if (!studentId) {
      setError('Please login to enroll in courses.')
      return
    }

    try {
      setEnrolling(true)
      setError(null)
      
      const response = await enrollStudent(studentId, sessionId)
      setSuccessMessage('Successfully enrolled in the course! 🎉')
      
      // Refresh data
      await fetchData()
      setShowEnrollModal(false)
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error enrolling:', err)
      setError(err.response?.data?.detail || 'Failed to enroll. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const isEnrolled = (sessionId) => {
    return enrolledSessions.some(e => e.session_id === sessionId)
  }

  const getEnrollmentStatus = (sessionId) => {
    const enrollment = enrolledSessions.find(e => e.session_id === sessionId)
    return enrollment?.status || null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLevelBadge = (level) => {
    const styles = {
      'Beginner': 'bg-green-100 text-green-700',
      'Intermediate': 'bg-yellow-100 text-yellow-700',
      'Advanced': 'bg-red-100 text-red-700'
    }
    return styles[level] || 'bg-gray-100 text-gray-600'
  }

  const getStatusBadge = (status) => {
    const styles = {
      'enrolled': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto pt-28 pb-12 px-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition p-1.5 rounded-full hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enroll in Courses</h1>
            <p className="text-sm text-gray-500">Browse and enroll in courses from our expert trainers</p>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-blue-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* My Enrolled Courses */}
        {enrolledSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">📚 My Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledSessions.map((enrollment) => (
                <div key={enrollment.session_id} className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{enrollment.session_title}</h3>
                      <p className="text-sm text-gray-500">Trainer: {enrollment.trainer_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(enrollment.status)}`}>
                      {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/learning-resources')}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Continue Learning
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🎓 Available Courses</h2>
        
        {trainers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No courses available at the moment.</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new courses!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {trainer.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{trainer.name}</h3>
                      <p className="text-sm text-gray-500">{trainer.specialty || 'Trainer'}</p>
                    </div>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {trainer.category || 'Regular'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {trainer.sessions && trainer.sessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trainer.sessions.map((session) => {
                        const enrolled = isEnrolled(session.id)
                        const status = getEnrollmentStatus(session.id)
                        
                        return (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition">
                            <h4 className="font-medium text-gray-800">{session.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{session.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {session.level && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadge(session.level)}`}>
                                  {session.level}
                                </span>
                              )}
                              {session.session_date && (
                                <span className="text-xs text-gray-500">
                                  📅 {formatDate(session.session_date)}
                                </span>
                              )}
                              {session.duration_minutes && (
                                <span className="text-xs text-gray-500">
                                  ⏱️ {session.duration_minutes} min
                                </span>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-3">
                              <span className="text-sm">
                                {session.price > 0 ? (
                                  <span className="font-semibold text-blue-600">₹{session.price}</span>
                                ) : (
                                  <span className="text-green-600 font-medium">Free</span>
                                )}
                                <span className="text-xs text-gray-400 ml-1">
                                  ({session.enrolled_count || 0}/{session.max_students} enrolled)
                                </span>
                              </span>

                              {enrolled ? (
                                <span className="text-xs text-green-600 font-medium px-3 py-1 bg-green-50 rounded-full">
                                  {status === 'completed' ? '✅ Completed' : '✅ Enrolled'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedSession(session)
                                    setShowEnrollModal(true)
                                  }}
                                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                                >
                                  Enroll
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No sessions available from this trainer.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Enrollment</h2>
            <p className="text-gray-600">
              Are you sure you want to enroll in <span className="font-semibold">{selectedSession.title}</span>?
            </p>
            
            {selectedSession.price > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                💰 This course costs <span className="font-semibold text-blue-600">₹{selectedSession.price}</span>
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition font-medium"
                disabled={enrolling}
              >
                Cancel
              </button>
              <button
                onClick={() => handleEnroll(selectedSession.id)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center justify-center"
                disabled={enrolling}
              >
                {enrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Enrolling...
                  </>
                ) : (
                  'Enroll Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnrollmentPage