import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../config'

function AdminRecommendations({ user, onLogout }) {
  const navigate = useNavigate()
  const { positionId } = useParams()
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [success, setSuccess] = useState(null)
  const [pipeline, setPipeline] = useState(null)

  useEffect(() => {
    fetchCandidates()
    fetchPipeline()
  }, [positionId])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/admin/position/${positionId}/matching-students`)
      setCandidates(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPipeline = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/pipeline/${positionId}`)
      setPipeline(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selected.length === candidates.length) {
      setSelected([])
    } else {
      setSelected(candidates.filter(c => !c.already_recommended).map(c => c.id))
    }
  }

  const sendProfiles = async () => {
    if (selected.length === 0) { alert('Select at least one candidate'); return }
    if (!window.confirm(`Send ${selected.length} profile(s) to recruiter?`)) return

    try {
      setSending(true)
      const res = await axios.post(`${API_BASE_URL}/admin/send-profiles`, {
        position_id: parseInt(positionId),
        student_ids: selected,
        admin_notes: adminNotes || null
      })
      setSuccess(`Sent ${res.data.sent} profile(s). Skipped ${res.data.skipped}.`)
      setSelected([])
      setAdminNotes('')
      fetchCandidates()
      fetchPipeline()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      alert('Failed to send profiles')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recommend Candidates</h1>
            <p className="text-gray-500">Select matching students to send to the recruiter</p>
          </div>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            ← Back
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}

        {/* Pipeline */}
        {pipeline && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Pipeline: {pipeline.position_title}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Recommended', value: pipeline.total_recommended, color: 'blue' },
                { label: 'Viewed', value: pipeline.viewed, color: 'gray' },
                { label: 'Shortlisted', value: pipeline.shortlisted, color: 'yellow' },
                { label: 'Interview', value: pipeline.interview, color: 'purple' },
                { label: 'Selected', value: pipeline.selected, color: 'green' },
                { label: 'Joined', value: pipeline.joined, color: 'emerald' }
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send panel */}
        {selected.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <p className="font-semibold text-green-800 mb-3">
              {selected.length} candidate(s) selected
            </p>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Admin recommendation notes (visible to recruiter)..."
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-3"
              rows="2"
            />
            <button
              onClick={sendProfiles}
              disabled={sending}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              {sending ? 'Sending...' : `Send ${selected.length} Profiles to Recruiter`}
            </button>
          </div>
        )}

        {/* Candidates table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No candidates found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.length > 0 && selected.length === candidates.filter(c => !c.already_recommended).length}
                        onChange={toggleAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Education</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Match</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Avg Score</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} className={`border-b border-gray-100 hover:bg-gray-50 ${c.already_recommended ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggle(c.id)}
                          disabled={c.already_recommended}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.education || '—'}
                        {c.graduation_year && <span className="text-xs text-gray-400 block">{c.graduation_year}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {c.skills?.slice(0, 3).map((s, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{s}</span>
                          ))}
                          {c.skills?.length > 3 && <span className="text-xs text-gray-400">+{c.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-bold ${
                          c.match_score >= 70 ? 'text-green-600' :
                          c.match_score >= 40 ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>{c.match_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-bold ${
                          c.avg_test_score >= 70 ? 'text-green-600' :
                          c.avg_test_score >= 50 ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>{c.avg_test_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {c.already_recommended ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">Already sent</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">New</span>
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

export default AdminRecommendations