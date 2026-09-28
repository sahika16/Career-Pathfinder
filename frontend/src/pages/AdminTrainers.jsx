import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import API_BASE_URL from '../config'

function AdminTrainers({ user, onLogout }) {
  const navigate = useNavigate()

  const [trainers, setTrainers] = useState([])
  const [trainersLoaded, setTrainersLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [trainerContent, setTrainerContent] = useState([])
  const [trainerSessions, setTrainerSessions] = useState([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const [pendingContent, setPendingContent] = useState([])
  const [pendingCourses, setPendingCourses] = useState([])
  const [allContent, setAllContent] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [approvalTab, setApprovalTab] = useState('trainers')

  const [stats, setStats] = useState({
    trainers: 0,
    approved: 0,
    pending: 0,
    regular: 0,
    personalized: 0,
    pendingContent: 0,
    pendingCourses: 0
  })

  useEffect(() => {
    setLoading(false)
    fetchAllData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = trainers.filter(t =>
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.phone || '').includes(searchTerm) ||
        (t.id?.toString() || '').includes(searchTerm) ||
        (t.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      setFilteredTrainers(filtered)
    } else {
      setFilteredTrainers(trainers)
    }
  }, [searchTerm, trainers])

  const fetchAllData = async () => {
    setError(null)
    fetchTrainers()
    fetchPendingContent()
    fetchPendingCourses()
    fetchAllContent()
    fetchAllCourses()
  }

  const fetchTrainers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/trainers`)
      if (!response.ok) throw new Error('Failed to fetch trainers')

      const data = await response.json()
      setTrainers(data)
      setFilteredTrainers(data)
      setTrainersLoaded(true)

      const trainersOnly = data.filter(t => t.role === 'trainer')
      const totalTrainers = trainersOnly.length
      const approved = trainersOnly.filter(t => t.is_approved === true).length
      const pending = trainersOnly.filter(t => t.is_approved === false && t.status === 'pending_approval').length
      const regular = trainersOnly.filter(t => t.category === 'regular').length
      const personalized = trainersOnly.filter(t => t.category === 'personalized').length

      setStats(prev => ({
        ...prev,
        trainers: totalTrainers,
        approved,
        pending,
        regular,
        personalized
      }))
    } catch (err) {
      console.error('Error fetching trainers:', err)
      setTrainersLoaded(true)
    }
  }

  const fetchPendingContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/content/pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingContent(data)
        setStats(prev => ({ ...prev, pendingContent: data.length }))
      }
    } catch (err) {
      console.error('Error fetching pending content:', err)
    }
  }

  const fetchPendingCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses/pending`)
      if (response.ok) {
        const data = await response.json()
        setPendingCourses(data)
        setStats(prev => ({ ...prev, pendingCourses: data.length }))
      }
    } catch (err) {
      console.error('Error fetching pending courses:', err)
    }
  }

  const fetchAllContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/content/all`)
      if (response.ok) {
        const data = await response.json()
        setAllContent(data)
      }
    } catch (err) {
      console.error('Error fetching all content:', err)
    }
  }

  const fetchAllCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses/all`)
      if (response.ok) {
        const data = await response.json()
        setAllCourses(data)
      }
    } catch (err) {
      console.error('Error fetching all courses:', err)
    }
  }

  const fetchTrainerContent = async (trainerId) => {
    try {
      setLoadingContent(true)
      const response = await fetch(`${API_BASE_URL}/member/contents/${trainerId}`)
      if (response.ok) {
        const data = await response.json()
        setTrainerContent(data)
      } else {
        setTrainerContent([])
      }
    } catch (err) {
      setTrainerContent([])
    } finally {
      setLoadingContent(false)
    }
  }

  const fetchTrainerSessions = async (trainerId) => {
    try {
      setLoadingContent(true)
      const response = await fetch(`${API_BASE_URL}/trainer/sessions/${trainerId}`)
      if (response.ok) {
        const data = await response.json()
        setTrainerSessions(data)
      } else {
        setTrainerSessions([])
      }
    } catch (err) {
      setTrainerSessions([])
    } finally {
      setLoadingContent(false)
    }
  }

  const handleApprove = async (trainerId) => {
    if (!window.confirm('Approve this trainer?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-trainer/${trainerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to approve trainer')

      await response.json()
      fetchTrainers()
    } catch (err) {
      setError('Failed to approve trainer. Please try again.')
    }
  }

  const handleReject = async (trainerId) => {
    if (!window.confirm('Reject this trainer?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reject-trainer/${trainerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to reject trainer')

      await response.json()
      fetchTrainers()
    } catch (err) {
      setError('Failed to reject trainer. Please try again.')
    }
  }

  const handleApproveContent = async (contentId) => {
    if (!window.confirm('Approve this content?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/content/${contentId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to approve content')

      await response.json()
      fetchPendingContent()
      fetchAllContent()
    } catch (err) {
      setError('Failed to approve content. Please try again.')
    }
  }

  const handleRejectContent = async (contentId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason === null) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/content/${contentId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: reason })
      })

      if (!response.ok) throw new Error('Failed to reject content')

      await response.json()
      fetchPendingContent()
      fetchAllContent()
    } catch (err) {
      setError('Failed to reject content. Please try again.')
    }
  }

  const handleApproveCourse = async (courseId) => {
    if (!window.confirm('Approve this course?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to approve course')

      await response.json()
      fetchPendingCourses()
      fetchAllCourses()
    } catch (err) {
      setError('Failed to approve course. Please try again.')
    }
  }

  const handleRejectCourse = async (courseId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason === null) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: reason })
      })

      if (!response.ok) throw new Error('Failed to reject course')

      await response.json()
      fetchPendingCourses()
      fetchAllCourses()
    } catch (err) {
      setError('Failed to reject course. Please try again.')
    }
  }

  const handleNameClick = (trainer) => {
    setSelectedTrainer(trainer)
    setShowDetails(true)
    setActiveTab('details')
    fetchTrainerContent(trainer.id)
    fetchTrainerSessions(trainer.id)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedTrainer(null)
    setTrainerContent([])
    setTrainerSessions([])
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  const getRoleBadge = (role) => {
    if (role === 'member') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">Member</span>
    } else if (role === 'trainer') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">Trainer</span>
    } else {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">N/A</span>
    }
  }

  const getCategoryBadge = (category) => {
    if (category === 'regular') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Regular</span>
    } else if (category === 'personalized') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-700 font-medium">Personalized</span>
    } else {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">N/A</span>
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const getActionButton = (trainer) => {
    if (trainer.is_approved) {
      return <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Approved</span>
    } else if (trainer.status === 'rejected') {
      return <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">Rejected</span>
    } else {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(trainer.id)}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition"
          >
            Approve
          </button>
          <button
            onClick={() => handleReject(trainer.id)}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition"
          >
            Reject
          </button>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
            <p className="text-gray-500">Manage trainers, content, and courses</p>
          </div>
          <button
            onClick={handleBack}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Trainers</p>
            <p className="text-2xl font-bold text-purple-600">
              {trainersLoaded ? stats.trainers : '...'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {trainersLoaded ? stats.approved : '...'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending Trainers</p>
            <p className="text-2xl font-bold text-yellow-600">
              {trainersLoaded ? stats.pending : '...'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition"
               onClick={() => setApprovalTab('content')}>
            <p className="text-sm text-gray-500">Pending Content</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingContent}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition"
               onClick={() => setApprovalTab('courses')}>
            <p className="text-sm text-gray-500">Pending Courses</p>
            <p className="text-2xl font-bold text-red-600">{stats.pendingCourses}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setApprovalTab('trainers')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'trainers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👨‍🏫 Trainers
          </button>
          <button
            onClick={() => setApprovalTab('content')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Content {pendingContent.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                {pendingContent.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setApprovalTab('courses')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              approvalTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Courses {pendingCourses.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                {pendingCourses.length}
              </span>
            )}
          </button>
        </div>

        {approvalTab === 'trainers' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, phone, ID, role, category, or specialty..."
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">
                  {filteredTrainers.length} records found
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                {!trainersLoaded ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-3">Loading trainers...</p>
                  </div>
                ) : filteredTrainers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No trainers found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Specialty</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrainers.map((trainer) => (
                        <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">#{trainer.id}</td>
                          <td
                            className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                            onClick={() => handleNameClick(trainer)}
                          >
                            {trainer.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 break-all">{trainer.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{trainer.phone || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">{getRoleBadge(trainer.role)}</td>
                          <td className="px-4 py-3 text-sm">{getCategoryBadge(trainer.category)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                              {trainer.specialty || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{getActionButton(trainer)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {approvalTab === 'content' && (
          <div>
            {pendingContent.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  ⏳ Pending Approval
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                    {pendingContent.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingContent.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.title}</h3>
                            <p className="text-sm text-gray-500">By: {item.trainer_name}</p>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {item.content_type}
                          </span>
                          {item.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                              item.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.difficulty}
                            </span>
                          )}
                          {item.skill_name && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {item.skill_name}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleApproveContent(item.id)}
                            className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectContent(item.id)}
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

            <h2 className="text-lg font-semibold text-gray-800 mb-3">📄 All Content</h2>
            {allContent.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No content uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allContent.map((item) => (
                  <div key={item.id} className={`bg-white rounded-xl shadow-sm border ${
                    item.status === 'approved' ? 'border-green-200' :
                    item.status === 'rejected' ? 'border-red-200' :
                    'border-yellow-200'
                  } hover:shadow-md transition overflow-hidden`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.title}</h3>
                          <p className="text-sm text-gray-500">By: {item.trainer_name}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {item.content_type}
                        </span>
                        {item.difficulty && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            item.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {approvalTab === 'courses' && (
          <div>
            {pendingCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  ⏳ Pending Approval
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                    {pendingCourses.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-red-200 hover:shadow-md transition overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{course.title}</h3>
                            <p className="text-sm text-gray-500">By: {course.trainer_name}</p>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {course.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                              course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {course.level}
                            </span>
                          )}
                          {course.category && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {course.category}
                            </span>
                          )}
                          {course.price > 0 ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              ₹{course.price}
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Free
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            ⏱️ {course.duration_minutes} min
                          </span>
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

            <h2 className="text-lg font-semibold text-gray-800 mb-3">📚 All Courses</h2>
            {allCourses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No courses created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCourses.map((course) => (
                  <div key={course.id} className={`bg-white rounded-xl shadow-sm border ${
                    course.status === 'approved' ? 'border-green-200' :
                    course.status === 'rejected' ? 'border-red-200' :
                    'border-yellow-200'
                  } hover:shadow-md transition overflow-hidden`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{course.title}</h3>
                          <p className="text-sm text-gray-500">By: {course.trainer_name}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(course.status)}`}>
                          {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {course.level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                            course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {course.level}
                          </span>
                        )}
                        {course.category && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {course.category}
                          </span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          👥 {course.enrolled_count || 0}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {course.created_at ? new Date(course.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showDetails && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Trainer Details - {selectedTrainer.name}
              </h2>
              <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'content' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Content ({trainerContent.length})
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sessions ({trainerSessions.length})
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedTrainer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID</label>
                      <p className="text-lg font-semibold text-gray-900">#{selectedTrainer.id}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg text-gray-900">{selectedTrainer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg text-gray-900">{selectedTrainer.phone || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="mt-1">{getRoleBadge(selectedTrainer.role)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <div className="mt-1">{getCategoryBadge(selectedTrainer.category)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Specialty</label>
                    <p className="text-lg text-gray-900">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                        {selectedTrainer.specialty || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Education</label>
                    <p className="text-lg text-gray-900">{selectedTrainer.education || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Experience</label>
                    <p className="text-lg text-gray-900">{selectedTrainer.experience || 'N/A'} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      {selectedTrainer.is_approved ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Approved</span>
                      ) : selectedTrainer.status === 'rejected' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Rejected</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div>
                  {loadingContent ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading content...</p>
                    </div>
                  ) : trainerContent.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No content uploaded by this trainer.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trainerContent.map((content) => (
                        <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {content.content_type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(content.status)}`}>
                                {content.status || 'pending'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {content.created_at ? new Date(content.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800 text-sm mt-2">{content.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{content.description}</p>
                          {content.content_url && (
                            <a
                              href={content.content_url}
                              target="_blank"
                              rel="noopener"
                              className="text-blue-600 hover:underline text-xs mt-2 inline-block"
                            >
                              View Content →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  {loadingContent ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading sessions...</p>
                    </div>
                  ) : trainerSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No sessions scheduled by this trainer.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainerSessions.map((session) => (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-gray-800 text-sm">{session.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                  session.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                  session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {session.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                                <span>📅 {session.session_date ? new Date(session.session_date).toLocaleDateString() : 'N/A'}</span>
                                <span>⏱️ {session.duration_minutes || 0} min</span>
                                <span>👥 {session.enrolled_count || 0}/{session.max_students || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                {!selectedTrainer.is_approved && selectedTrainer.status !== 'rejected' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedTrainer.id)
                        closeDetails()
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedTrainer.id)
                        closeDetails()
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTrainers