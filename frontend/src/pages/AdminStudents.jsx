import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAllResumes, getSkills, getAllTestResults } from '../utils/api'
import axios from 'axios'
import API_BASE_URL from '../config'

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
  const [filter, setFilter] = useState('all') // all, visible, hidden, pending

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    let filtered = students

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.phone || '').includes(searchTerm) ||
        (s.id?.toString() || '').includes(searchTerm)
      )
    }

    // Apply visibility filter
    if (filter === 'visible') {
      filtered = filtered.filter(s => s.is_visible_to_recruiters === true)
    } else if (filter === 'hidden') {
      filtered = filtered.filter(s => s.is_visible_to_recruiters !== true)
    } else if (filter === 'completed') {
      filtered = filtered.filter(s => s.test_completed === true)
    }

    setFilteredStudents(filtered)
  }, [searchTerm, students, filter])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllResumes()
      
      // Filter ONLY students
      const studentList = data.filter(s => 
        s.role !== 'trainer' && 
        s.role !== 'admin' &&
        (s.role === 'student' || s.role === null || s.role === '' || s.role === undefined)
      )
      
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
      
      // Get full profile
      let profileData = {}
      try {
        const profileRes = await axios.get(`${API_BASE_URL}/student/profile/${student.id}`)
        profileData = profileRes.data
      } catch (e) {
        console.log('Profile not found, using basic data')
      }
      
      setStudentDetails({
        ...student,
        ...profileData,
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

  const toggleRecruiterVisibility = async (studentId, currentStatus) => {
    const newStatus = !currentStatus
    const action = newStatus ? 'approve for recruiters' : 'hide from recruiters'
    
    if (!window.confirm(`Are you sure you want to ${action}?`)) return
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/student/${studentId}/toggle-recruiter-visibility`,
        { 
          is_visible_to_recruiters: newStatus,
          admin_notes: newStatus ? 'Approved by admin' : null
        }
      )
      
      // Update local state
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, is_visible_to_recruiters: newStatus }
          : s
      ))
      
      if (studentDetails?.id === studentId) {
        setStudentDetails({ ...studentDetails, is_visible_to_recruiters: newStatus })
      }
      
      alert(`Student ${newStatus ? 'approved for' : 'hidden from'} recruiters!`)
    } catch (err) {
      console.error('Error toggling visibility:', err)
      alert('Failed to update visibility')
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
            <p className="text-gray-500">Review students and approve them for recruiters</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Visible to Recruiters</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.is_visible_to_recruiters).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Hidden</p>
            <p className="text-2xl font-bold text-gray-600">
              {students.filter(s => !s.is_visible_to_recruiters).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Skills Rated</p>
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.skills_rated).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Tests Done</p>
            <p className="text-2xl font-bold text-purple-600">
              {students.filter(s => s.test_completed).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or ID..."
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              <option value="visible">✅ Visible to Recruiters</option>
              <option value="hidden">❌ Hidden from Recruiters</option>
              <option value="completed">🎯 Test Completed</option>
            </select>
            <span className="text-sm text-gray-500">
              {filteredStudents.length} students
            </span>
          </div>
        </div>

        {/* Students Table */}
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
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Progress</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Recruiter Visibility</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">#{student.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">{student.email || 'N/A'}</td>
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
                        {student.is_visible_to_recruiters ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                            ✅ Visible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchStudentDetails(student)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => toggleRecruiterVisibility(student.id, student.is_visible_to_recruiters)}
                            className={`text-sm font-medium px-3 py-1 rounded-lg transition ${
                              student.is_visible_to_recruiters
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {student.is_visible_to_recruiters ? 'Hide' : 'Approve'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showDetails && studentDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {studentDetails.name || 'Student'}
                </h2>
                <p className="text-sm text-gray-500">{studentDetails.email}</p>
              </div>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Approval Status Banner */}
              <div className={`mb-6 p-4 rounded-xl border-2 ${
                studentDetails.is_visible_to_recruiters
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {studentDetails.is_visible_to_recruiters
                        ? '✅ Visible to Recruiters'
                        : '❌ Not Visible to Recruiters'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {studentDetails.is_visible_to_recruiters
                        ? 'This profile is shown to recruiters'
                        : 'Approve to make this profile visible to recruiters'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRecruiterVisibility(studentDetails.id, studentDetails.is_visible_to_recruiters)}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      studentDetails.is_visible_to_recruiters
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {studentDetails.is_visible_to_recruiters ? 'Hide from Recruiters' : 'Approve for Recruiters'}
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {studentDetails.location && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{studentDetails.location}</p>
                  </div>
                )}
                {studentDetails.education && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Education</p>
                    <p className="text-sm font-medium">{studentDetails.education}</p>
                  </div>
                )}
                {studentDetails.phone && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{formatPhone(studentDetails.phone)}</p>
                  </div>
                )}
                {studentDetails.experience && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="text-sm font-medium">{studentDetails.experience}</p>
                  </div>
                )}
              </div>

              {/* About */}
              {studentDetails.about && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                  <p className="text-gray-600 text-sm">{studentDetails.about}</p>
                </div>
              )}

              {/* Skills & Ratings */}
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

              {/* Test Results */}
              <h3 className="font-semibold text-gray-800 mb-3">Test Results</h3>
              {studentDetails.testResults && studentDetails.testResults.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {studentDetails.testResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{result.skill_name}</p>
                          <p className="text-sm text-gray-500">
                            {result.total_questions} questions • {result.correct_answers} correct
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
                <p className="text-gray-500 text-sm mb-6">No test results yet.</p>
              )}

              {/* Projects */}
              {studentDetails.projects && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">🚀 Projects</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{studentDetails.projects}</p>
                </div>
              )}

              {/* Certifications */}
              {studentDetails.certifications && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📜 Certifications</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{studentDetails.certifications}</p>
                </div>
              )}

              {/* Courses */}
              {studentDetails.courses && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📚 Courses</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{studentDetails.courses}</p>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3 mt-6">
                {studentDetails.linkedin_url && (
                  <a href={studentDetails.linkedin_url} target="_blank" rel="noopener noreferrer"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                    LinkedIn
                  </a>
                )}
                {studentDetails.github_url && (
                  <a href={studentDetails.github_url} target="_blank" rel="noopener noreferrer"
                     className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm">
                    GitHub
                  </a>
                )}
                {studentDetails.portfolio_url && (
                  <a href={studentDetails.portfolio_url} target="_blank" rel="noopener noreferrer"
                     className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStudents