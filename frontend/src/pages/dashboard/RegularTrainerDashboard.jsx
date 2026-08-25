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
  const [showSettings, setShowSettings] = useState(false)
  const [contents, setContents] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('sessions')
  const [uploading, setUploading] = useState(false)

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

  const [trainerSettings, setTrainerSettings] = useState({
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    break_start: '',
    break_end: '',
    about: '',
    expertise: '',
    qualifications: ''
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const contentTypes = ['video', 'pdf', 'document', 'notes', 'quiz', 'assignment', 'presentation', 'other']

  useEffect(() => {
    if (user && user.id) {
      fetchSessions()
      fetchContents()
      fetchTrainerSettings()
    } else {
      setLoading(false)
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
          qualifications: response.data.qualifications || ''
        })
      }
    } catch (err) {
      console.error('Error fetching trainer settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
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
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        max_students: parseInt(formData.max_students) || 0
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
      
      if (formData.content_file) {
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

  const handleDeleteContent = async (contentId, e) => {
    e?.stopPropagation()
    if (window.confirm('Delete this content?')) {
      try {
        await axios.delete(`http://localhost:8000/api/member/content/${contentId}`)
        fetchContents()
      } catch (err) {
        alert('Failed to delete content')
      }
    }
  }

  const handleCardClick = (content) => {
    if (content.content_url) {
      window.open(content.content_url, '_blank')
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyBadge = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'Easy'
      case 'Medium': return 'Medium'
      case 'Hard': return 'Hard'
      default: return ''
    }
  }

  const getContentIcon = (type) => {
    switch(type) {
      case 'video': return '🎬'
      case 'pdf': return '📄'
      case 'document': return '📄'
      case 'image': return '🖼️'
      case 'quiz': return '📝'
      case 'assignment': return '📋'
      case 'notes': return '📓'
      case 'presentation': return '📊'
      default: return '📎'
    }
  }

  const getContentLabel = (type) => {
    switch(type) {
      case 'video': return 'Video'
      case 'pdf': return 'PDF'
      case 'document': return 'Document'
      case 'image': return 'Image'
      case 'quiz': return 'Quiz'
      case 'assignment': return 'Assignment'
      case 'notes': return 'Notes'
      case 'presentation': return 'Presentation'
      default: return 'File'
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
          <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-500">Manage your sessions, content, and schedule</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'scheduled' || s.status === 'ongoing').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Content</p>
            <p className="text-2xl font-bold text-purple-600">{contents.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-orange-600">
              {sessions.reduce((acc, s) => acc + (s.enrolled_count || 0), 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('sessions')
              setShowAddSession(false)
              setShowAddContent(false)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'sessions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => {
              setActiveTab('content')
              setShowAddSession(false)
              setShowAddContent(false)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'content' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => {
              setActiveTab('settings')
              setShowAddSession(false)
              setShowAddContent(false)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Settings
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
              {showAddSession ? 'Cancel' : '+ Schedule Session'}
            </button>

            {showAddSession && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Schedule New Session</h2>
                <form onSubmit={handleAddSession} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-red-500">*</span></label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter duration"
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
                        placeholder="Enter max students"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level <span className="text-red-500">*</span></label>
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
                <h2 className="text-lg font-bold text-gray-800">Your Sessions</h2>
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
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                            <span>{session.start_time} - {session.end_time}</span>
                            <span>{session.enrolled_count || 0}/{session.max_students} students</span>
                            {session.price > 0 && <span>₹{session.price}</span>}
                            {session.meeting_link && (
                              <a href={session.meeting_link} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                                Join
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
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showAddContent ? 'Cancel' : '+ Add Content'}
            </button>

            {showAddContent && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Content</h2>
                <form onSubmit={handleAddContent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="content_title"
                        value={formData.content_title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content Type <span className="text-red-500">*</span></label>
                      <select
                        name="content_type"
                        value={formData.content_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="e.g., Python, SQL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        name="content_difficulty"
                        value={formData.content_difficulty}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Select Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload File or Paste Link</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          name="content_url"
                          value={formData.content_url}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Paste URL here"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            name="content_file"
                            onChange={handleInputChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          />
                          <button
                            type="button"
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium whitespace-nowrap"
                          >
                            Browse
                          </button>
                        </div>
                      </div>
                      {formData.content_file && (
                        <p className="text-xs text-green-600 mt-1">Selected: {formData.content_file.name}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="content_description"
                        value={formData.content_description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Add Content'}
                  </button>
                </form>
              </div>
            )}

            {/* Content Cards with Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {contents.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500 text-xl">No content added yet.</p>
                  <p className="text-gray-400 mt-2">Click "Add Content" to create your first material.</p>
                </div>
              ) : (
                contents.map((content) => (
                  <div 
                    key={content.id} 
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
                    onClick={() => handleCardClick(content)}
                  >
                    {/* Card Image / Thumbnail with Icon */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-6xl opacity-60">
                        {getContentIcon(content.content_type)}
                      </div>
                      
                      {/* File type label */}
                      <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white bg-black/50 backdrop-blur-sm">
                        {getContentLabel(content.content_type)}
                      </div>

                      {/* Difficulty Badge on LEFT side */}
                      {content.difficulty && (
                        <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getDifficultyColor(content.difficulty)}`}>
                          {getDifficultyBadge(content.difficulty)}
                        </div>
                      )}

                      {/* Delete Button on RIGHT side */}
                      <button
                        onClick={(e) => handleDeleteContent(content.id, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Content Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-blue-600 transition">
                        {content.title}
                      </h3>
                      
                      {content.skill_name && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          {content.skill_name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{content.content_type}</span>
                        <span className="text-gray-300">•</span>
                        <span>{content.difficulty || 'N/A'}</span>
                      </div>

                      <span className="text-xs text-gray-400 block mt-1">
                        {content.created_at ? new Date(content.created_at).toLocaleDateString() : ''}
                      </span>

                      {content.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., M.Tech, 5 years experience"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Select time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="available_time_end"
                    value={trainerSettings.available_time_end}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Select time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break Start</label>
                  <input
                    type="time"
                    name="break_start"
                    value={trainerSettings.break_start}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Select time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break End</label>
                  <input
                    type="time"
                    name="break_end"
                    value={trainerSettings.break_end}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Select time"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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