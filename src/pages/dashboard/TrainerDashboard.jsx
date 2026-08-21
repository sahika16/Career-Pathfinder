import React from 'react'
import Navbar from '../../components/Navbar'

function TrainerDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto pt-28 px-6">
        <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.name}!</p>
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">📊 Your Students</h2>
          <p className="text-gray-500">Student management features coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard