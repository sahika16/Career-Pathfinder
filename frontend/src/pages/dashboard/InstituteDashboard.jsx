import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function InstituteDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', category: '', level: 'Beginner',
    duration_hours: 40, duration_weeks: 4, mode: 'online',
    price: 0, max_students_per_batch: 30, syllabus: '', prerequisites: '', certification: true
  })
  const [newBatch, setNewBatch] = useState({
    course_id: '', batch_name: '', start_date: '', end_date: '',
    timing: '', days: '', max_students: 30, trainer_name: '', meeting_link: ''
  })

  const instituteId = user?.id || JSON.parse(sessionStorage.getItem('careerUser'))?.id

  useEffect(() => {
    if (!instituteId) {
      navigate('/login/institute')
      return
    }
    fetchAll()
  }, [instituteId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [profileRes, coursesRes, batchesRes, enrollmentsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/institute/profile/${instituteId}`),
        fetch(`http://localhost:8000/api/institute/courses/${instituteId}`),
        fetch(`http://localhost:8000/api/institute/batches/${instituteId}`),
        fetch(`http://localhost:8000/api/institute/enrollments/${instituteId}`)
      ])
      setProfile(await profileRes.json())
      setCourses(await coursesRes.json())
      setBatches(await batchesRes.json())
      setEnrollments(await enrollmentsRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/institute/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCourse, institute_id: instituteId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail)
      alert('Course created! Waiting for admin approval.')
      setShowCourseForm(false)
      setNewCourse({
        title: '', description: '', category: '', level: 'Beginner',
        duration_hours: 40, duration_weeks: 4, mode: 'online',
        price: 0, max_students_per_batch: 30, syllabus: '', prerequisites: '', certification: true
      })
      fetchAll()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/institute/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBatch, institute_id: instituteId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail)
      alert('Batch created successfully!')
      setShowBatchForm(false)
      setNewBatch({
        course_id: '', batch_name: '', start_date: '', end_date: '',
        timing: '', days: '', max_students: 30, trainer_name: '', meeting_link: ''
      })
      fetchAll()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await fetch(`http://localhost:8000/api/institute/course/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this batch?')) return
    try {
      await fetch(`http://localhost:8000/api/institute/batch/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const approvedCourses = courses.filter(c => c.is_approved)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {profile?.institute_name || 'Institute Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              {profile?.institute_type === 'training' ? '🏢 Training Institute' :
               profile?.institute_type === 'partner' ? '🤝 Partner' : '🏢 Institute & Partner'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!profile?.is_approved && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                ⏳ Pending Approval
              </span>
            )}
            {profile?.is_approved && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                ✅ Approved
              </span>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {['overview', 'courses', 'batches', 'students'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {!profile?.is_approved && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-700 text-sm">
                  <strong>Note:</strong> Your account is pending admin approval. You can create courses
                  but they will only be visible to students after approval.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Courses', value: courses.length, icon: '📚', color: 'blue' },
                { label: 'Approved Courses', value: approvedCourses.length, icon: '✅', color: 'green' },
                { label: 'Total Batches', value: batches.length, icon: '📅', color: 'purple' },
                { label: 'Total Students', value: enrollments.length, icon: '👥', color: 'yellow' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-2xl`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {profile?.referral_code && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Your Referral Code</h3>
                <p className="text-3xl font-bold tracking-wider mb-2">{profile.referral_code}</p>
                <p className="text-sm opacity-90">
                  Share this code with students to earn referral rewards
                </p>
              </div>
            )}
          </>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Courses</h2>
              <button
                onClick={() => setShowCourseForm(!showCourseForm)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
              >
                {showCourseForm ? 'Cancel' : '+ Add Course'}
              </button>
            </div>

            {showCourseForm && (
              <form onSubmit={handleCreateCourse} className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Course Title *" value={newCourse.title}
                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Category" value={newCourse.category}
                    onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <select value={newCourse.level}
                    onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                  <select value={newCourse.mode}
                    onChange={e => setNewCourse({ ...newCourse, mode: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input type="number" placeholder="Duration (hours)" value={newCourse.duration_hours}
                    onChange={e => setNewCourse({ ...newCourse, duration_hours: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="number" placeholder="Duration (weeks)" value={newCourse.duration_weeks}
                    onChange={e => setNewCourse({ ...newCourse, duration_weeks: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="number" placeholder="Price (₹)" value={newCourse.price}
                    onChange={e => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="number" placeholder="Max students per batch" value={newCourse.max_students_per_batch}
                    onChange={e => setNewCourse({ ...newCourse, max_students_per_batch: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder="Description" value={newCourse.description} rows="2"
                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder="Syllabus" value={newCourse.syllabus} rows="2"
                    onChange={e => setNewCourse({ ...newCourse, syllabus: e.target.value })}
                    className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder="Prerequisites" value={newCourse.prerequisites} rows="2"
                    onChange={e => setNewCourse({ ...newCourse, prerequisites: e.target.value })}
                    className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit"
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium">
                  Create Course
                </button>
              </form>
            )}

            {courses.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <p className="text-gray-500">No courses yet. Add your first course above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-800 flex-1">{course.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        course.status === 'approved' ? 'bg-green-100 text-green-700' :
                        course.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{course.level}</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">{course.mode}</span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded">₹{course.price}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>{course.batch_count} batches</span>
                      <span>{course.enrollment_count} students</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="mt-3 w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                    >
                      Delete Course
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Batches</h2>
              <button
                onClick={() => setShowBatchForm(!showBatchForm)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
              >
                {showBatchForm ? 'Cancel' : '+ Add Batch'}
              </button>
            </div>

            {showBatchForm && (
              <form onSubmit={handleCreateBatch} className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select required value={newBatch.course_id}
                    onChange={e => setNewBatch({ ...newBatch, course_id: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Course *</option>
                    {approvedCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <input required placeholder="Batch Name *" value={newBatch.batch_name}
                    onChange={e => setNewBatch({ ...newBatch, batch_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" placeholder="Start Date" value={newBatch.start_date}
                    onChange={e => setNewBatch({ ...newBatch, start_date: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" placeholder="End Date" value={newBatch.end_date}
                    onChange={e => setNewBatch({ ...newBatch, end_date: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Timing (e.g. 10:00 AM - 12:00 PM)" value={newBatch.timing}
                    onChange={e => setNewBatch({ ...newBatch, timing: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Days (e.g. Mon, Wed, Fri)" value={newBatch.days}
                    onChange={e => setNewBatch({ ...newBatch, days: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="number" placeholder="Max Students" value={newBatch.max_students}
                    onChange={e => setNewBatch({ ...newBatch, max_students: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Trainer Name" value={newBatch.trainer_name}
                    onChange={e => setNewBatch({ ...newBatch, trainer_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Meeting Link (optional)" value={newBatch.meeting_link}
                    onChange={e => setNewBatch({ ...newBatch, meeting_link: e.target.value })}
                    className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit"
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium">
                  Create Batch
                </button>
              </form>
            )}

            {batches.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <p className="text-gray-500">No batches yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map(batch => (
                  <div key={batch.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-800">{batch.batch_name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            batch.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                            batch.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{batch.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Course: <strong>{batch.course_title}</strong></p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div>📅 {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'}</div>
                          <div>⏰ {batch.timing || 'TBD'}</div>
                          <div>📆 {batch.days || 'TBD'}</div>
                          <div>👥 {batch.enrolled_count}/{batch.max_students}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Enrolled Students</h2>
            {enrollments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <p className="text-gray-500">No students enrolled yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map(e => (
                      <tr key={e.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{e.student_name}</div>
                          <div className="text-sm text-gray-500">{e.student_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{e.course_title}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{e.batch_name || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${e.progress}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-600">{e.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            e.status === 'completed' ? 'bg-green-100 text-green-700' :
                            e.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default InstituteDashboard