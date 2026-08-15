import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { getAllQuestions, getAllSkillNames, getAllResumes } from '../../utils/api'

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    questions: 0,
    skills: 0,
    students: 0,
    trainers: 0,
    testsCompleted: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const questions = await getAllQuestions()
      const skills = await getAllSkillNames()
      const resumes = await getAllResumes()
      
      const students = resumes.filter(r => r.role === 'student' || !r.role)
      const trainers = resumes.filter(r => r.role === 'trainer')
      const testsDone = resumes.filter(r => r.test_completed === true).length
      
      setStats({
        questions: questions.length || 0,
        skills: skills.skills ? skills.skills.length : 0,
        students: students.length || 0,
        trainers: trainers.length || 0,
        testsCompleted: testsDone || 0
      })
      
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-500 mt-1">Welcome back, {user?.name || 'Admin'}!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={fetchStats} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Questions</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.questions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Skills</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.skills}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Students</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.students}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Trainers</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.trainers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Tests Completed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.testsCompleted}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => goTo('/admin/skills')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl text-blue-600">
                📚
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Skills Management</h3>
                <p className="text-sm text-gray-500">View skills and questions</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              View Skills →
            </div>
          </div>

          <div 
            onClick={() => goTo('/admin/students')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl text-green-600">
                👨‍🎓
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Student Management</h3>
                <p className="text-sm text-gray-500">View students and progress</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              View Students →
            </div>
          </div>

          <div 
            onClick={() => goTo('/admin/trainers')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl text-orange-600">
                👨‍🏫
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Trainer Management</h3>
                <p className="text-sm text-gray-500">View and approve trainers</p>
              </div>
            </div>
            <div className="text-blue-600 font-medium text-sm group-hover:underline">
              View Trainers →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard