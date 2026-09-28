import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../../config'

function RecruiterDashboard({ user, onLogout }) {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    activePositions: 0,
    profilesReceived: 0,
    newProfiles: 0,
    shortlisted: 0,
    interviews: 0,
    selected: 0,
    onHold: 0,
    rejected: 0,
  })

  const [positions, setPositions] = useState([])           // positions with candidate counts
  const [recommendations, setRecommendations] = useState([]) // flat list of recs
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  const recruiterId = user?.id || user?.recruiter_id

  useEffect(() => {
    if (recruiterId) {
      fetchDashboardData()
    } else {
      setError('Not logged in as recruiter')
      setLoading(false)
    }
  }, [recruiterId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsRes, positionsRes, recsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/recruiter/${recruiterId}/stats`).catch(() => ({ data: {} })),
        axios.get(`${API_BASE_URL}/recruiter/${recruiterId}/positions`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/recruiter/${recruiterId}/recommendations`).catch(() => ({ data: [] })),
      ])

      const rawStats = statsRes.data || {}
      setStats({
        activePositions: rawStats.activePositions ?? 0,
        profilesReceived: rawStats.profilesReceived ?? 0,
        newProfiles: rawStats.newProfiles ?? 0,
        shortlisted: rawStats.shortlisted ?? 0,
        interviews: rawStats.interviews ?? 0,
        selected: rawStats.selected ?? 0,
        onHold: rawStats.onHold ?? 0,
        rejected: rawStats.rejected ?? 0,
      })

      setPositions(Array.isArray(positionsRes.data) ? positionsRes.data : [])
      setRecommendations(Array.isArray(recsRes.data) ? recsRes.data : [])
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
      setError('Failed to load dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Derived data ----------

  // Group recommendations by position
  const recommendationsByPosition = React.useMemo(() => {
    const map = new Map()
    recommendations.forEach((rec) => {
      const key = rec.position_id
      if (!map.has(key)) {
        map.set(key, {
          position_id: rec.position_id,
          position_title: rec.position_title || 'Untitled Position',
          candidates: [],
          latest_sent_at: rec.sent_at,
        })
      }
      const group = map.get(key)
      group.candidates.push(rec)
      // Track most recent
      if (rec.sent_at && (!group.latest_sent_at || new Date(rec.sent_at) > new Date(group.latest_sent_at))) {
        group.latest_sent_at = rec.sent_at
      }
    })
    return Array.from(map.values())
  }, [recommendations])

  // New recommendations (for bell)
  const newProfilesCount = recommendations.filter((r) => r.status === 'sent').length

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()

    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    if (sameDay) return `Today, ${time}`

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate()

    if (isYesterday) return `Yesterday, ${time}`

    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${time}`
  }

  const statusColor = (status) => {
    const map = {
      sent: 'bg-blue-100 text-blue-700',
      viewed: 'bg-indigo-100 text-indigo-700',
      shortlisted: 'bg-yellow-100 text-yellow-700',
      interview: 'bg-purple-100 text-purple-700',
      selected: 'bg-green-100 text-green-700',
      offered: 'bg-emerald-100 text-emerald-700',
      joined: 'bg-green-200 text-green-800',
      rejected: 'bg-red-100 text-red-700',
      on_hold: 'bg-orange-100 text-orange-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const prettyStatus = (status) => {
    const map = {
      sent: 'New',
      viewed: 'Reviewed',
      shortlisted: 'Shortlisted',
      interview: 'Interview',
      selected: 'Selected',
      offered: 'Offered',
      joined: 'Joined',
      rejected: 'Rejected',
      on_hold: 'On Hold',
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Recruiter'}
            </h1>
            <p className="text-gray-500">
              {user?.company_name ? `${user.company_name} · ` : ''}Track your hiring pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                title="Notifications"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {newProfilesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {newProfilesCount > 9 ? '9+' : newProfilesCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-sm">
                    Notifications
                  </div>
                  {newProfilesCount > 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-700">
                      🔔 <strong>{newProfilesCount}</strong> new candidate profile{newProfilesCount > 1 ? 's' : ''} received
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      No new notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/recruiter/create-position')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              <span className="text-lg leading-none">+</span>
              Create Position
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={fetchDashboardData} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* ============ STAT CARDS ============ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Open Positions" value={stats.activePositions} color="blue" />
          <StatCard label="Profiles Received" value={stats.profilesReceived} color="indigo" />
          <StatCard label="New Profiles" value={stats.newProfiles} color="cyan" highlight />
          <StatCard label="Shortlisted" value={stats.shortlisted} color="yellow" />
          <StatCard label="Interviews" value={stats.interviews} color="purple" />
          <StatCard label="Selected" value={stats.selected} color="green" />
        </div>

        {/* Secondary row — pipeline terminal states */}
        {(stats.onHold > 0 || stats.rejected > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="On Hold" value={stats.onHold} color="orange" compact />
            <StatCard label="Rejected" value={stats.rejected} color="red" compact />
          </div>
        )}

        {/* ============ RECOMMENDED CANDIDATES BY POSITION ============ */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recommended Candidates</h2>
              <p className="text-sm text-gray-500">
                Candidates recommended by our placement team for your open positions
              </p>
            </div>
            {recommendations.length > 0 && (
              <button
                onClick={() => navigate('/recruiter/recommendations')}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                View All →
              </button>
            )}
          </div>

          {recommendationsByPosition.length === 0 ? (
            /* ============ EMPTY STATE ============ */
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No candidates recommended yet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Create a position and tell us what you're looking for. Our placement team
                will review suitable candidates and send recommended profiles here.
              </p>
              <button
                onClick={() => navigate('/recruiter/create-position')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                <span className="text-lg leading-none">+</span>
                Create Position
              </button>
            </div>
          ) : (
            /* ============ POSITION GROUPS ============ */
            <div className="space-y-4">
              {recommendationsByPosition.map((group) => {
                const pos = positions.find((p) => p.id === group.position_id)
                const total = group.candidates.length
                const newCount = group.candidates.filter((c) => c.status === 'sent').length
                const shortlisted = group.candidates.filter((c) => c.status === 'shortlisted').length
                const interviews = group.candidates.filter((c) => c.status === 'interview').length

                return (
                  <div
                    key={group.position_id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">
                            {group.position_title}
                          </h3>
                          {newCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              {newCount} new
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {pos?.location && `${pos.location} · `}
                          {pos?.vacancies ? `${pos.vacancies} vacancies · ` : ''}
                          <strong>{total}</strong> candidate{total > 1 ? 's' : ''} recommended
                        </p>

                        {/* Mini pipeline summary */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          {shortlisted > 0 && (
                            <span className="text-yellow-700">
                              ⭐ {shortlisted} shortlisted
                            </span>
                          )}
                          {interviews > 0 && (
                            <span className="text-purple-700">
                              🎤 {interviews} in interview
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Last updated: {formatDate(group.latest_sent_at)}
                        </p>
                      </div>

                      <button
                        onClick={() => navigate(`/recruiter/position/${group.position_id}/candidates`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm whitespace-nowrap"
                      >
                        View Candidates
                        <span>→</span>
                      </button>
                    </div>

                    {/* Preview: first 3 candidates as compact chips */}
                    {group.candidates.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                        {group.candidates.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs"
                          >
                            <span className="font-medium text-gray-800">
                              {c.student_name || 'Candidate'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                              {prettyStatus(c.status)}
                            </span>
                          </div>
                        ))}
                        {group.candidates.length > 3 && (
                          <div className="flex items-center px-3 py-1.5 text-xs text-gray-500">
                            +{group.candidates.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ============ YOUR OPEN POSITIONS ============ */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Open Positions</h2>
            {positions.length > 0 && (
              <button
                onClick={() => navigate('/recruiter/positions')}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Manage All →
              </button>
            )}
          </div>

          {positions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
              You haven't created any positions yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Position</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Location</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Vacancies</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Candidates</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.location || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.vacancies || 1}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                            {p.candidate_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === 'open' ? 'bg-green-100 text-green-700' :
                            p.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status || 'open'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => navigate(`/recruiter/position/${p.id}/candidates`)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Small reusable card ----------
function StatCard({ label, value, color = 'blue', highlight = false, compact = false }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  }
  const classes = colorMap[color] || colorMap.blue

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 ${
        highlight ? 'border-cyan-300 ring-1 ring-cyan-100' : 'border-gray-200'
      } ${compact ? 'py-3' : ''}`}
    >
      <p className={`text-xs mb-1 ${compact ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
      <p className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} ${classes.split(' ')[0]}`}>
        {value}
      </p>
    </div>
  )
}

export default RecruiterDashboard