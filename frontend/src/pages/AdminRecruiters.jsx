import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../config'

function AdminRecruiters({ user, onLogout }) {
  const navigate = useNavigate()
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRecruiters, setFilteredRecruiters] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedRecruiter, setSelectedRecruiter] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  })

  useEffect(() => {
    fetchRecruiters()
  }, [])

  useEffect(() => {
    let filtered = recruiters

    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.phone || '').includes(searchTerm) ||
        (r.id?.toString() || '').includes(searchTerm) ||
        (r.designation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    }

    if (filter === 'approved') {
      filtered = filtered.filter(r => r.is_approved === true)
    } else if (filter === 'pending') {
      filtered = filtered.filter(r => !r.is_approved && r.status === 'pending_approval')
    } else if (filter === 'rejected') {
      filtered = filtered.filter(r => r.status === 'rejected')
    }

    setFilteredRecruiters(filtered)
  }, [searchTerm, recruiters, filter])

  const fetchRecruiters = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(`${API_BASE_URL}/admin/recruiters`)
      const data = response.data

      setRecruiters(data)
      setFilteredRecruiters(data)

      const total = data.length
      const approved = data.filter(r => r.is_approved === true).length
      const pending = data.filter(r => !r.is_approved && r.status === 'pending_approval').length
      const rejected = data.filter(r => r.status === 'rejected').length

      setStats({ total, approved, pending, rejected })
    } catch (err) {
      console.error('Error fetching recruiters:', err)
      setError('Failed to load recruiters data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (recruiterId) => {
    if (!window.confirm('Approve this recruiter?')) return

    try {
      await axios.put(`${API_BASE_URL}/admin/approve-recruiter/${recruiterId}`)
      fetchRecruiters()
    } catch (err) {
      setError('Failed to approve recruiter. Please try again.')
    }
  }

  const handleReject = async (recruiterId) => {
    if (!window.confirm('Reject this recruiter?')) return

    try {
      await axios.put(`${API_BASE_URL}/admin/reject-recruiter/${recruiterId}`)
      fetchRecruiters()
    } catch (err) {
      setError('Failed to reject recruiter. Please try again.')
    }
  }

  const handleViewDetails = (recruiter) => {
    setSelectedRecruiter(recruiter)
    setShowDetails(true)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedRecruiter(null)
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  const getStatusBadge = (recruiter) => {
    if (recruiter.is_approved) {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Approved</span>
    }
    if (recruiter.status === 'rejected') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Rejected</span>
    }
    return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">Pending</span>
  }

  const getActionButton = (recruiter) => {
    if (recruiter.is_approved) {
      return <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Approved</span>
    }
    if (recruiter.status === 'rejected') {
      return <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">Rejected</span>
    }
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleApprove(recruiter.id)}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition"
        >
          Approve
        </button>
        <button
          onClick={() => handleReject(recruiter.id)}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition"
        >
          Reject
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recruiters...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Recruiter Management</h1>
            <p className="text-gray-500">Review, approve, and manage recruiter accounts</p>
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
            <button onClick={fetchRecruiters} className="ml-3 text-blue-600 hover:underline">Retry</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
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
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, company, phone, or ID..."
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Recruiters</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="text-sm text-gray-500">{filteredRecruiters.length} recruiters</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredRecruiters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No recruiters found.</p>
                <p className="text-sm text-gray-400 mt-1">Recruiters will appear here after registration.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Company</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Designation</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecruiters.map((recruiter) => (
                    <tr key={recruiter.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">#{recruiter.id}</td>
                      <td
                        className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() => handleViewDetails(recruiter)}
                      >
                        {recruiter.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">{recruiter.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{recruiter.company_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{recruiter.designation || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(recruiter)}</td>
                      <td className="px-4 py-3 text-sm">{getActionButton(recruiter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRecruiter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Recruiter Details</h2>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedRecruiter.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID</label>
                    <p className="text-lg font-semibold text-gray-900">#{selectedRecruiter.id}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-900">{selectedRecruiter.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg text-gray-900">{selectedRecruiter.phone || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-lg text-gray-900">{selectedRecruiter.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Designation</label>
                    <p className="text-lg text-gray-900">{selectedRecruiter.designation || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Industry</label>
                    <p className="text-lg text-gray-900">{selectedRecruiter.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-lg text-gray-900">{selectedRecruiter.location || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRecruiter)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registered On</label>
                  <p className="text-lg text-gray-900">
                    {selectedRecruiter.created_at ? new Date(selectedRecruiter.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                {!selectedRecruiter.is_approved && selectedRecruiter.status !== 'rejected' && (
                  <>
                    <button
                      onClick={() => { handleApprove(selectedRecruiter.id); closeDetails() }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { handleReject(selectedRecruiter.id); closeDetails() }}
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

export default AdminRecruiters