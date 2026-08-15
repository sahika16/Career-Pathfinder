import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAllResumes, getSkills, getAllTestResults } from '../utils/api'

function AdminStudents({ user, onLogout }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(s => 
        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.phone || '').includes(searchTerm) ||
        (s.id?.toString() || '').includes(searchTerm)
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllResumes()
      const studentList = data.filter(s => s.role === 'student' || !s.role)
      setStudents(studentList)
      setFilteredStudents(studentList)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students data.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDetails = async (student) => {
    try {
      setLoading(true)
      
      const skillsData = await getSkills(student.id)
      const testResults = await getAllTestResults(student.id)
      
      setStudentDetails({
        ...student,
        skills: skillsData || [],
        testResults: testResults || []
      })
      setSelectedStudent(student)
      setShowDetails(true)
    } catch (err) {
      console.error('Error fetching student details:', err)
      alert('Failed to load student details.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedStudent(null)
    setStudentDetails(null)
  }

  const formatPhone = (phone) => {
    if (!phone) return 'N/A'
    let cleaned = phone.replace('+91', '').trim()
    cleaned = cleaned.replace(/\s/g, '')
    return cleaned || 'N/A'
  }

  const getRatingLevel = (rating) => {
    if (rating >= 8) return 'bg-green-500 text-white'
    if (rating >= 5) return 'bg-yellow-500 text-white'
    if (rating >= 1) return 'bg-red-500 text-white'
    return 'bg-gray-300 text-gray-600'
  }

  if (loading && !showDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-500">View all registered students and their progress</p>
          </div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={fetchStudents} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Skills Rated</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.skills_rated).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Test Completed</p>
            <p className="text-2xl font-bold text-purple-600">
              {students.filter(s => s.test_completed).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="font-medium text-gray-700">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or ID..."
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">
              {filteredStudents.length} students found
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No students found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">#{student.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">{student.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatPhone(student.phone)}</td>
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
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => fetchStudentDetails(student)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          View Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal - Clean Version */}
      {showDetails && studentDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {studentDetails.name || 'Student'}
              </h2>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Skills Section */}
              <h3 className="font-semibold text-gray-800 mb-3">Skills & Ratings</h3>
              {studentDetails.skills && studentDetails.skills.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                  {studentDetails.skills.map((skill) => (
                    <div key={skill.id} className="bg-blue-50 rounded-lg px-3 py-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{skill.skill_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        skill.rating >= 8 ? 'bg-green-500 text-white' :
                        skill.rating >= 5 ? 'bg-yellow-500 text-white' :
                        skill.rating ? 'bg-red-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {skill.rating ? `${skill.rating}/10` : 'Not Rated'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">No skills rated yet.</p>
              )}

              {/* Test Results Section */}
              <h3 className="font-semibold text-gray-800 mb-3">Test Results</h3>
              {studentDetails.testResults && studentDetails.testResults.length > 0 ? (
                <div className="space-y-3">
                  {studentDetails.testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{result.skill_name}</p>
                          <p className="text-sm text-gray-500">
                            {result.total_questions} questions • {result.correct_answers} correct
                          </p>
                          <p className="text-xs text-gray-400">
                            {result.test_date ? new Date(result.test_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            result.score_percentage >= 70 ? 'text-green-600' :
                            result.score_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {result.score_percentage.toFixed(1)}%
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            result.result_status === 'Passed' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.result_status || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No test results yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStudents