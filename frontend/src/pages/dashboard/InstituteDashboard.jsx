import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import API_BASE_URL from '../../config'

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
        fetch(`${API_BASE_URL}/institute/profile/${instituteId}`),
        fetch(`${API_BASE_URL}/institute/courses/${instituteId}`),
        fetch(`${API_BASE_URL}/institute/batches/${instituteId}`),
        fetch(`${API_BASE_URL}/institute/enrollments/${instituteId}`)
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
      const response = await fetch(`${API_BASE_URL}/institute/course`, {
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
      const response = await fetch(`${API_BASE_URL}/institute/batch`, {
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
      await fetch(`${API_BASE_URL}/institute/course/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this batch?')) return
    try {
      await fetch(`${API_BASE_URL}/institute/batch/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const approvedCourses = courses.filter(c => c.is_approved)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto pt-24 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Institute Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your courses, batches and students</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition font-medium text-sm"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="px-6">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'courses', label: 'Courses' },
                { key: 'batches', label: 'Batches' },
                { key: 'students', label: 'Students' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 border-b-2 font-semibold text-sm transition whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Courses</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{courses.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📚</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Approved Courses</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{approvedCourses.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Batches</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{batches.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">📅</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Students</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{enrollments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">👥</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
                <button
                  onClick={() => setShowCourseForm(!showCourseForm)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition text-sm font-semibold"
                >
                  {showCourseForm ? 'Cancel' : '+ Add Course'}
                </button>
              </div>

              {showCourseForm && (
                <form onSubmit={handleCreateCourse} className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Create New Course</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Course Title *" value={newCourse.title}
                      onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input placeholder="Category" value={newCourse.category}
                      onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <select value={newCourse.level}
                      onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                    <select value={newCourse.mode}
                      onChange={e => setNewCourse({ ...newCourse, mode: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <input type="number" placeholder="Duration (hours)" value={newCourse.duration_hours}
                      onChange={e => setNewCourse({ ...newCourse, duration_hours: parseInt(e.target.value) || 0 })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Duration (weeks)" value={newCourse.duration_weeks}
                      onChange={e => setNewCourse({ ...newCourse, duration_weeks: parseInt(e.target.value) || 0 })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Price (₹)" value={newCourse.price}
                      onChange={e => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Max students per batch" value={newCourse.max_students_per_batch}
                      onChange={e => setNewCourse({ ...newCourse, max_students_per_batch: parseInt(e.target.value) || 0 })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <textarea placeholder="Description" value={newCourse.description} rows="2"
                      onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <textarea placeholder="Syllabus" value={newCourse.syllabus} rows="2"
                      onChange={e => setNewCourse({ ...newCourse, syllabus: e.target.value })}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <textarea placeholder="Prerequisites" value={newCourse.prerequisites} rows="2"
                      onChange={e => setNewCourse({ ...newCourse, prerequisites: e.target.value })}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="submit"
                    className="mt-5 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition font-semibold">
                    Create Course
                  </button>
                </form>
              )}

              {courses.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-3">📚</div>
                  <p className="text-gray-500 font-medium">No courses yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "+ Add Course" to create your first course.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-900 flex-1 pr-2">{course.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          course.status === 'approved' ? 'bg-green-100 text-green-700' :
                          course.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {course.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                        {course.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{course.level}</span>
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{course.mode}</span>
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">₹{course.price}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mb-3">
                        <span>{course.batch_count} batches</span>
                        <span>{course.enrollment_count} students</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition text-sm font-semibold"
                      >
                        Delete Course
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'batches' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Batches</h2>
                <button
                  onClick={() => setShowBatchForm(!showBatchForm)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition text-sm font-semibold"
                >
                  {showBatchForm ? 'Cancel' : '+ Add Batch'}
                </button>
              </div>

              {showBatchForm && (
                <form onSubmit={handleCreateBatch} className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Create New Batch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select required value={newBatch.course_id}
                      onChange={e => setNewBatch({ ...newBatch, course_id: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Select Course *</option>
                      {approvedCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <input required placeholder="Batch Name *" value={newBatch.batch_name}
                      onChange={e => setNewBatch({ ...newBatch, batch_name: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="date" placeholder="Start Date" value={newBatch.start_date}
                      onChange={e => setNewBatch({ ...newBatch, start_date: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="date" placeholder="End Date" value={newBatch.end_date}
                      onChange={e => setNewBatch({ ...newBatch, end_date: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input placeholder="Timing (e.g. 10:00 AM - 12:00 PM)" value={newBatch.timing}
                      onChange={e => setNewBatch({ ...newBatch, timing: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input placeholder="Days (e.g. Mon, Wed, Fri)" value={newBatch.days}
                      onChange={e => setNewBatch({ ...newBatch, days: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Max Students" value={newBatch.max_students}
                      onChange={e => setNewBatch({ ...newBatch, max_students: parseInt(e.target.value) || 0 })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input placeholder="Trainer Name" value={newBatch.trainer_name}
                      onChange={e => setNewBatch({ ...newBatch, trainer_name: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input placeholder="Meeting Link (optional)" value={newBatch.meeting_link}
                      onChange={e => setNewBatch({ ...newBatch, meeting_link: e.target.value })}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="submit"
                    className="mt-5 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition font-semibold">
                    Create Batch
                  </button>
                </form>
              )}

              {batches.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-3">📅</div>
                  <p className="text-gray-500 font-medium">No batches yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map(batch => (
                    <div key={batch.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-gray-900 text-lg">{batch.batch_name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              batch.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              batch.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {batch.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Course: <strong className="text-gray-800">{batch.course_title}</strong>
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">Start Date</p>
                              <p className="font-medium text-gray-800">
                                {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">Timing</p>
                              <p className="font-medium text-gray-800">{batch.timing || 'TBD'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">Days</p>
                              <p className="font-medium text-gray-800">{batch.days || 'TBD'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs text-gray-500 mb-1">Enrolled</p>
                              <p className="font-medium text-gray-800">{batch.enrolled_count}/{batch.max_students}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition"
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

          {activeTab === 'students' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Students</h2>
              {enrollments.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-gray-500 font-medium">No students enrolled yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{e.student_name}</div>
                            <div className="text-xs text-gray-500">{e.student_email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{e.course_title}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{e.batch_name || '—'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${e.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{e.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              e.status === 'completed' ? 'bg-green-100 text-green-700' :
                              e.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {e.status}
                            </span>
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
    </div>
  )
}

export default InstituteDashboard