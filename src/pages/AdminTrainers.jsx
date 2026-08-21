import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function AdminTrainers({ user, onLogout }) {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0
  })

  useEffect(() => {
    fetchTrainers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = trainers.filter(t => 
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.phone || '').includes(searchTerm) ||
        (t.id?.toString() || '').includes(searchTerm) ||
        (t.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
      
      const response = await fetch('http://localhost:8000/api/admin/trainers')
      
      if (!response.ok) {
        throw new Error('Failed to fetch trainers')
      }
      
      const data = await response.json()
      console.log('📊 Trainers data received:', data)
      
      setTrainers(data)
      setFilteredTrainers(data)
      
      // Calculate stats
      const total = data.length
      const approved = data.filter(t => t.is_approved === true).length
      const pending = data.filter(t => t.is_approved === false && t.status === 'pending_approval').length
      
      setStats({ total, approved, pending })
      
      console.log('📊 Stats calculated:', { total, approved, pending })
    } catch (err) {
      console.error('Error fetching trainers:', err)
      setError('Failed to load trainers data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (trainerId) => {
    if (!window.confirm('Are you sure you want to approve this trainer?')) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/approve-trainer/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve trainer')
      }
      
      const result = await response.json()
      console.log('✅ Trainer approved:', result)
      alert('Trainer approved successfully!')
      fetchTrainers() // Refresh the list
    } catch (err) {
      console.error('Error approving trainer:', err)
      alert('Failed to approve trainer. Please try again.')
    }
  }

  const handleReject = async (trainerId) => {
    if (!window.confirm('Are you sure you want to reject this trainer?')) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reject-trainer/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject trainer')
      }
      
      const result = await response.json()
      console.log('❌ Trainer rejected:', result)
      alert('Trainer rejected!')
      fetchTrainers() // Refresh the list
    } catch (err) {
      console.error('Error rejecting trainer:', err)
      alert('Failed to reject trainer. Please try again.')
    }
  }

  const handleNameClick = (trainer) => {
    setSelectedTrainer(trainer)
    setShowDetails(true)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedTrainer(null)
  }

  const handleBack = () => {
    navigate('/admin-dashboard')
  }

  const getStatusBadge = (trainer) => {
    if (trainer.is_approved) {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Approved</span>
    } else if (trainer.status === 'rejected') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Rejected</span>
    } else {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">Pending</span>
    }
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Trainers</p>
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
        </div>

        {/* Search */}
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

        {/* Trainers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTrainers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No trainers found.</p>
                <p className="text-sm text-gray-400 mt-1">Trainers will appear here after registration.</p>
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
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Approve</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Reject</th>
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
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          {trainer.specialty || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(trainer)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!trainer.is_approved && trainer.status !== 'rejected' ? (
                          <button
                            onClick={() => handleApprove(trainer.id)}
                            className="w-20 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!trainer.is_approved && trainer.status !== 'rejected' ? (
                          <button
                            onClick={() => handleReject(trainer.id)}
                            className="w-20 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition"
                          >
                            Reject
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
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

      {/* Trainer Details Modal */}
      {showDetails && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Trainer Details
              </h2>
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
                  <div className="mt-1">{getStatusBadge(selectedTrainer)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registered On</label>
                  <p className="text-lg text-gray-900">
                    {selectedTrainer.created_at ? new Date(selectedTrainer.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

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