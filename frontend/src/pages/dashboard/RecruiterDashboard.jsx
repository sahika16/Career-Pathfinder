import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../../config'

function RecruiterDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    activePositions: 0, profilesReceived: 0, newProfiles: 0,
    shortlisted: 0, interviews: 0, selected: 0
  })
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRec, setSelectedRec] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null)
      const [sRes, rRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/recruiter/${user.id}/stats`),
        axios.get(`${API_BASE_URL}/recruiter/${user.id}/recommendations`)
      ])
      setStats(sRes.data)
      setRecommendations(rRes.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const viewProfile = async (recId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/recommendation/${recId}`)
      setSelectedRec(res.data)
      setShowProfile(true)
      await axios.put(`${API_BASE_URL}/recruiter/recommendation/${recId}/viewed`)
      fetchAll()
    } catch (err) {
      alert('Failed to load profile')
    }
  }

  const updateStatus = async (recId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/recruiter/recommendation/${recId}/status`, { status: newStatus })
      fetchAll()
      if (showProfile) setShowProfile(false)
      alert(`Marked as ${newStatus}`)
    } catch (err) {
      alert('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto pt-28 px-6 pb-12">
        {/* Header with single CTA */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.company_name || user?.name}
            </h1>
            <p className="text-gray-500">Hiring activity overview</p>
          </div>
          <button
            onClick={() => navigate('/recruiter/positions')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm"
          >
            + Create Position
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Simple stats — one row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Positions', value: stats.activePositions, color: 'text-blue-600' },
            { label: 'Received', value: stats.profilesReceived, color: 'text-purple-600' },
            { label: 'New', value: stats.newProfiles, color: 'text-orange-600' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-yellow-600' },
            { label: 'Interviews', value: stats.interviews, color: 'text-indigo-600' },
            { label: 'Selected', value: stats.selected, color: 'text-green-600' }
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color} mt-1`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Recommended Candidates — the only section below */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Recommended Candidates</h2>
              <p className="text-sm text-gray-500">Curated by admin for your open positions</p>
            </div>
            {recommendations.length > 0 && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {recommendations.length} total
              </span>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No candidates yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Create a position and our admin team will send you matching candidates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map(rec => (
                    <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{rec.student_name}</p>
                        <p className="text-xs text-gray-500">{rec.student_email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.position_title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          rec.status === 'viewed' ? 'bg-gray-100 text-gray-700' :
                          rec.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-700' :
                          rec.status === 'interview' ? 'bg-purple-100 text-purple-700' :
                          rec.status === 'selected' ? 'bg-green-100 text-green-700' :
                          rec.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{rec.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewProfile(rec.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && selectedRec && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedRec.student_name}</h2>
                <p className="text-sm text-gray-500">For: {selectedRec.position_title}</p>
              </div>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Location', value: selectedRec.location },
                  { label: 'Education', value: selectedRec.education },
                  { label: 'Graduation', value: selectedRec.graduation_year },
                  { label: 'Experience', value: selectedRec.experience || 'Fresher' }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium">{item.value || '—'}</p>
                  </div>
                ))}
              </div>

              {selectedRec.admin_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Admin Recommendation</p>
                  <p className="text-sm text-blue-700">{selectedRec.admin_notes}</p>
                </div>
              )}

              {selectedRec.skills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRec.skills.map((s, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {s.skill_name} — {s.rating}/10
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => updateStatus(selectedRec.id, 'shortlisted')} className="bg-yellow-500 text-white px-5 py-2.5 rounded-lg hover:bg-yellow-600 font-medium">Shortlist</button>
                <button onClick={() => updateStatus(selectedRec.id, 'interview')} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium">Interview</button>
                <button onClick={() => updateStatus(selectedRec.id, 'rejected')} className="bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 font-medium">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecruiterDashboard