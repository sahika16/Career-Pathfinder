import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getAllResumes } from '../../utils/api'
import API_BASE_URL from '../../config'

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    students: 0,
    trainers: 0,
    institutes: 0,
    recruiters: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    // Fire ALL requests at the same time (parallel), not one after another
    const [resumesRes, trainersRes, institutesRes, recruitersRes] =
      await Promise.allSettled([
        getAllResumes(),
        fetch(`${API_BASE_URL}/admin/trainers`).then(r => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/admin/institutes`).then(r => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/admin/recruiters`).then(r => (r.ok ? r.json() : [])),
      ])

    const resumes =
      resumesRes.status === 'fulfilled' && Array.isArray(resumesRes.value)
        ? resumesRes.value
        : []

    const trainers =
      trainersRes.status === 'fulfilled' && Array.isArray(trainersRes.value)
        ? trainersRes.value
        : []

    const institutes =
      institutesRes.status === 'fulfilled' && Array.isArray(institutesRes.value)
        ? institutesRes.value
        : []

    const recruiters =
      recruitersRes.status === 'fulfilled' && Array.isArray(recruitersRes.value)
        ? recruitersRes.value
        : []

    const students = resumes.filter(r => r.role === 'student' || !r.role)

    setStats({
      students: students.length,
      trainers: trainers.length,
      institutes: institutes.length,
      recruiters: recruiters.length,
    })

    // Only show error if EVERYTHING failed
    if (
      resumesRes.status === 'rejected' &&
      trainersRes.status === 'rejected' &&
      institutesRes.status === 'rejected' &&
      recruitersRes.status === 'rejected'
    ) {
      setError('Failed to load dashboard data.')
    }

    setLoading(false)
  }

  const goTo = (path) => {
    navigate(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.name || 'Admin'}!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={fetchStats} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Learners</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.students}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Trainers</p>
            <p className="text-4xl font-bold text-orange-600 mt-2">{stats.trainers}</p>
          </div>
          <div
            onClick={() => goTo('/admin/institutes')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition"
          >
            <p className="text-sm font-medium text-gray-500">Institutes</p>
            <p className="text-4xl font-bold text-pink-600 mt-2">{stats.institutes}</p>
          </div>
          <div
            onClick={() => goTo('/admin/recruiters')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition"
          >
            <p className="text-sm font-medium text-gray-500">Recruiters</p>
            <p className="text-4xl font-bold text-teal-600 mt-2">{stats.recruiters}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => goTo('/admin/students')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-3xl text-green-600">
                👨‍🎓
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Learner Management</h3>
                <p className="text-sm text-gray-500">View learners & progress</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              View Learners →
            </div>
          </div>

          <div
            onClick={() => goTo('/admin/trainers')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl text-orange-600">
                👨‍🏫
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Trainer Management</h3>
                <p className="text-sm text-gray-500">View and approve trainers</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              View Trainers →
            </div>
          </div>

          <div
            onClick={() => goTo('/admin/institutes')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-pink-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-3xl text-pink-600">
                🏫
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Institute Management</h3>
                <p className="text-sm text-gray-500">Review & approve institutes</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              Manage Institutes →
            </div>
          </div>

          <div
            onClick={() => goTo('/admin/recruiters')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-teal-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl text-teal-600">
                💼
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Recruiter Management</h3>
                <p className="text-sm text-gray-500">Approve and manage recruiters</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              Manage Recruiters →
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div
            onClick={() => goTo('/admin/skills')}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group flex items-center justify-between max-w-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl text-blue-600">
                📚
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Skills Management</h3>
                <p className="text-sm text-gray-500">View skills & questions</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline pr-2">
              →
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard