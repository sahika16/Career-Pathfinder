import React, { useState, useEffect } from 'react'
import API_BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import imageCompression from 'browser-image-compression'

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
  const [uploadProgress, setUploadProgress] = useState('')
  const [trainerCourses, setTrainerCourses] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [courseFiles, setCourseFiles] = useState([])
  const [courseUploadProgress, setCourseUploadProgress] = useState('')
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    duration_minutes: '',
    max_students: '',
    price: '',
    meeting_link: ''
  })

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
    about: '',
    expertise: '',
    qualifications: '',
    skill_level: ''
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const contentTypes = ['video', 'pdf', 'document', 'notes', 'quiz', 'assignment', 'presentation', 'other']
  const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
  const courseLevelOptions = ['Easy', 'Medium', 'Hard']

  const MAX_FILE_SIZE_MB = 0.9

  useEffect(() => {
    if (user && user.id) {
      fetchSessions()
      fetchContents()
      fetchTrainerSettings()
      fetchTrainerCourses()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/sessions/${user.id}`)
      setSessions(response.data)
    } catch (err) {
      console.error('Error fetching sessions:', err)
    }
  }

  const fetchContents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/content/${user.id}`)
      setContents(response.data)
    } catch (err) {
      console.error('Error fetching contents:', err)
    }
  }

  const fetchTrainerSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/settings/${user.id}`)
      if (response.data) {
        setTrainerSettings({
          available_days: response.data.available_days || [],
          available_time_start: response.data.available_time_start || '',
          available_time_end: response.data.available_time_end || '',
          about: response.data.about || '',
          expertise: response.data.expertise || '',
          qualifications: response.data.qualifications || '',
          skill_level: response.data.skill_level || ''
        })
      }
    } catch (err) {
      console.error('Error fetching trainer settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainerCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/courses/${user.id}`)
      setTrainerCourses(response.data)
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file') {
      const file = files[0]
      
      if (file) {
        const sizeMB = file.size / (1024 * 1024)
        if (sizeMB > 50) {
          setError(`File too large: ${sizeMB.toFixed(2)} MB. Maximum is 50MB.`)
          setTimeout(() => setError(null), 5000)
          e.target.value = ''
          return
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSettingsChange = (e) => {
    const { name, value } = e.target
    setTrainerSettings(prev => ({ ...prev, [name]: value }))
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
      await axios.post(`${API_BASE_URL}/trainer/session`, {
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

  const compressFile = async (file) => {
    const sizeMB = file.size / (1024 * 1024)
    const fileType = file.type

    if (fileType.startsWith('image/')) {
      setUploadProgress(`Compressing image (${sizeMB.toFixed(2)} MB)...`)
      try {
        const options = {
          maxSizeMB: MAX_FILE_SIZE_MB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.85
        }
        const compressed = await imageCompression(file, options)
        const newSizeMB = compressed.size / (1024 * 1024)
        setUploadProgress(`Image compressed: ${sizeMB.toFixed(2)} MB → ${newSizeMB.toFixed(2)} MB`)
        return compressed
      } catch (err) {
        console.warn('Image compression failed:', err)
        return file
      }
    }

    if (fileType === 'application/pdf') {
      if (sizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(
          `PDF is ${sizeMB.toFixed(2)} MB — too large for direct upload (limit ${MAX_FILE_SIZE_MB} MB).\n\n`
        )
      }
      return file
    }

    return file
  }

  const handleAddContent = async (e) => {
    e.preventDefault()
    
    if (!formData.content_title || !formData.content_type) {
      setError('Please fill in title and content type')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!formData.content_file && !formData.content_url) {
      setError('Please either upload a file or paste a URL')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setUploading(true)
      setUploadProgress('')
      setError(null)

      let contentUrl = formData.content_url

      if (formData.content_file) {
        setUploadProgress('Preparing file...')
        
        let fileToUpload
        try {
          fileToUpload = await compressFile(formData.content_file)
        } catch (compressErr) {
          setError(compressErr.message)
          setUploading(false)
          setUploadProgress('')
          setTimeout(() => setError(null), 10000)
          return
        }

        const finalSizeMB = fileToUpload.size / (1024 * 1024)
        if (finalSizeMB > MAX_FILE_SIZE_MB) {
          setError(
            `File is still ${finalSizeMB.toFixed(2)} MB after processing (limit ${MAX_FILE_SIZE_MB} MB).\n\n` +
            `Please paste a URL instead (e.g., YouTube, Google Drive, Dropbox).`
          )
          setUploading(false)
          setUploadProgress('')
          setTimeout(() => setError(null), 10000)
          return
        }

        setUploadProgress(`Uploading ${finalSizeMB.toFixed(2)} MB...`)

        const uploadFormData = new FormData()
        uploadFormData.append('file', fileToUpload)
        uploadFormData.append('trainer_id', user.id)

        const uploadResponse = await axios.post(
          `${API_BASE_URL}/member/upload`,
          uploadFormData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(`Uploading... ${percent}%`)
            }
          }
        )
        contentUrl = uploadResponse.data.url
        setUploadProgress('File uploaded, saving content...')
      }

      await axios.post(`${API_BASE_URL}/member/content`, {
        trainer_id: user.id,
        title: formData.content_title,
        description: formData.content_description,
        content_type: formData.content_type,
        content_url: contentUrl,
        skill_name: formData.content_skill,
        difficulty: formData.content_difficulty
      })

      setSuccess('Content submitted successfully! Waiting for admin approval.')
      setShowAddContent(false)
      setFormData({
        ...formData,
        content_title: '',
        content_description: '',
        content_url: '',
        content_type: '',
        content_skill: '',
        content_difficulty: '',
        content_file: null
      })
      fetchContents()
      setUploadProgress('')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Content upload error:', err)
      
      if (err.response?.status === 413) {
        setError('File too large for server. Please use the URL field instead.')
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again or use the URL field.')
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload timed out. Please try a smaller file or use a URL.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to upload content')
      }
      setUploadProgress('')
      setTimeout(() => setError(null), 8000)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`${API_BASE_URL}/trainer/settings/${user.id}`, trainerSettings)
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
        await axios.delete(`${API_BASE_URL}/trainer/session/${sessionId}`)
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
        await axios.delete(`${API_BASE_URL}/member/content/${contentId}`)
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

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target
    setCourseForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCourseFilesChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)
    if (totalMB > 50) {
      setError(`Total file size: ${totalMB.toFixed(2)} MB. Maximum is 50MB.`)
      setTimeout(() => setError(null), 5000)
      e.target.value = ''
      return
    }

    setCourseFiles(files)
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()
    
    if (!courseForm.title || !courseForm.category || !courseForm.level) {
      setError('Please fill in title, category and level')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      setUploading(true)
      setCourseUploadProgress('')
      setError(null)

      let uploadedVideoUrls = []
      let mainContentUrl = courseForm.meeting_link || ''

      if (courseFiles.length > 0) {
        setCourseUploadProgress(`Uploading ${courseFiles.length} file(s)...`)
        
        for (let i = 0; i < courseFiles.length; i++) {
          const file = courseFiles[i]
          const sizeMB = file.size / (1024 * 1024)
          
          setCourseUploadProgress(`Uploading ${i + 1}/${courseFiles.length}: ${file.name} (${sizeMB.toFixed(2)} MB)...`)
          
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('trainer_id', user.id)

          try {
            const uploadRes = await axios.post(
              `${API_BASE_URL}/member/upload`,
              uploadFormData,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                  setCourseUploadProgress(`${i + 1}/${courseFiles.length}: ${file.name} - ${percent}%`)
                }
              }
            )
            uploadedVideoUrls.push(uploadRes.data.url)
          } catch (uploadErr) {
            console.warn(`Failed to upload ${file.name}:`, uploadErr.message)
          }
        }

        if (!mainContentUrl && uploadedVideoUrls.length > 0) {
          mainContentUrl = uploadedVideoUrls[0]
        }
      }

      setCourseUploadProgress('Saving course...')

      await axios.post(`${API_BASE_URL}/trainer/course`, {
        ...courseForm,
        trainer_id: user.id,
        duration_minutes: parseInt(courseForm.duration_minutes) || 0,
        max_students: parseInt(courseForm.max_students) || 0,
        price: parseFloat(courseForm.price) || 0,
        meeting_link: mainContentUrl,
        content_urls: uploadedVideoUrls.join(',')
      })
      
      setSuccess(`Course created with ${uploadedVideoUrls.length} file(s)! Waiting for admin approval.`)
      setShowAddCourse(false)
      setCourseFiles([])
      setCourseForm({
        title: '',
        description: '',
        category: '',
        level: '',
        duration_minutes: '',
        max_students: '',
        price: '',
        meeting_link: ''
      })
      setCourseUploadProgress('')
      fetchTrainerCourses()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Course creation error:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to create course')
      setCourseUploadProgress('')
      setTimeout(() => setError(null), 5000)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Delete this course?')) {
      try {
        await axios.delete(`${API_BASE_URL}/trainer/course/${courseId}`)
        fetchTrainerCourses()
        setSuccess('Course deleted successfully')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError('Failed to delete course')
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#16A36A'
      case 'Medium': return '#E9A238'
      case 'Hard': return '#DC2626'
      default: return '#475467'
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

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'approved': 'bg-green-100 text-green-700 border-green-300',
      'rejected': 'bg-red-100 text-red-700 border-red-300'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return '✓ Approved'
      case 'rejected': return '✕ Rejected'
      case 'pending': return '⏳ Pending Approval'
      default: return '⏳ Pending Approval'
    }
  }

  if (!user || !user.id) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F888D] mx-auto"></div>
            <p className="mt-4 text-[#475467]">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8]">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F888D] mx-auto"></div>
            <p className="mt-4 text-[#475467]">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-24 px-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#123558]">Trainer Dashboard</h1>
          <p className="text-[#475467]">Manage your sessions, content, courses, and schedule</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-[#16A36A] px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-[#475467]">Total Sessions</p>
            <p className="text-2xl font-bold text-[#123558]">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-[#475467]">Upcoming</p>
            <p className="text-2xl font-bold text-[#16A36A]">
              {sessions.filter(s => s.status === 'scheduled' || s.status === 'ongoing').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-[#475467]">Content</p>
            <p className="text-2xl font-bold text-[#0F888D]">{contents.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-[#475467]">Courses</p>
            <p className="text-2xl font-bold text-[#E9A238]">{trainerCourses.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('sessions'); setShowAddSession(false); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'sessions' ? 'bg-[#123558] text-white' : 'bg-white text-[#475467] hover:bg-gray-50 border border-gray-200'}`}
          >
            📅 Sessions
          </button>
          <button
            onClick={() => { setActiveTab('content'); setShowAddSession(false); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'content' ? 'bg-[#123558] text-white' : 'bg-white text-[#475467] hover:bg-gray-50 border border-gray-200'}`}
          >
            📚 Content
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setShowAddSession(false); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'courses' ? 'bg-[#123558] text-white' : 'bg-white text-[#475467] hover:bg-gray-50 border border-gray-200'}`}
          >
            📖 Courses
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setShowAddSession(false); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'settings' ? 'bg-[#123558] text-white' : 'bg-white text-[#475467] hover:bg-gray-50 border border-gray-200'}`}
          >
            ⚙️ Settings
          </button>
        </div>

        {activeTab === 'sessions' && (
          <>
            <button
              onClick={() => setShowAddSession(!showAddSession)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${showAddSession ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#0F888D] hover:bg-[#0A6B6F] text-white'}`}
            >
              {showAddSession ? '✕ Cancel' : '+ Schedule Session'}
            </button>

            {showAddSession && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-[#123558] mb-4">Schedule New Session</h2>
                <form onSubmit={handleAddSession} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Title <span className="text-red-500">*</span></label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Category <span className="text-red-500">*</span></label>
                      <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required>
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
                      <label className="block text-sm font-medium text-[#475467] mb-1">Date <span className="text-red-500">*</span></label>
                      <input type="date" name="session_date" value={formData.session_date} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Start Time <span className="text-red-500">*</span></label>
                      <input type="time" name="start_time" value={formData.start_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">End Time <span className="text-red-500">*</span></label>
                      <input type="time" name="end_time" value={formData.end_time} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Duration (minutes)</label>
                      <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="Enter duration" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Max Students</label>
                      <input type="number" name="max_students" value={formData.max_students} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="Enter max students" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Price (₹)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="0 for Free" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Level <span className="text-red-500">*</span></label>
                      <select name="level" value={formData.level} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required>
                        <option value="">Select Level</option>
                        {levelOptions.map(level => (<option key={level} value={level}>{level}</option>))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-1">Meeting Link</label>
                      <input type="url" name="meeting_link" value={formData.meeting_link} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="https://meet.google.com/..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-1">Description</label>
                      <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" />
                    </div>
                  </div>
                  <button type="submit" className="bg-[#0F888D] text-white px-4 py-2 rounded-lg hover:bg-[#0A6B6F] transition text-sm font-medium">Schedule Session</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#123558]">Your Sessions</h2>
                <span className="text-sm text-[#475467]">{sessions.length} sessions</span>
              </div>
              {sessions.length === 0 ? (
                <p className="text-[#475467] text-center py-6 text-sm">No sessions scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#123558] text-sm">{session.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              session.status === 'ongoing' ? 'bg-[#16A36A] text-white' :
                              session.status === 'completed' ? 'bg-gray-100 text-[#475467]' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {session.status}
                            </span>
                            {session.level && (
                              <span className="text-xs bg-[#0F888D] text-white px-2 py-0.5 rounded-full">{session.level}</span>
                            )}
                          </div>
                          <p className="text-sm text-[#475467]">{session.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#475467]">
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                            <span>{session.start_time} - {session.end_time}</span>
                            <span>{session.enrolled_count || 0}/{session.max_students} students</span>
                            {session.price > 0 && <span>₹{session.price}</span>}
                            {session.meeting_link && (
                              <a href={session.meeting_link} target="_blank" rel="noopener" className="text-[#0F888D] hover:underline">Join</a>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteSession(session.id)} className="text-red-500 hover:text-red-700 text-sm">Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'content' && (
          <>
            <button
              onClick={() => setShowAddContent(!showAddContent)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${showAddContent ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#0F888D] hover:bg-[#0A6B6F] text-white'}`}
            >
              {showAddContent ? '✕ Cancel' : '+ Add Content'}
            </button>

            {showAddContent && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-[#123558] mb-4">Add New Content</h2>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  ℹ️ All content requires admin approval before being visible to students.
                </p>
                <form onSubmit={handleAddContent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Title <span className="text-red-500">*</span></label>
                      <input type="text" name="content_title" value={formData.content_title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Content Type <span className="text-red-500">*</span></label>
                      <select name="content_type" value={formData.content_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" required>
                        <option value="">Select Type</option>
                        {contentTypes.map(type => (<option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Skill</label>
                      <input type="text" name="content_skill" value={formData.content_skill} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="e.g., Python, SQL" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Difficulty</label>
                      <select name="content_difficulty" value={formData.content_difficulty} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm">
                        <option value="">Select Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-2">
                        Upload File or Paste Link
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          (Max ~1 MB for file upload — use URL for larger files)
                        </span>
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          name="content_url"
                          value={formData.content_url}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                          placeholder="Paste URL here (recommended for large files)"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            name="content_file"
                            onChange={handleInputChange}
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.mov,.pptx,.xlsx,.txt"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          />
                          <button
                            type="button"
                            className="bg-gray-200 text-[#475467] px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium whitespace-nowrap"
                          >
                            Browse
                          </button>
                        </div>
                      </div>
                      {formData.content_file && (
                        <div className="mt-1">
                          <p className="text-xs text-[#16A36A]">
                            Selected: {formData.content_file.name} ({(formData.content_file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          {formData.content_file.size > 1 * 1024 * 1024 && formData.content_file.type === 'application/pdf' && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ PDF is larger than 1 MB — will be rejected by server. Please use URL field instead.
                            </p>
                          )}
                          {formData.content_file.size > 1 * 1024 * 1024 && formData.content_file.type.startsWith('image/') && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              ℹ️ Image will be compressed automatically before upload.
                            </p>
                          )}
                          {formData.content_file.size > 1 * 1024 * 1024 && !formData.content_file.type.startsWith('image/') && formData.content_file.type !== 'application/pdf' && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ File is larger than 1 MB — may be rejected. Consider using URL field.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-1">Description</label>
                      <textarea name="content_description" value={formData.content_description} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" />
                    </div>
                  </div>

                  {uploadProgress && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                      ⏳ {uploadProgress}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-[#0F888D] text-white px-4 py-2 rounded-lg hover:bg-[#0A6B6F] transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Submitting...' : 'Submit Content for Approval'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {contents.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <p className="text-[#475467] text-xl">No content added yet.</p>
                  <p className="text-[#475467] mt-2">Click "Add Content" to create your first material.</p>
                </div>
              ) : (
                contents.map((content) => (
                  <div 
                    key={content.id} 
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
                    onClick={() => handleCardClick(content)}
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-[#123558]/5 to-[#0F888D]/10 flex items-center justify-center">
                      <div className="text-6xl opacity-60">{getContentIcon(content.content_type)}</div>
                      
                      <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white bg-[#123558]/80 backdrop-blur-sm">
                        {getContentLabel(content.content_type)}
                      </div>

                      <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border-2 shadow-lg ${getStatusBadge(content.status)}`}>
                        {getStatusLabel(content.status)}
                      </div>

                      {content.difficulty && (
                        <div 
                          className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                          style={{ backgroundColor: getDifficultyColor(content.difficulty) }}
                        >
                          {content.difficulty}
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDeleteContent(content.id, e)}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-[#123558] text-sm line-clamp-2 hover:text-[#0F888D] transition">
                        {content.title}
                      </h3>
                      
                      {content.skill_name && (
                        <p className="text-xs text-[#0F888D] font-medium mt-1">{content.skill_name}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#475467]">
                        <span className="capitalize">{content.content_type}</span>
                        <span className="text-gray-300">•</span>
                        <span>{content.difficulty || 'N/A'}</span>
                      </div>

                      <span className="text-xs text-[#475467] block mt-1">
                        {content.created_at ? new Date(content.created_at).toLocaleDateString() : ''}
                      </span>

                      {content.description && (
                        <p className="text-xs text-[#475467] mt-2 line-clamp-2">{content.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'courses' && (
          <>
            <button
              onClick={() => setShowAddCourse(!showAddCourse)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${showAddCourse ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#0F888D] hover:bg-[#0A6B6F] text-white'}`}
            >
              {showAddCourse ? '✕ Cancel' : '+ Create Course'}
            </button>

            {showAddCourse && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-[#123558] mb-4">Create New Course</h2>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  ℹ️ All courses require admin approval before being visible to students. You can upload up to 7-8 videos.
                </p>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Title <span className="text-red-500">*</span></label>
                      <input type="text" name="title" value={courseForm.title} onChange={handleCourseInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="e.g., Complete Python Bootcamp" required />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Category <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="category"
                        value={courseForm.category}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        placeholder="e.g., Technology, Business, Design"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Level <span className="text-red-500">*</span></label>
                      <select
                        name="level"
                        value={courseForm.level}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        required
                      >
                        <option value="">Select Level</option>
                        {courseLevelOptions.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={courseForm.duration_minutes}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        min="1"
                        placeholder="Enter duration"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Max Students</label>
                      <input
                        type="number"
                        name="max_students"
                        value={courseForm.max_students}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        min="1"
                        placeholder="Enter max students"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#475467] mb-1">Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={courseForm.price}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        min="0"
                        placeholder="0 for Free"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-1">Meeting Link (Optional)</label>
                      <input
                        type="url"
                        name="meeting_link"
                        value={courseForm.meeting_link}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-2">
                        Upload Course Videos / Files
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          (Upload up to 7-8 videos — total must be under 50 MB)
                        </span>
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="file"
                            multiple
                            onChange={handleCourseFilesChange}
                            accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          />
                          <button
                            type="button"
                            className="bg-gray-200 text-[#475467] px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium whitespace-nowrap w-full"
                          >
                            📁 Browse Course Videos / Files
                          </button>
                        </div>
                      </div>

                      {courseFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-[#16A36A]">
                            {courseFiles.length} file(s) selected (total: {(courseFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                            {courseFiles.map((file, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-200 last:border-0">
                                <span className="text-[#475467] truncate mr-2">
                                  {idx + 1}. {file.name}
                                </span>
                                <span className="text-gray-400 whitespace-nowrap">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#475467] mb-1">Description</label>
                      <textarea
                        name="description"
                        value={courseForm.description}
                        onChange={handleCourseInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm"
                        placeholder="Describe your course..."
                      />
                    </div>
                  </div>

                  {courseUploadProgress && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                      ⏳ {courseUploadProgress}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-[#0F888D] text-white px-4 py-2 rounded-lg hover:bg-[#0A6B6F] transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Submitting...' : 'Submit Course'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-[#123558] mb-4">Your Courses</h2>
              {trainerCourses.length === 0 ? (
                <p className="text-[#475467] text-center py-6 text-sm">No courses created yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainerCourses.map((course) => (
                    <div key={course.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                      course.status === 'approved' ? 'border-green-300 bg-green-50/30' :
                      course.status === 'rejected' ? 'border-red-300 bg-red-50/30' :
                      'border-yellow-300 bg-yellow-50/30'
                    }`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-[#123558] text-sm">{course.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(course.status)}`}>
                          {getStatusLabel(course.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#475467] mt-1 line-clamp-2">{course.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {course.level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            course.level === 'Easy' ? 'bg-green-100 text-green-700' :
                            course.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {course.level}
                          </span>
                        )}
                        {course.category && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{course.category}</span>
                        )}
                        {course.price > 0 ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">₹{course.price}</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free</span>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">👥 {course.enrolled_count || 0}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs text-gray-400">{course.created_at ? new Date(course.created_at).toLocaleDateString() : ''}</p>
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-[#123558] mb-4">Trainer Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#475467] mb-1">About</label>
                  <textarea name="about" value={trainerSettings.about} onChange={handleSettingsChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="Tell students about yourself..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475467] mb-1">Expertise</label>
                  <input type="text" name="expertise" value={trainerSettings.expertise} onChange={handleSettingsChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="e.g., Python, Data Science" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475467] mb-1">Qualifications</label>
                  <input type="text" name="qualifications" value={trainerSettings.qualifications} onChange={handleSettingsChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" placeholder="e.g., M.Tech, 5 years experience" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475467] mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        trainerSettings.available_days?.includes(day)
                          ? 'bg-[#123558] text-white'
                          : 'bg-gray-100 text-[#475467] hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#475467] mb-1">Start Time</label>
                  <input type="time" name="available_time_start" value={trainerSettings.available_time_start} onChange={handleSettingsChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475467] mb-1">End Time</label>
                  <input type="time" name="available_time_end" value={trainerSettings.available_time_end} onChange={handleSettingsChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F888D] text-sm" />
                </div>
              </div>

              <button type="submit" className="bg-[#0F888D] text-white px-4 py-2 rounded-lg hover:bg-[#0A6B6F] transition text-sm font-medium">Save Settings</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegularTrainerDashboard