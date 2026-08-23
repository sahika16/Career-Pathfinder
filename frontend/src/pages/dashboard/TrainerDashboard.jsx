import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getAllResumes } from '../../utils/api'

function TrainerDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debug user data
  useEffect(() => {
    console.log('TrainerDashboard - user prop:', user)
    
    // If user is null, try to get from localStorage
    if (!user) {
      const storedUser = localStorage.getItem('careerUser')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          console.log('TrainerDashboard - user from localStorage:', parsedUser)
          // If role is trainer, we should be good
        } catch (e) {
          console.error('Error parsing user:', e)
        }
      }
    }
  }, [user])

  useEffect(() => {
    // If user exists (either from prop or after check), fetch students
    if (user) {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await getAllResumes()
      const studentList = data.filter(r => r.role === 'student' || !r.role)
      setStudents(studentList)
      setError(null)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students data.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto pt-28 pb-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              Trainer Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome, <span className="font-semibold text-blue-600">{user?.name || 'Trainer'}</span>!
            </p>
          </div>
          <button
            onClick={handleBackToHome}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Active Students</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {students.filter(s => s.skills_rated).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Completed Tests</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {students.filter(s => s.test_completed).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Your Students</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
              <button onClick={fetchStudents} className="ml-3 text-blue-600 hover:underline">
                Retry
              </button>
            </div>
          )}

          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">#</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">{student.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.skills && student.skills.length > 0 ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                            {student.skills.length}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          student.test_completed ? 'bg-green-100 text-green-700' :
                          student.skills_rated ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {student.test_completed ? 'Test Done' :
                           student.skills_rated ? 'Rated' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard