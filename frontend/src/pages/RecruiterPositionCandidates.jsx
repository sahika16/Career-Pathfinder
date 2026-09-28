import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../config'

function RecruiterPositionCandidates({ user, onLogout }) {
  const { positionId } = useParams()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE_URL}/recruiter/${user.id}/recommendations`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setCandidates(list.filter((c) => String(c.position_id) === String(positionId)))
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [positionId, user.id])

  const updateStatus = async (recId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/recruiter/recommendation/${recId}/status`, { status: newStatus })
      setCandidates((prev) => prev.map((c) => c.id === recId ? { ...c, status: newStatus } : c))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="p-8">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-5xl mx-auto pt-28 px-6 pb-12">
        <button onClick={() => navigate('/recruiter-dashboard')} className="text-gray-500 mb-4">← Back</button>
        <h1 className="text-2xl font-bold mb-6">Recommended Candidates</h1>

        {candidates.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500">
            No candidates recommended for this position yet.
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{c.student_name}</p>
                  <p className="text-sm text-gray-500">{c.student_email}</p>
                  <p className="text-xs text-gray-400 mt-1">Status: {c.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(c.id, 'shortlisted')}
                    className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm">Shortlist</button>
                  <button onClick={() => updateStatus(c.id, 'interview')}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">Interview</button>
                  <button onClick={() => updateStatus(c.id, 'selected')}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm">Select</button>
                  <button onClick={() => updateStatus(c.id, 'on_hold')}
                    className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm">Hold</button>
                  <button onClick={() => updateStatus(c.id, 'rejected')}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecruiterPositionCandidates