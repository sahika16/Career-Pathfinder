import React from 'react'
import Navbar from '../../components/Navbar'

function AdminDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto pt-28 px-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="font-bold text-lg">📋 Pending Trainers</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500">Trainers waiting for approval</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="font-bold text-lg">👨‍🎓 Total Students</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Registered students</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="font-bold text-lg">📚 Total Skills</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500">Skills in database</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard