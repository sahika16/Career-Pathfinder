import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function EnrollmentCard({ enrollment, onContinue, onViewAttendance }) {
  const [expanded, setExpanded] = useState(false)

  const getStatusBadge = (status) => {
    const styles = {
      'enrolled': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'dropped': 'bg-red-100 text-red-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800">{enrollment.session_title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(enrollment.status)}`}>
                {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">Trainer: {enrollment.trainer_name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700">{enrollment.progress}%</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(enrollment.progress)}`}
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="text-lg font-semibold text-gray-800">
                {enrollment.attendance_percentage}%
              </p>
              <p className="text-xs text-gray-400">
                {enrollment.present_days} present / {enrollment.total_days} total days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrolled On</p>
              <p className="text-sm text-gray-800">
                {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onContinue && onContinue(enrollment.enrollment_id)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Continue Learning
            </button>
            <button
              onClick={() => onViewAttendance && onViewAttendance(enrollment)}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
            >
              View Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnrollmentCard