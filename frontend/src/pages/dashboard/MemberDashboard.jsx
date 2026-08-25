import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'

function MemberDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddContent, setShowAddContent] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'video',
    content_url: '',
    skill_name: '',
    difficulty: 'Medium'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedContent, setSelectedContent] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/member/contents/${user.id}`)
      setContents(response.data)
    } catch (err) {
      console.error('Error fetching contents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (file.type.startsWith('video/')) {
        setFormData({ ...formData, content_type: 'video' })
      } else if (file.type === 'application/pdf') {
        setFormData({ ...formData, content_type: 'document' })
      } else if (file.type.startsWith('image/')) {
        setFormData({ ...formData, content_type: 'image' })
      }
    }
  }

  const handleAddContent = async (e) => {
    e.preventDefault()
    setUploading(true)
    setError(null)

    if (!selectedFile && !formData.content_url.trim()) {
      setError('Please either upload a file or provide a URL')
      setUploading(false)
      return
    }

    try {
      let contentUrl = formData.content_url

      if (selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)
        uploadFormData.append('trainer_id', user.id)

        const uploadResponse = await axios.post('http://localhost:8000/api/member/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        contentUrl = uploadResponse.data.url
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

      await axios.post('http://localhost:8000/api/member/content', payload)

      setSuccess('Content added successfully!')
      setShowAddContent(false)
      setFormData({ title: '', description: '', content_type: 'video', content_url: '', skill_name: '', difficulty: 'Medium' })
      setSelectedFile(null)
      fetchContents()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Add content error:', err)
      setError(err.response?.data?.detail || 'Failed to add content')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteContent = async (contentId, e) => {
    e.stopPropagation()
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
      case 'document': return '📄'
      case 'image': return '🖼️'
      case 'quiz': return '📝'
      case 'assignment': return '📋'
      default: return '📎'
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
      default: return 'N/A'
    }
  }

  const renderContentPreview = () => {
    if (!selectedContent) return null

    const url = selectedContent.content_url
    const type = selectedContent.content_type

    if (type === 'document' && url && url.endsWith('.pdf')) {
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
            className="text-blue-600 hover:text-blue-800 text-lg font-medium hover:underline"
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-28 pb-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Member Dashboard</h1>
            <p className="text-gray-600">Manage your content and materials</p>
          </div>
          {/* REMOVED: User name display from right side */}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-4 text-lg">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-4 text-lg">
            ❌ {error}
          </div>
        )}

        <button
          onClick={() => setShowAddContent(!showAddContent)}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition font-semibold text-lg mb-6 shadow-lg hover:shadow-xl"
        >
          {showAddContent ? '✕ Close' : '+ Add Content'}
        </button>

        {showAddContent && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Content</h2>
            <form onSubmit={handleAddContent} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Enter content title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
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
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  >
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
                    rows="4"
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="Enter content description..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (Video, PDF, Image)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="video/*,application/pdf,image/*"
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">OR Enter URL</label>
                  <input
                    type="url"
                    name="content_url"
                    value={formData.content_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Add Content'}
              </button>
            </form>
          </div>
        )}

        {/* YouTube Style Content Grid */}
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
                {/* Thumbnail / Card Image */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-5xl opacity-50">{getContentIcon(content.content_type)}</span>
                  
                  {/* Difficulty Badge on LEFT side */}
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getDifficultyColor(content.difficulty)}`}>
                    {getDifficultyBadge(content.difficulty)}
                  </div>

                  {/* Content Type Badge */}
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white bg-black/50 backdrop-blur-sm">
                    {content.content_type}
                  </div>

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
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {content.skill_name && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                          {content.skill_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {content.created_at ? new Date(content.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {content.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {content.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content Preview Modal */}
      {showPreview && selectedContent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedContent.title}</h2>
                <p className="text-sm text-gray-500">
                  {selectedContent.content_type} • {selectedContent.difficulty} • {selectedContent.skill_name || 'No skill'}
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
              {selectedContent.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-700">{selectedContent.description}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 min-h-[300px] flex items-center justify-center">
                {renderContentPreview()}
              </div>

              {selectedContent.content_url && (
                <div className="mt-6 text-center">
                  <a
                    href={selectedContent.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-medium inline-flex items-center gap-2"
                  >
                    📥 Download / Open Full Content
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