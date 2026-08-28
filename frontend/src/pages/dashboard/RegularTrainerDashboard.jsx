import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'

function RegularTrainerDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSession, setShowAddSession] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [contents, setContents] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('sessions')
  const [uploadMethod, setUploadMethod] = useState('link')
  const [uploading, setUploading] = useState(false)
  const [coachingStudents, setCoachingStudents] = useState([])
  const [showAssignStudent, setShowAssignStudent] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    max_students: '',
    price: 0,
    category: '',
    level: '',
    meeting_link: '',
    content_title: '',
    content_description: '',
    content_url: '',
    content_type: '',
    content_skill: '',
    content_difficulty: '',
    content_file: null
  })

  const [assignForm, setAssignForm] = useState({
    student_id: '',
    student_name: '',
    student_email: '',
    skill_name: '',
    current_level: 'Beginner',
    target_level: 'Intermediate',
    total_sessions: 5,
    notes: ''
  })

  const [trainerSettings, setTrainerSettings] = useState({
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    break_start: '',
    break_end: '',
    about: '',
    expertise: '',
    qualifications: '',
    hourly_rate: '',
    skills_taught: ''
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const contentTypes = ['video', 'pdf', 'document', 'notes', 'quiz', 'assignment', 'presentation', 'other']
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

  useEffect(() => {
    if (user && user.id) {
      fetchSessions()
      fetchContents()
      fetchTrainerSettings()
      fetchCoachingStudents()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/trainer/sessions/${user.id}`)
      setSessions(response.data)
    } catch (err) {
      console.error('Error fetching sessions:', err)
    }
  }

  const fetchContents = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/member/contents/${user.id}`)
      setContents(response.data)
    } catch (err) {
      console.error('Error fetching contents:', err)
    }
  }

  const fetchTrainerSettings = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/trainer/settings/${user.id}`)
      if (response.data) {
        setTrainerSettings({
          available_days: response.data.available_days || [],
          available_time_start: response.data.available_time_start || '',
          available_time_end: response.data.available_time_end || '',
          break_start: response.data.break_start || '',
          break_end: response.data.break_end || '',
          about: response.data.about || '',
          expertise: response.data.expertise || '',
          qualifications: response.data.qualifications || '',
          hourly_rate: response.data.hourly_rate || '',
          skills_taught: response.data.skills_taught || ''
        })
      }
    } catch (err) {
      console.error('Error fetching trainer settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoachingStudents = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/trainer/personalized/students/${user.id}`)
      setCoachingStudents(response.data)
    } catch (err) {
      console.error('Error fetching coaching students:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }))
  }

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target
    setAssignForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSettingsChange = (e) => {
    const { name, value } = e.target
    setTrainerSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDayToggle = (day) => {
    setTrainerSettings(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }))
  }

  const handleAddSession = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.session_date || !formData.start_time || !formData.end_time || !formData.category || !formData.level) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      await axios.post('http://localhost:8000/api/trainer/session', {
        ...formData,
        trainer_id: user.id,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        max_students: parseInt(formData.max_students) || 10
      })
      setSuccess('Session scheduled successfully!')
      setShowAddSession(false)
      setFormData({ title: '', description: '', session_date: '', start_time: '', end_time: '', duration_minutes: '', max_students: '', price: 0, category: '', level: '', meeting_link: '' })
      fetchSessions()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule session')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleAddContent = async (e) => {
    e.preventDefault()
    
    if (!formData.content_title || !formData.content_type) {
      setError('Please fill in title and content type')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setUploading(true)

      let contentUrl = formData.content_url
      
      if (uploadMethod === 'file' && formData.content_file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.content_file)
        uploadFormData.append('trainer_id', user.id)
        
        const uploadResponse = await axios.post('http://localhost:8000/api/member/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        contentUrl = uploadResponse.data.url
      }

      await axios.post('http://localhost:8000/api/member/content', {
        trainer_id: user.id,
        title: formData.content_title,
        description: formData.content_description,
        content_type: formData.content_type,
        content_url: contentUrl,
        skill_name: formData.content_skill,
        difficulty: formData.content_difficulty
      })

      setSuccess('Content uploaded successfully!')
      setShowAddContent(false)
      setFormData({ ...formData, content_title: '', content_description: '', content_url: '', content_type: '', content_skill: '', content_difficulty: '', content_file: null })
      fetchContents()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload content')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:8000/api/trainer/settings/${user.id}`, trainerSettings)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSearchStudent = async () => {
    if (!studentSearch) {
      setError('Please enter an email')
      return
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/student/find/${studentSearch}`)
      setSearchResult(response.data)
      setAssignForm(prev => ({
        ...prev,
        student_id: response.data.id,
        student_name: response.data.name,
        student_email: response.data.email
      }))
      setError(null)
    } catch (err) {
      setError('Student not found with this email')
      setSearchResult(null)
    }
  }

  const handleAssignStudent = async (e) => {
    e.preventDefault()
    if (!assignForm.student_id || !assignForm.skill_name) {
      setError('Please select a student and skill')
      return
    }

    try {
      await axios.post('http://localhost:8000/api/trainer/personalized/assign', {
        trainer_id: user.id,
        student_id: assignForm.student_id,
        student_name: assignForm.student_name,
        student_email: assignForm.student_email,
        skill_name: assignForm.skill_name,
        current_level: assignForm.current_level,
        target_level: assignForm.target_level,
        total_sessions: parseInt(assignForm.total_sessions) || 5,
        notes: assignForm.notes
      })
      setSuccess('Student assigned successfully!')
      setShowAssignStudent(false)
      setStudentSearch('')
      setSearchResult(null)
      setAssignForm({
        student_id: '',
        student_name: '',
        student_email: '',
        skill_name: '',
        current_level: 'Beginner',
        target_level: 'Intermediate',
        total_sessions: 5,
        notes: ''
      })
      fetchCoachingStudents()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign student')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Delete this session?')) {
      try {
        await axios.delete(`http://localhost:8000/api/trainer/session/${sessionId}`)
        fetchSessions()
      } catch (err) {
        alert('Failed to delete session')
      }
    }
  }

  const handleDeleteContent = async (contentId) => {
    if (window.confirm('Delete this content?')) {
      try {
        await axios.delete(`http://localhost:8000/api/member/content/${contentId}`)
        fetchContents()
      } catch (err) {
        alert('Failed to delete content')
      }
    }
  }

  const handleDeleteCoaching = async (coachingId) => {
    if (window.confirm('Remove this student from coaching?')) {
      try {
        await axios.delete(`http://localhost:8000/api/trainer/personalized/coaching/${coachingId}`)
        fetchCoachingStudents()
      } catch (err) {
        alert('Failed to remove student')
      }
    }
  }

  const handleUpdateCoachingStatus = async (coachingId, status) => {
    try {
      await axios.put(`http://localhost:8000/api/trainer/personalized/status/${coachingId}`, { status })
      fetchCoachingStudents()
      setSuccess('Status updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to update status')
    }
  }

  if (!user || !user.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-24 px-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Regular Trainer Dashboard</h1>
          <p className="text-gray-500">Manage group sessions, content library, and student coaching</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-blue-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Sessions</p>
            <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Content</p>
            <p className="text-2xl font-bold text-purple-600">{contents.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Coaching</p>
            <p className="text-2xl font-bold text-orange-600">{coachingStudents.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-cyan-600">
              {sessions.reduce((acc, s) => acc + (s.enrolled_count || 0), 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'sessions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📅 Sessions
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'content' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📚 Content Library
          </button>
          <button
            onClick={() => setActiveTab('coaching')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'coaching' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👥 Coaching Students
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings' 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <>
            <button
              onClick={() => setShowAddSession(!showAddSession)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                showAddSession 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showAddSession ? '✕ Cancel' : '+ Schedule Group Session'}
            </button>

            {showAddSession && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Schedule New Group Session</h2>
                <form onSubmit={handleAddSession} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Programming">Programming</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Soft Skills">Soft Skills</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        name="session_date"
                        value={formData.session_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                      <input
                        type="number"
                        name="max_students"
                        value={formData.max_students}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="0 for Free"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="All Levels">All Levels</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                      <input
                        type="url"
                        name="meeting_link"
                        value={formData.meeting_link}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Schedule Session
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Your Group Sessions</h2>
                <span className="text-sm text-gray-500">{sessions.length} sessions</span>
              </div>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No sessions scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm">{session.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              session.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {session.status}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {session.level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{session.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                            <span>📅 {new Date(session.session_date).toLocaleDateString()}</span>
                            <span>🕐 {session.start_time} - {session.end_time}</span>
                            <span>👥 {session.enrolled_count || 0}/{session.max_students}</span>
                            {session.price > 0 && <span>💰 ₹{session.price}</span>}
                            {session.meeting_link && (
                              <a href={session.meeting_link} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                                🔗 Join
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <>
            <button
              onClick={() => setShowAddContent(!showAddContent)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                showAddContent 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {showAddContent ? '✕ Cancel' : '+ Upload Content'}
            </button>

            {showAddContent && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Upload Learning Content</h2>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('link')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      uploadMethod === 'link' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    URL Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      uploadMethod === 'file' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                <form onSubmit={handleAddContent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        name="content_title"
                        value={formData.content_title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                      <select
                        name="content_type"
                        value={formData.content_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                      >
                        <option value="">Select Type</option>
                        {contentTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                      <input
                        type="text"
                        name="content_skill"
                        value={formData.content_skill}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="e.g., Python, SQL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        name="content_difficulty"
                        value={formData.content_difficulty}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="">Select Difficulty</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    
                    {uploadMethod === 'link' ? (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
                        <input
                          type="url"
                          name="content_url"
                          value={formData.content_url}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          placeholder="https://www.youtube.com/watch?v=... or any URL"
                        />
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                        <input
                          type="file"
                          name="content_file"
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">Supports: Videos, PDFs, Images, Documents, Quizzes (Max 500MB)</p>
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="content_description"
                        value={formData.content_description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Content'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Your Content Library</h2>
                <span className="text-sm text-gray-500">{contents.length} items</span>
              </div>
              {contents.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No content uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contents.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-800 text-sm flex-1">{content.title}</h3>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {content.content_type}
                          </span>
                          {content.skill_name && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {content.skill_name}
                            </span>
                          )}
                          {content.difficulty && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {content.difficulty}
                            </span>
                          )}
                        </div>
                        {content.description && (
                          <p className="text-sm text-gray-500 mt-2">{content.description}</p>
                        )}
                        {content.content_url && (
                          <a href={content.content_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                            🔗 View Content
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Coaching Tab */}
        {activeTab === 'coaching' && (
          <>
            <button
              onClick={() => setShowAssignStudent(!showAssignStudent)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                showAssignStudent 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {showAssignStudent ? '✕ Cancel' : '+ Assign for Coaching'}
            </button>

            {showAssignStudent && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Assign Student for Personalized Coaching</h2>
                <form onSubmit={handleAssignStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Email *</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          placeholder="student@email.com"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleSearchStudent}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                        >
                          Search
                        </button>
                      </div>
                      {searchResult && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700">✓ Found: {searchResult.name} ({searchResult.email})</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill to Teach *</label>
                      <input
                        type="text"
                        name="skill_name"
                        value={assignForm.skill_name}
                        onChange={handleAssignInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="e.g., Python, Data Science"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Level</label>
                      <select
                        name="current_level"
                        value={assignForm.current_level}
                        onChange={handleAssignInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      >
                        {levels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
                      <select
                        name="target_level"
                        value={assignForm.target_level}
                        onChange={handleAssignInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      >
                        {levels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions</label>
                      <input
                        type="number"
                        name="total_sessions"
                        value={assignForm.total_sessions}
                        onChange={handleAssignInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={assignForm.notes}
                        onChange={handleAssignInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="Any special notes about this coaching..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                    disabled={!searchResult}
                  >
                    Assign Student
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Coaching Students</h2>
                <span className="text-sm text-gray-500">{coachingStudents.length} students</span>
              </div>
              {coachingStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No coaching students assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {coachingStudents.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm">{student.student_name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              student.status === 'active' ? 'bg-green-100 text-green-700' :
                              student.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{student.student_email}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                            <span>Skill: {student.skill_name}</span>
                            <span>{student.current_level} → {student.target_level}</span>
                            <span>Sessions: {student.session_count}/{student.total_sessions}</span>
                          </div>
                          {student.notes && (
                            <p className="text-xs text-gray-500 mt-1">📝 {student.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateCoachingStatus(student.id, 'active')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                            >
                              Start
                            </button>
                          )}
                          {student.status === 'active' && (
                            <button
                              onClick={() => handleUpdateCoachingStatus(student.id, 'completed')}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCoaching(student.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trainer Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                  <textarea
                    name="about"
                    value={trainerSettings.about}
                    onChange={handleSettingsChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Tell students about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise</label>
                  <input
                    type="text"
                    name="expertise"
                    value={trainerSettings.expertise}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="e.g., Python, Data Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={trainerSettings.qualifications}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="e.g., M.Tech, 5 years experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills Taught</label>
                  <input
                    type="text"
                    name="skills_taught"
                    value={trainerSettings.skills_taught}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="e.g., Python, React, SQL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={trainerSettings.hourly_rate}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="0 for free"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        trainerSettings.available_days?.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="available_time_start"
                    value={trainerSettings.available_time_start}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="available_time_end"
                    value={trainerSettings.available_time_end}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Start</label>
                  <input
                    type="time"
                    name="break_start"
                    value={trainerSettings.break_start}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break End</label>
                  <input
                    type="time"
                    name="break_end"
                    value={trainerSettings.break_end}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegularTrainerDashboard