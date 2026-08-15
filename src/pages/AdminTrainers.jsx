import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAllResumes, updateResumeStatus } from '../utils/api'

function AdminTrainers({ user, onLogout }) {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTrainers, setFilteredTrainers] = useState([])

  useEffect(() => {
    fetchTrainers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = trainers.filter(t => 
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.phone || '').includes(searchTerm) ||
        (t.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.id?.toString() || '').includes(searchTerm)
      )
      setFilteredTrainers(filtered)
    } else {
      setFilteredTrainers(trainers)
    }
  }, [searchTerm, trainers])

  const fetchTrainers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllResumes()
      const trainerList = data.filter(t => t.role === 'trainer')
      setTrainers(trainerList)
      setFilteredTrainers(trainerList)
    } catch (err) {
      console.error('Error fetching trainers:', err)
      setError('Failed to load trainers data.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (trainerId) => {
    try {
      await updateResumeStatus(trainerId, { is_approved: true, status: 'approved' })
      alert('Trainer approved successfully!')
      fetchTrainers()
    } catch (err) {
      alert('Failed to approve trainer.')
    }
  }

  const handleReject = async (trainerId) => {
    if (window.confirm('Are you sure you want to reject this trainer?')) {
      try {
        await updateResumeStatus(trainerId, { is_approved: false, status: 'rejected' })
        alert('Trainer rejected.')
        fetchTrainers()
      } catch (err) {
        alert('Failed to reject trainer.')
      }
    }
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  const formatPhone = (phone) => {
    if (!phone) return 'N/A'
    let cleaned = phone.replace('+91', '').trim()
    cleaned = cleaned.replace(/\s/g, '')
    return cleaned || 'N/A'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading trainers...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
            <p className="text-gray-500">View and manage all trainers</p>
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
            <button onClick={fetchTrainers} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Trainers</p>
            <p className="text-2xl font-bold text-blue-600">{trainers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {trainers.filter(t => t.is_approved).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {trainers.filter(t => !t.is_approved && t.status !== 'rejected').length}
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
              placeholder="Search by name, email, phone, ID, or specialty..."
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">
              {filteredTrainers.length} trainers found
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTrainers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No trainers found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Specialty</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainers.map((trainer) => (
                    <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">#{trainer.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{trainer.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">{trainer.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatPhone(trainer.phone)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{trainer.specialty || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          trainer.is_approved ? 'bg-green-100 text-green-700' :
                          trainer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {trainer.is_approved ? 'Approved' :
                           trainer.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!trainer.is_approved && trainer.status !== 'rejected' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(trainer.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(trainer.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTrainers