import React, { useState, useEffect } from 'react'
import API_BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import imageCompression from 'browser-image-compression'

function MemberDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddContent, setShowAddContent] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: '',
    content_url: '',
    skill_name: '',
    difficulty: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedContent, setSelectedContent] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // Course states
  const [trainerCourses, setTrainerCourses] = useState([])
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

  const MAX_FILE_SIZE_MB = 0.9
  const courseLevelOptions = ['Easy', 'Medium', 'Hard']

  useEffect(() => {
    fetchContents()
    fetchTrainerCourses()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/content/${user.id}`)
      setContents(response.data)
    } catch (err) {
      console.error('Error fetching contents:', err)
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
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > 50) {
        setError(`File too large: ${sizeMB.toFixed(2)} MB. Max is 50MB.`)
        setTimeout(() => setError(null), 5000)
        e.target.value = ''
        return
      }

      setSelectedFile(file)

      // Auto-detect content type
      if (file.type.startsWith('video/')) {
        setFormData({ ...formData, content_type: 'video' })
      } else if (file.type === 'application/pdf') {
        setFormData({ ...formData, content_type: 'document' })
      } else if (file.type.startsWith('image/')) {
        setFormData({ ...formData, content_type: 'image' })
      } else if (file.type.includes('word') || file.type.includes('document')) {
        setFormData({ ...formData, content_type: 'document' })
      } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
        setFormData({ ...formData, content_type: 'presentation' })
      }
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
          `PDF is ${sizeMB.toFixed(2)} MB — too large for direct upload (limit ${MAX_FILE_SIZE_MB} MB).\n\n` +
          `Options:\n` +
          `1. Use the "Paste URL" field (upload PDF to Google Drive/Dropbox, paste the link)\n` +
          `2. Compress PDF externally (ilovepdf.com, smallpdf.com)\n` +
          `3. Ask admin to increase server upload limit`
        )
      }
      return file
    }

    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(
        `File is ${sizeMB.toFixed(2)} MB — too large for direct upload (limit ${MAX_FILE_SIZE_MB} MB).\n\n` +
        `Please use the "Paste URL" field instead:\n` +
        `• Videos → upload to YouTube, paste link\n` +
        `• Docs → upload to Google Drive/Dropbox, paste shareable link`
      )
    }

    return file
  }

  const handleAddContent = async (e) => {
    e.preventDefault()
    setUploading(true)
    setError(null)
    setUploadProgress('')

    if (!selectedFile && !formData.content_url.trim()) {
      setError('Please either upload a file or provide a URL')
      setUploading(false)
      return
    }

    try {
      let contentUrl = formData.content_url

      if (selectedFile) {
        setUploadProgress('Preparing file...')

        let fileToUpload
        try {
          fileToUpload = await compressFile(selectedFile)
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
            `Please paste a URL instead.`
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

      const payload = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        content_url: contentUrl,
        skill_name: formData.skill_name,
        difficulty: formData.difficulty,
        trainer_id: user.id
      }

      await axios.post(`${API_BASE_URL}/member/content`, payload)

      setSuccess('✅ Content submitted successfully! Waiting for admin approval.')
      setShowAddContent(false)
      setFormData({ title: '', description: '', content_type: '', content_url: '', skill_name: '', difficulty: '' })
      setSelectedFile(null)
      fetchContents()
      setUploadProgress('')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Add content error:', err)

      if (err.response?.status === 413) {
        setError(
          'File too large for server. Please:\n' +
          '1. Use the URL field instead, OR\n' +
          '2. Compress the file, OR\n' +
          '3. Contact admin to increase upload limit'
        )
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again or use the URL field.')
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload timed out. Please try a smaller file or use a URL.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to add content')
      }
      setUploadProgress('')
      setTimeout(() => setError(null), 8000)
    } finally {
      setUploading(false)
    }
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

  const handleDeleteContent = async (contentId, e) => {
    e.stopPropagation()
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
    setSelectedContent(content)
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
    setSelectedContent(null)
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

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#16A36A'
      case 'Medium': return '#E9A238'
      case 'Hard': return '#DC2626'
      default: return '#475467'
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'approved': 'bg-green-100 text-green-700 border-green-300',
      'rejected': 'bg-red-100 text-red-700 border-red-300'
    }
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return '✓ Approved'
      case 'rejected': return '✕ Rejected'
      case 'pending': return '⏳ Pending Approval'
      default: return '⏳ Pending Approval'
    }
  }

  const renderContentPreview = () => {
    if (!selectedContent) return null

    const url = selectedContent.content_url
    const type = selectedContent.content_type

    if (type === 'document' && url && url.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="w-full h-[500px]">
          <object
            data={url}
            type="application/pdf"
            className="w-full h-full rounded-lg"
          >
            <p className="text-center text-gray-500 py-10">
              PDF viewer not available.
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                Download PDF
              </a>
            </p>
          </object>
        </div>
      )
    }

    if (type === 'video' && url) {
      return (
        <video
          controls
          className="w-full max-h-[500px] rounded-lg"
          src={url}
        >
          Your browser does not support the video tag.
        </video>
      )
    }

    if (type === 'image' && url) {
      return (
        <img
          src={url}
          alt={selectedContent.title}
          className="w-full max-h-[500px] object-contain rounded-lg"
        />
      )
    }

    if (url) {
      return (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600 mb-4">Click the link below to view the document</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-lg font-medium hover:underline break-all"
          >
            🔗 {url}
          </a>
        </div>
      )
    }

    return (
      <div className="text-center py-10 text-gray-500">
        No preview available for this content.
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
          <h1 className="text-2xl font-bold text-gray-900">Member Dashboard</h1>
          <p className="text-gray-500">Manage your content and courses</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 whitespace-pre-line">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Content</p>
            <p className="text-2xl font-bold text-blue-600">{contents.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {contents.filter(c => c.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {contents.filter(c => c.status === 'pending' || !c.status).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Courses</p>
            <p className="text-2xl font-bold text-purple-600">{trainerCourses.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('content'); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📚 Content
          </button>
          <button
            onClick={() => { setActiveTab('courses'); setShowAddContent(false); setShowAddCourse(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📖 Courses
          </button>
        </div>

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
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  ℹ️ All content requires admin approval before being visible to students.
                  For large files (&gt;1 MB), use the URL field instead.
                </p>
                <form onSubmit={handleAddContent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter title"
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
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="notes">Notes</option>
                        <option value="presentation">Presentation</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                      <input
                        type="text"
                        name="skill_name"
                        value={formData.skill_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Python"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-red-500">*</span></label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Paste URL here (recommended for large files)"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept="video/*,application/pdf,image/*,.doc,.docx,.ppt,.pptx,.txt"
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
                      {selectedFile && (
                        <div className="mt-1">
                          <p className="text-xs text-green-600">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          {selectedFile.size > 1 * 1024 * 1024 && selectedFile.type === 'application/pdf' && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ PDF is larger than 1 MB — will be rejected. Please use URL field instead.
                            </p>
                          )}
                          {selectedFile.size > 1 * 1024 * 1024 && selectedFile.type.startsWith('image/') && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              ℹ️ Image will be compressed automatically before upload.
                            </p>
                          )}
                          {selectedFile.size > 1 * 1024 * 1024 && !selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf' && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ File is larger than 1 MB — may be rejected. Consider using URL field.
                            </p>
                          )}
                        </div>
                      )}
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Submitting...' : 'Submit Content for Approval'}
                  </button>
                </form>
              </div>
            )}

            {/* Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contents.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 text-sm">No content added yet.</p>
                </div>
              ) : (
                contents.map((content) => (
                  <div
                    key={content.id}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                    onClick={() => handleCardClick(content)}
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-4xl opacity-50">{getContentIcon(content.content_type)}</span>

                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg"
                        style={{ backgroundColor: getDifficultyColor(content.difficulty) }}
                      >
                        {content.difficulty || 'N/A'}
                      </div>

                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold border-2 shadow-lg ${getStatusBadge(content.status)}`}>
                        {getStatusLabel(content.status)}
                      </div>

                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-black/50 backdrop-blur-sm">
                        {content.content_type}
                      </div>

                      <button
                        onClick={(e) => handleDeleteContent(content.id, e)}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 flex-1">
                          {content.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {content.created_at ? new Date(content.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      {content.skill_name && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                          {content.skill_name}
                        </span>
                      )}

                      {content.description && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
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

        {activeTab === 'courses' && (
          <>
            <button
              onClick={() => setShowAddCourse(!showAddCourse)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                showAddCourse
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showAddCourse ? '✕ Cancel' : '+ Create Course'}
            </button>

            {showAddCourse && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Course</h2>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  ℹ️ All courses require admin approval before being visible to students. You can upload up to 7-8 videos.
                </p>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="title"
                        value={courseForm.title}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="e.g., Complete Python Bootcamp"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="category"
                        value={courseForm.category}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="e.g., Technology, Business, Design"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level <span className="text-red-500">*</span></label>
                      <select
                        name="level"
                        value={courseForm.level}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select Level</option>
                        {courseLevelOptions.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={courseForm.duration_minutes}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="1"
                        placeholder="Enter duration"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                      <input
                        type="number"
                        name="max_students"
                        value={courseForm.max_students}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="1"
                        placeholder="Enter max students"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={courseForm.price}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="0"
                        placeholder="0 for Free"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Optional)</label>
                      <input
                        type="url"
                        name="meeting_link"
                        value={courseForm.meeting_link}
                        onChange={handleCourseInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium whitespace-nowrap w-full"
                          >
                            📁 Browse Course Videos / Files
                          </button>
                        </div>
                      </div>

                      {courseFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-green-600">
                            {courseFiles.length} file(s) selected (total: {(courseFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB)
                          </p>
                          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                            {courseFiles.map((file, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-200 last:border-0">
                                <span className="text-gray-700 truncate mr-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={courseForm.description}
                        onChange={handleCourseInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? 'Submitting...' : 'Submit Course'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Your Courses</h2>
              {trainerCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No courses created yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainerCourses.map((course) => (
                    <div key={course.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                      course.status === 'approved' ? 'border-green-300 bg-green-50/30' :
                      course.status === 'rejected' ? 'border-red-300 bg-red-50/30' :
                      'border-yellow-300 bg-yellow-50/30'
                    }`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800 text-sm">{course.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(course.status)}`}>
                          {getStatusLabel(course.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
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
      </div>

      {/* Content Preview Modal */}
      {showPreview && selectedContent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedContent.title}</h2>
                <p className="text-sm text-gray-500">
                  {selectedContent.content_type} • {selectedContent.difficulty} {selectedContent.skill_name && `• ${selectedContent.skill_name}`}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className={`mb-4 px-4 py-2 rounded-lg border-2 ${getStatusBadge(selectedContent.status)}`}>
                <span className="font-semibold">
                  {selectedContent.status === 'approved' ? '✓ This content has been approved' :
                   selectedContent.status === 'rejected' ? '✕ This content was rejected' :
                   '⏳ Waiting for admin approval'}
                </span>
              </div>

              {selectedContent.description && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm">{selectedContent.description}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                {renderContentPreview()}
              </div>

              {selectedContent.content_url && (
                <div className="mt-4 text-center">
                  <a
                    href={selectedContent.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium inline-flex items-center gap-2"
                  >
                    Open Full Content
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberDashboard