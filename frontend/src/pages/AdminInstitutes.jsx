import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import API_BASE_URL from '../config'

function AdminInstitutes({ user, onLogout }) {
  const navigate = useNavigate()

  const [institutes, setInstitutes] = useState([])
  const [pendingInstitutes, setPendingInstitutes] = useState([])
  const [pendingCourses, setPendingCourses] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInstitutes, setFilteredInstitutes] = useState([])
  const [selectedInstitute, setSelectedInstitute] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [approvalTab, setApprovalTab] = useState('pending')
  const [instituteCourses, setInstituteCourses] = useState([])
  const [instituteBatches, setInstituteBatches] = useState([])
  const [instituteEnrollments, setInstituteEnrollments] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    pendingCourses: 0
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = institutes.filter(i =>
        (i.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.institute_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.phone || '').includes(searchTerm) ||
        (i.id?.toString() || '').includes(searchTerm) ||
        (i.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.state?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      setFilteredInstitutes(filtered)
    } else {
      setFilteredInstitutes(institutes)
    }
  }, [searchTerm, institutes])

  const fetchAllData = async () => {
    setLoading(false)
    setError(null)

    fetchInstitutes()
    fetchPendingInstitutes()
    fetchPendingCourses()
    fetchAllCourses()
  }

  const fetchInstitutes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutes`)
      if (!response.ok) {
        setInstitutes([])
        setFilteredInstitutes([])
        return
      }
      const data = await response.json()
      setInstitutes(data)
      setFilteredInstitutes(data)

      const total = data.length
      const approved = data.filter(i => i.is_approved === true).length
      const pending = data.filter(i => i.is_approved === false && i.status === 'pending_approval').length
      const rejected = data.filter(i => i.status === 'rejected').length

      setStats(prev => ({ ...prev, total, approved, pending, rejected }))
    } catch (err) {
      console.error('Error fetching institutes:', err)
      setInstitutes([])
      setFilteredInstitutes([])
    }
  }

  const fetchPendingInstitutes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutes/pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingInstitutes(data)
      }
    } catch (err) {
      console.error('Error fetching pending institutes:', err)
    }
  }

  const fetchPendingCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute-courses/pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingCourses(data)
        setStats(prev => ({ ...prev, pendingCourses: data.length }))
      }
    } catch (err) {
      console.error('Error fetching pending courses:', err)
    }
  }

  const fetchAllCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institutes`)
      if (!response.ok) return

      const instList = await response.json()

      const results = await Promise.all(
        instList.map(async (inst) => {
          try {
            const cr = await fetch(`${API_BASE_URL}/institute/courses/${inst.id}`)
            if (!cr.ok) return []
            const courses = await cr.json()
            return courses.map(c => ({
              ...c,
              institute_name: inst.institute_name,
              institute_id: inst.id
            }))
          } catch (e) {
            return []
          }
        })
      )

      setAllCourses(results.flat())
    } catch (err) {
      console.error('Error fetching all courses:', err)
    }
  }

  const fetchInstituteDetails = async (instituteId) => {
    try {
      setLoadingDetails(true)
      const [coursesRes, batchesRes, enrollmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/institute/courses/${instituteId}`),
        fetch(`${API_BASE_URL}/institute/batches/${instituteId}`),
        fetch(`${API_BASE_URL}/institute/enrollments/${instituteId}`)
      ])

      setInstituteCourses(coursesRes.ok ? await coursesRes.json() : [])
      setInstituteBatches(batchesRes.ok ? await batchesRes.json() : [])
      setInstituteEnrollments(enrollmentsRes.ok ? await enrollmentsRes.json() : [])
    } catch (err) {
      console.error('Error fetching institute details:', err)
      setInstituteCourses([])
      setInstituteBatches([])
      setInstituteEnrollments([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleApproveInstitute = async (id) => {
    if (!window.confirm('Approve this institute? They will be able to post courses and content.')) return
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_rate: 10 })
      })
      if (!response.ok) throw new Error('Failed to approve')
      setSuccess('Institute approved successfully!')
      setTimeout(() => setSuccess(null), 3000)
      fetchAllData()
    } catch (err) {
      setError('Failed to approve institute.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleRejectInstitute = async (id) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason === null) return
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: reason })
      })
      if (!response.ok) throw new Error('Failed to reject')
      setSuccess('Institute rejected.')
      setTimeout(() => setSuccess(null), 3000)
      fetchAllData()
    } catch (err) {
      setError('Failed to reject institute.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleApproveCourse = async (courseId) => {
    if (!window.confirm('Approve this course?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute-course/${courseId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error('Failed to approve course')
      setSuccess('Course approved!')
      setTimeout(() => setSuccess(null), 3000)
      fetchPendingCourses()
      fetchAllCourses()
    } catch (err) {
      setError('Failed to approve course.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleRejectCourse = async (courseId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason === null) return
    try {
      const response = await fetch(`${API_BASE_URL}/admin/institute-course/${courseId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: reason })
      })
      if (!response.ok) throw new Error('Failed to reject course')
      setSuccess('Course rejected.')
      setTimeout(() => setSuccess(null), 3000)
      fetchPendingCourses()
      fetchAllCourses()
    } catch (err) {
      setError('Failed to reject course.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleRowClick = (institute) => {
    setSelectedInstitute(institute)
    setShowDetails(true)
    setActiveTab('details')
    fetchInstituteDetails(institute.id)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedInstitute(null)
    setInstituteCourses([])
    setInstituteBatches([])
    setInstituteEnrollments([])
  }

  const getStatusBadge = (status, isApproved) => {
    if (isApproved) return 'bg-green-100 text-green-700'
    const styles = {
      'pending_approval': 'bg-yellow-100 text-yellow-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'suspended': 'bg-gray-100 text-gray-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading institutes...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Institute Management</h1>
            <p className="text-gray-500">Manage training institutes and partners</p>
          </div>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-blue-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
            <button onClick={() => setSuccess(null)} className="ml-3 text-blue-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-pink-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition"
            onClick={() => setApprovalTab('courses')}
          >
            <p className="text-sm text-gray-500">Pending Courses</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingCourses}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setApprovalTab('pending')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⏳ Pending Approvals
            {pendingInstitutes.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                {pendingInstitutes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setApprovalTab('all')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏫 All Institutes
          </button>
          <button
            onClick={() => setApprovalTab('courses')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Courses
            {pendingCourses.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                {pendingCourses.length}
              </span>
            )}
          </button>
        </div>

        {approvalTab === 'pending' && (
          <div>
            {pendingInstitutes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No pending institute approvals.</p>
                <p className="text-sm text-gray-400 mt-1">All requests have been processed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingInstitutes.map((inst) => (
                  <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-yellow-200 hover:shadow-md transition overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 border-b border-yellow-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Pending Review</span>
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{inst.institute_name}</h3>
                      <p className="text-sm text-gray-500 mb-3">Owner: {inst.name}</p>

                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p className="truncate">📧 {inst.email}</p>
                        <p>📞 {inst.phone || 'N/A'}</p>
                        {inst.city && (
                          <p>📍 {inst.city}{inst.state ? `, ${inst.state}` : ''}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {inst.institute_type && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {inst.institute_type}
                          </span>
                        )}
                        {inst.partnership_type && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {inst.partnership_type}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRowClick(inst)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3 transition"
                      >
                        View Full Details →
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveInstitute(inst.id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectInstitute(inst.id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {approvalTab === 'all' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, institute, city, state..."
                  className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">{filteredInstitutes.length} records</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                {filteredInstitutes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No institutes found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Institute</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Owner</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">City</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Courses</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Students</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInstitutes.map((inst) => (
                        <tr key={inst.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">#{inst.id}</td>
                          <td
                            className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                            onClick={() => handleRowClick(inst)}
                          >
                            {inst.institute_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{inst.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 break-all">{inst.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inst.city || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium capitalize">
                              {inst.institute_type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{inst.total_courses_offered || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{inst.total_students_enrolled || 0}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(inst.status, inst.is_approved)}`}>
                              {inst.is_approved ? 'Approved' : (inst.status || 'N/A')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {inst.is_approved ? (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Approved</span>
                            ) : inst.status === 'rejected' ? (
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">Rejected</span>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveInstitute(inst.id)}
                                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectInstitute(inst.id)}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {approvalTab === 'courses' && (
          <div>
            {pendingCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  ⏳ Pending Course Approvals
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                    {pendingCourses.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{course.title}</h3>
                            <p className="text-sm text-gray-500">By: {course.institute_name}</p>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {course.category && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{course.category}</span>
                          )}
                          {course.level && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{course.level}</span>
                          )}
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">₹{course.price}</span>
                        </div>

                        {course.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {course.created_at ? new Date(course.created_at).toLocaleDateString() : ''}
                        </p>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleApproveCourse(course.id)}
                            className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectCourse(course.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-800 mb-3">📚 All Institute Courses</h2>
            {allCourses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No courses created yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Title</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Institute</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Price</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">#{course.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{course.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.institute_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.category || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-semibold">₹{course.price}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(course.status, course.is_approved)}`}>
                              {course.is_approved ? 'Approved' : (course.status || 'N/A')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showDetails && selectedInstitute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedInstitute.institute_name}
                </h2>
                <p className="text-sm text-gray-500">Owner: {selectedInstitute.name}</p>
              </div>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { key: 'details', label: 'Profile' },
                  { key: 'courses', label: `Courses (${instituteCourses.length})` },
                  { key: 'batches', label: `Batches (${instituteBatches.length})` },
                  { key: 'students', label: `Students (${instituteEnrollments.length})` }
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === t.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading details...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Institute Name</label>
                          <p className="text-lg font-semibold text-gray-900">{selectedInstitute.institute_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Institute Type</label>
                          <p className="text-lg text-gray-900 capitalize">{selectedInstitute.institute_type || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Owner Name</label>
                          <p className="text-lg text-gray-900">{selectedInstitute.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-lg text-gray-900 break-all">{selectedInstitute.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-lg text-gray-900">{selectedInstitute.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Website</label>
                          <p className="text-lg text-gray-900 break-all">{selectedInstitute.website || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-lg text-gray-900">
                          {selectedInstitute.address || 'N/A'}
                          {selectedInstitute.city && `, ${selectedInstitute.city}`}
                          {selectedInstitute.state && `, ${selectedInstitute.state}`}
                          {selectedInstitute.pincode && ` - ${selectedInstitute.pincode}`}
                        </p>
                      </div>

                      {selectedInstitute.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Description</label>
                          <p className="text-gray-900">{selectedInstitute.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Person</label>
                          <p className="text-gray-900">{selectedInstitute.contact_person_name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Designation</label>
                          <p className="text-gray-900">{selectedInstitute.contact_person_designation || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                          <p className="text-gray-900">{selectedInstitute.contact_person_phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Partnership Type</label>
                          <p className="text-gray-900 capitalize">{selectedInstitute.partnership_type || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Registration No.</label>
                          <p className="text-gray-900">{selectedInstitute.registration_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">GST Number</label>
                          <p className="text-gray-900">{selectedInstitute.gst_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">PAN Number</label>
                          <p className="text-gray-900">{selectedInstitute.pan_number || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Commission Rate</label>
                          <p className="text-gray-900">{selectedInstitute.commission_rate || 'N/A'}%</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Referral Code</label>
                          <p className="text-gray-900 font-mono">{selectedInstitute.referral_code || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedInstitute.status, selectedInstitute.is_approved)}`}>
                            {selectedInstitute.is_approved ? 'Approved' : (selectedInstitute.status || 'Pending')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'courses' && (
                    <div>
                      {instituteCourses.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No courses created yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {instituteCourses.map((c) => (
                            <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-800 flex-1">{c.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(c.status, c.is_approved)}`}>
                                  {c.is_approved ? 'Approved' : (c.status || 'Pending')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{c.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">₹{c.price}</span>
                                {c.category && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{c.category}</span>}
                                {c.level && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{c.level}</span>}
                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">👥 {c.enrollment_count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'batches' && (
                    <div>
                      {instituteBatches.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No batches created yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {instituteBatches.map((b) => (
                            <div key={b.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{b.batch_name}</h4>
                                  <p className="text-sm text-gray-500 mt-0.5">Course: {b.course_title}</p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  {b.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
                                {b.start_date && <span>📅 {new Date(b.start_date).toLocaleDateString()}</span>}
                                {b.timing && <span>⏰ {b.timing}</span>}
                                {b.days && <span>📆 {b.days}</span>}
                                <span>👥 {b.enrolled_count}/{b.max_students}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'students' && (
                    <div>
                      {instituteEnrollments.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No students enrolled yet.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-sm font-medium text-gray-600">Student</th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-600">Course</th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-600">Progress</th>
                                <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {instituteEnrollments.map((e) => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm">
                                    <p className="font-medium text-gray-900">{e.student_name}</p>
                                    <p className="text-xs text-gray-500">{e.student_email}</p>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{e.course_title}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{e.progress}%</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                      {e.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                {!selectedInstitute.is_approved && selectedInstitute.status !== 'rejected' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveInstitute(selectedInstitute.id)
                        closeDetails()
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                      ✓ Approve Institute
                    </button>
                    <button
                      onClick={() => {
                        handleRejectInstitute(selectedInstitute.id)
                        closeDetails()
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                    >
                      ✕ Reject Institute
                    </button>
                  </>
                )}
                {selectedInstitute.is_approved && (
                  <button
                    onClick={() => {
                      handleRejectInstitute(selectedInstitute.id)
                      closeDetails()
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInstitutes