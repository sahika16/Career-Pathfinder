import React, { useState, useEffect } from 'react'
import { markAttendance, getStudentAttendance, getSessionStudents } from '../utils/api'

function AttendanceTracker({ sessionId, studentId, isTrainer = false, trainerId = null }) {
  const [attendance, setAttendance] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('present')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [notes, setNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [sessionId, studentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (isTrainer && sessionId) {
        // Trainer view - get all students in session
        const studentsData = await getSessionStudents(sessionId)
        setStudents(studentsData || [])
      } else if (studentId && sessionId) {
        // Student view - get their attendance
        const attendanceData = await getStudentAttendance(studentId, sessionId)
        setAttendance(attendanceData || [])
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err)
      setError('Failed to load attendance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (studentId, status) => {
    try {
      setError(null)
      setSuccessMessage('')
      
      const response = await markAttendance(studentId, sessionId, status, notes)
      
      if (response.message) {
        setSuccessMessage(`Attendance marked as ${status} successfully!`)
        // Refresh data
        await fetchData()
        setNotes('')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      console.error('Error marking attendance:', err)
      setError(err.response?.data?.detail || 'Failed to mark attendance. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'present': 'bg-green-100 text-green-700',
      'absent': 'bg-red-100 text-red-700',
      'late': 'bg-yellow-100 text-yellow-700',
      'not_marked': 'bg-gray-100 text-gray-500'
    }
    return styles[status] || 'bg-gray-100 text-gray-500'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'present': '✅',
      'absent': '❌',
      'late': '⏰',
      'not_marked': '⬜'
    }
    return icons[status] || '⬜'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
        <button onClick={fetchData} className="ml-3 text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Trainer View - Mark Attendance */}
      {isTrainer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📋 Mark Attendance</h3>
          
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Student</label>
              <select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_name} ({student.progress}% progress)
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => {
                if (selectedStudent) {
                  handleMarkAttendance(selectedStudent, selectedStatus)
                } else {
                  setError('Please select a student')
                  setTimeout(() => setError(null), 3000)
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              Mark Attendance
            </button>
          </div>

          {students.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No students enrolled in this session yet.</p>
          )}
        </div>
      )}

      {/* Student View - My Attendance */}
      {!isTrainer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📊 My Attendance</h3>
          
          {attendance.length === 0 ? (
            <p className="text-sm text-gray-500">No attendance records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-800">{formatDate(record.date)}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadge(record.status)}`}>
                          {getStatusIcon(record.status)} {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats for Trainers */}
      {isTrainer && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.today_status === 'present').length}
            </p>
            <p className="text-xs text-gray-500">Present Today</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {students.filter(s => s.today_status === 'absent').length}
            </p>
            <p className="text-xs text-gray-500">Absent Today</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.today_status === 'late').length}
            </p>
            <p className="text-xs text-gray-500">Late Today</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceTracker