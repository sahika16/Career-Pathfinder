import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getStudentContent, getRecommendedContent, getPersonalizedTrainers, getAllTrainers } from '../utils/api'

function LearningResourcesPage({ user, onLogout }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('content')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [showTrainerDetail, setShowTrainerDetail] = useState(false)
  const [content, setContent] = useState({
    regular_content: [],
    member_content: [],
    personalized_coaches: []
  })
  const [recommended, setRecommended] = useState([])
  const [personalizedTrainers, setPersonalizedTrainers] = useState([])
  const [allTrainers, setAllTrainers] = useState([])
  const [filteredContent, setFilteredContent] = useState({
    regular_content: [],
    member_content: [],
    personalized_coaches: []
  })
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const storedUser = sessionStorage.getItem('careerUser')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setIsLoggedIn(!!parsed?.resumeId)
      } catch (e) {}
    }
    fetchAllData()
  }, [])

  useEffect(() => {
    filterContent()
    filterTrainers()
  }, [searchTerm, content, allTrainers])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const storedUser = sessionStorage.getItem('careerUser')
      let currentUser = null
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser)
        } catch (e) {}
      }

      const studentId = currentUser?.resumeId || user?.resumeId

      let contentData = { regular_content: [], member_content: [], personalized_coaches: [] }
      let recommendedData = { recommended: [] }
      let trainersData = []

      if (studentId) {
        try {
          const [contentRes, recommendedRes, trainersRes] = await Promise.all([
            getStudentContent(studentId),
            getRecommendedContent(studentId),
            getPersonalizedTrainers(studentId)
          ])
          contentData = contentRes || contentData
          recommendedData = recommendedRes || { recommended: [] }
          trainersData = trainersRes || []
        } catch (err) {
          console.log('⚠️ Error fetching personalized data:', err)
        }
      }

      let allTrainersData = []
      try {
        allTrainersData = await getAllTrainers()
      } catch (err) {
        console.log('⚠️ Error fetching all trainers:', err)
      }

      const approvedTrainers = allTrainersData.filter(t => t.is_approved === true)
      setAllTrainers(approvedTrainers)
      setFilteredTrainers(approvedTrainers)
      setContent(contentData)
      setFilteredContent(contentData)
      setRecommended(recommendedData.recommended || [])
      setPersonalizedTrainers(trainersData || [])

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load learning resources. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterContent = () => {
    if (!searchTerm.trim()) {
      setFilteredContent(content)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = {
      regular_content: content.regular_content
        .map(trainer => ({
          ...trainer,
          contents: trainer.contents.filter(item =>
            item.title?.toLowerCase().includes(term) ||
            item.skill_name?.toLowerCase().includes(term) ||
            trainer.trainer_name?.toLowerCase().includes(term)
          )
        }))
        .filter(trainer => trainer.contents.length > 0),
      member_content: content.member_content
        .map(trainer => ({
          ...trainer,
          contents: trainer.contents.filter(item =>
            item.title?.toLowerCase().includes(term) ||
            item.skill_name?.toLowerCase().includes(term) ||
            trainer.trainer_name?.toLowerCase().includes(term)
          )
        }))
        .filter(trainer => trainer.contents.length > 0),
      personalized_coaches: content.personalized_coaches.filter(coach =>
        coach.trainer_name?.toLowerCase().includes(term) ||
        coach.specialty?.toLowerCase().includes(term) ||
        coach.skills_taught?.toLowerCase().includes(term)
      )
    }
    setFilteredContent(filtered)
  }

  const filterTrainers = () => {
    let filtered = allTrainers
    if (searchTerm) {
      filtered = filtered.filter(t =>
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.skills_taught?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.about?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.expertise?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.qualifications?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    }
    setFilteredTrainers(filtered)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleCardClick = (contentUrl) => {
    if (contentUrl) {
      window.open(contentUrl, '_blank')
    }
  }

  const handleViewTrainerDetails = (trainer) => {
    setSelectedTrainer(trainer)
    setShowTrainerDetail(true)
  }

  const closeTrainerDetail = () => {
    setShowTrainerDetail(false)
    setSelectedTrainer(null)
  }

  const getInitials = (name) => {
    if (!name) return 'T'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const getContentTypeLabel = (type) => {
    const types = {
      'video': 'Video',
      'pdf': 'PDF',
      'document': 'Document',
      'notes': 'Notes',
      'quiz': 'Quiz',
      'assignment': 'Assignment',
      'presentation': 'Presentation',
      'other': 'Content'
    }
    return types[type] || 'Content'
  }

  const getCategoryBadge = (category) => {
    const styles = {
      'regular': 'bg-blue-100 text-blue-700',
      'personalized': 'bg-purple-100 text-purple-700',
      'member': 'bg-green-100 text-green-700'
    }
    return styles[category] || 'bg-gray-100 text-gray-600'
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'regular': 'Regular Trainer',
      'personalized': 'Personalized Coach',
      'member': 'Member'
    }
    return labels[category] || category
  }

  const getDifficultyBadge = (difficulty) => {
    const styles = {
      'Beginner': 'bg-green-100 text-green-700',
      'Intermediate': 'bg-yellow-100 text-yellow-700',
      'Advanced': 'bg-red-100 text-red-700'
    }
    return styles[difficulty] || 'bg-gray-100 text-gray-600'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-20 px-6 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition p-1.5 rounded-full hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Learning Resources</h1>
            <p className="text-sm text-gray-500">Find courses and connect with trainers</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={fetchAllData} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by skill, title, or trainer..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === 'content' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === 'recommended' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab('trainers')}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === 'trainers' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Trainers
          </button>
        </div>

        {activeTab === 'content' && (
          <div className="space-y-8">
            {filteredContent.member_content.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Member Content</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredContent.member_content.map((trainer) => (
                    trainer.contents.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleCardClick(item.content_url)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden cursor-pointer"
                      >
                        <div className="h-32 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-4xl">
                          📄
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{getContentTypeLabel(item.content_type)}</span>
                              {item.difficulty && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(item.difficulty)}`}>
                                  {item.difficulty}
                                </span>
                              )}
                            </div>
                            {item.created_at && (
                              <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                          <p className="text-sm text-gray-500">By {trainer.trainer_name}</p>
                          {item.skill_name && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                              {item.skill_name}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}

            {filteredContent.regular_content.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Regular Trainers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredContent.regular_content.map((trainer) => (
                    trainer.contents.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleCardClick(item.content_url)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden cursor-pointer"
                      >
                        <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl">
                          📄
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{getContentTypeLabel(item.content_type)}</span>
                              {item.difficulty && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(item.difficulty)}`}>
                                  {item.difficulty}
                                </span>
                              )}
                            </div>
                            {item.created_at && (
                              <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                          <p className="text-sm text-gray-500">By {trainer.trainer_name}</p>
                          {item.skill_name && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                              {item.skill_name}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}

            {filteredContent.member_content.length === 0 && filteredContent.regular_content.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No content found</p>
                {searchTerm && <p className="text-sm text-gray-400 mt-1">No results matching "{searchTerm}"</p>}
                {!isLoggedIn && (
                  <p className="text-sm text-blue-500 mt-2">
                    Login to see personalized content recommendations!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommended' && (
          <div>
            {recommended.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No recommendations yet.</p>
                <p className="text-sm text-gray-400 mt-1">Complete your skill assessments to get personalized recommendations.</p>
                {!isLoggedIn && (
                  <p className="text-sm text-blue-500 mt-2">
                    Login to see personalized recommendations!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommended.map((item) => (
                  <div 
                    key={item.content_id} 
                    onClick={() => handleCardClick(item.content_url)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden cursor-pointer"
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-4xl">
                      📄
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{getContentTypeLabel(item.content_type)}</span>
                          {item.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(item.difficulty)}`}>
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-base">{item.title}</h3>
                      <p className="text-sm text-gray-500">By {item.trainer_name}</p>
                      {item.skill_name && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                          {item.skill_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trainers' && (
          <div>
            {filteredTrainers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No trainers found.</p>
                {searchTerm && <p className="text-sm text-gray-400 mt-1">No results matching "{searchTerm}"</p>}
                {!isLoggedIn && (
                  <p className="text-sm text-blue-500 mt-2">
                    Login to see personalized trainer matches!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrainers.map((trainer) => {
                  const isPersonalized = trainer.category === 'personalized'
                  const matchScore = personalizedTrainers.find(t => t.trainer_id === trainer.id)?.match_score || 0
                  
                  return (
                    <div key={trainer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {getInitials(trainer.name)}
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-800">{trainer.name}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getCategoryBadge(trainer.category)}`}>
                              {getCategoryLabel(trainer.category)}
                            </span>
                            {isPersonalized && matchScore > 0 && (
                              <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                {matchScore.toFixed(0)}% Match
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600">{trainer.specialty || 'General Trainer'}</p>
                          
                          {trainer.skills_taught && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {trainer.skills_taught.split(',').slice(0, 4).map((skill, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {skill.trim()}
                                </span>
                              ))}
                              {trainer.skills_taught.split(',').length > 4 && (
                                <span className="text-xs text-gray-400">+{trainer.skills_taught.split(',').length - 4} more</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                            {trainer.experience && (
                              <span>🎓 {trainer.experience} years</span>
                            )}
                            {trainer.education && (
                              <span>📚 {trainer.education}</span>
                            )}
                            {trainer.hourly_rate > 0 && (
                              <span className="text-green-600 font-medium">₹{trainer.hourly_rate}/hour</span>
                            )}
                            {trainer.rating > 0 && (
                              <span>⭐ {trainer.rating}/5</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleViewTrainerDetails(trainer)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            View Profile
                          </button>
                          {isPersonalized && (
                            <button
                              onClick={() => handleViewTrainerDetails(trainer)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showTrainerDetail && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Trainer Profile</h2>
              <button
                onClick={closeTrainerDetail}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {getInitials(selectedTrainer.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedTrainer.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getCategoryBadge(selectedTrainer.category)}`}>
                      {getCategoryLabel(selectedTrainer.category)}
                    </span>
                    <span className="text-sm text-gray-500">{selectedTrainer.specialty || 'General Trainer'}</span>
                  </div>
                  {selectedTrainer.rating > 0 && (
                    <p className="text-sm text-yellow-500 mt-1">⭐ {selectedTrainer.rating}/5</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedTrainer.about && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">About</label>
                    <p className="text-gray-800 mt-1">{selectedTrainer.about}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTrainer.specialty && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Specialty</label>
                      <p className="text-gray-800">{selectedTrainer.specialty}</p>
                    </div>
                  )}
                  {selectedTrainer.experience && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-800">{selectedTrainer.experience} years</p>
                    </div>
                  )}
                </div>

                {selectedTrainer.expertise && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expertise</label>
                    <p className="text-gray-800">{selectedTrainer.expertise}</p>
                  </div>
                )}

                {selectedTrainer.qualifications && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Qualifications</label>
                    <p className="text-gray-800">{selectedTrainer.qualifications}</p>
                  </div>
                )}

                {selectedTrainer.skills_taught && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Skills Taught</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTrainer.skills_taught.split(',').map((skill, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrainer.education && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Education</label>
                    <p className="text-gray-800">{selectedTrainer.education}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTrainer.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-800">{selectedTrainer.email}</p>
                    </div>
                  )}
                  {selectedTrainer.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-800">{selectedTrainer.phone}</p>
                    </div>
                  )}
                </div>

                {selectedTrainer.hourly_rate > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                    <p className="text-green-600 font-semibold">₹{selectedTrainer.hourly_rate}/hour</p>
                  </div>
                )}

                {selectedTrainer.available_days && selectedTrainer.available_days.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Available Days</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTrainer.available_days.map((day) => (
                        <span key={day} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrainer.available_time_start && selectedTrainer.available_time_end && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Available Hours</label>
                    <p className="text-gray-800">
                      {selectedTrainer.available_time_start} - {selectedTrainer.available_time_end}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                <button
                  onClick={closeTrainerDetail}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeTrainerDetail()
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningResourcesPage