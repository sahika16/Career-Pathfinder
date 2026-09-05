import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../../config'

function PersonalizedTrainerDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchResult, setSearchResult] = useState(null)
  const [activeTab, setActiveTab] = useState('students')
  const [filterLevel, setFilterLevel] = useState('all')

  const [formData, setFormData] = useState({
    student_email: '',
    skill_name: '',
    current_level: '',
    target_level: '',
    total_sessions: '',
    session_duration: '',
    price_per_session: '',
    notes: ''
  })

  const [availability, setAvailability] = useState({
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    hourly_rate: 0,
    skills_offered: []
  })

  const [trainerSettings, setTrainerSettings] = useState({
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    about: '',
    expertise: '',
    qualifications: '',
    hourly_rate: '',
    skills_taught: ''
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const levels = ['Beginner', 'Intermediate', 'Advanced']
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (user && user.id) {
      fetchStudents()
      fetchTrainerSettings()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/personalized/students/${user.id}`)
      setStudents(response.data)
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainerSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trainer/settings/${user.id}`)
      if (response.data) {
        const data = response.data
        setTrainerSettings({
          available_days: data.available_days || [],
          available_time_start: data.available_time_start || '',
          available_time_end: data.available_time_end || '',
          about: data.about || '',
          expertise: data.expertise || '',
          qualifications: data.qualifications || '',
          hourly_rate: data.hourly_rate || '',
          skills_taught: data.skills_taught || ''
        })
        setAvailability({
          available_days: data.available_days || [],
          available_time_start: data.available_time_start || '',
          available_time_end: data.available_time_end || '',
          hourly_rate: parseFloat(data.hourly_rate) || 0,
          skills_offered: data.skills_taught ? data.skills_taught.split(',').map(s => s.trim()) : []
        })
      }
    } catch (err) {
      console.error('Error fetching trainer settings:', err)
    }
  }

  const getFilteredStudents = () => {
    if (filterLevel === 'all') return students
    return students.filter(s => s.current_level === filterLevel || s.target_level === filterLevel)
  }

  const getLevelCount = (level) => {
    return students.filter(s => s.current_level === level || s.target_level === level).length
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target
    setAvailability(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDayToggle = (day) => {
    setAvailability(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !availability.skills_offered.includes(skillInput.trim())) {
      setAvailability(prev => ({
        ...prev,
        skills_offered: [...prev.skills_offered, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setAvailability(prev => ({
      ...prev,
      skills_offered: prev.skills_offered.filter(s => s !== skill)
    }))
  }

  const handleSearchStudent = async () => {
    if (!formData.student_email) {
      setError('Please enter student email')
      return
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/student/find/${formData.student_email}`)
      setSearchResult(response.data)
      setError(null)
    } catch (err) {
      setError('Student not found with this email')
      setSearchResult(null)
    }
  }

  const handleAssignStudent = async (e) => {
    e.preventDefault()
    if (!searchResult) {
      setError('Please search for a student first')
      return
    }

    if (!formData.skill_name || !formData.current_level || !formData.target_level || !formData.total_sessions) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/trainer/personalized/assign`, {
        ...formData,
        trainer_id: user.id,
        student_id: searchResult.id,
        student_name: searchResult.name,
        student_email: searchResult.email,
        total_sessions: parseInt(formData.total_sessions) || 0,
        price_per_session: parseFloat(formData.price_per_session) || 0,
        session_duration: parseInt(formData.session_duration) || 0
      })
      setSuccess('Student assigned successfully!')
      setShowAddStudent(false)
      setFormData({ 
        student_email: '', 
        skill_name: '', 
        current_level: '', 
        target_level: '', 
        total_sessions: '',
        session_duration: '',
        price_per_session: '',
        notes: ''
      })
      setSearchResult(null)
      fetchStudents()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign student')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSaveAvailability = async (e) => {
    e.preventDefault()
    try {
      const settingsData = {
        available_days: availability.available_days,
        available_time_start: availability.available_time_start,
        available_time_end: availability.available_time_end,
        hourly_rate: availability.hourly_rate.toString(),
        skills_taught: availability.skills_offered.join(', '),
        about: trainerSettings.about,
        expertise: trainerSettings.expertise,
        qualifications: trainerSettings.qualifications
      }
      
      await axios.put(`${API_BASE_URL}/trainer/settings/${user.id}`, settingsData)
      setSuccess('Availability and settings saved successfully!')
      fetchTrainerSettings()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      const settingsData = {
        available_days: availability.available_days,
        available_time_start: availability.available_time_start,
        available_time_end: availability.available_time_end,
        hourly_rate: availability.hourly_rate.toString(),
        skills_taught: availability.skills_offered.join(', '),
        about: trainerSettings.about,
        expertise: trainerSettings.expertise,
        qualifications: trainerSettings.qualifications
      }
      
      await axios.put(`${API_BASE_URL}/trainer/settings/${user.id}`, settingsData)
      setSuccess('Profile saved successfully!')
      
      setTrainerSettings({
        available_days: [],
        available_time_start: '',
        available_time_end: '',
        about: '',
        expertise: '',
        qualifications: '',
        hourly_rate: '',
        skills_taught: ''
      })
      setAvailability({
        available_days: [],
        available_time_start: '',
        available_time_end: '',
        hourly_rate: 0,
        skills_offered: []
      })
      setSkillInput('')
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleUpdateStatus = async (coachingId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/trainer/personalized/status/${coachingId}`, { status })
      fetchStudents()
      setSuccess('Status updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleIncrementSession = async (coachingId) => {
    try {
      await axios.put(`${API_BASE_URL}/trainer/personalized/session/${coachingId}`)
      fetchStudents()
      setSuccess('Session count updated!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to update session count')
    }
  }

  const handleDeleteCoaching = async (coachingId) => {
    if (window.confirm('Remove this student from coaching?')) {
      try {
        await axios.delete(`${API_BASE_URL}/trainer/personalized/coaching/${coachingId}`)
        fetchStudents()
        setSuccess('Student removed successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError('Failed to remove student')
      }
    }
  }

  if (!user || !user.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredStudents = getFilteredStudents()

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto pt-24 px-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Personalized Coaching Dashboard</h1>
          <p className="text-gray-500">Manage one-on-one coaching sessions and students</p>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-purple-600">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Active Sessions</p>
            <p className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {students.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {levels.map((level) => (
            <div key={level} className="bg-white rounded-xl shadow-sm p-3 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">{level}</p>
              <p className="text-lg font-bold text-purple-600">{getLevelCount(level)}</p>
              <p className="text-xs text-gray-400">students</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'students' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'availability' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Availability & Pricing
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Profile Settings
          </button>
        </div>

        {activeTab === 'students' && (
          <>
            <button
              onClick={() => setShowAddStudent(!showAddStudent)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                showAddStudent 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {showAddStudent ? 'Cancel' : '+ Assign New Student'}
            </button>

            {showAddStudent && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Assign One-on-One Coaching</h2>
                <form onSubmit={handleAssignStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Email *</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          name="student_email"
                          value={formData.student_email}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                          <p className="text-sm text-green-700">Found: {searchResult.name} ({searchResult.email})</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill to Teach *</label>
                      <input
                        type="text"
                        name="skill_name"
                        value={formData.skill_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="e.g., Python, Data Science"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Level *</label>
                      <select
                        name="current_level"
                        value={formData.current_level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Based on student rating: 1-4 Beginner, 5-7 Intermediate, 8-10 Advanced</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Level *</label>
                      <select
                        name="target_level"
                        value={formData.target_level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions *</label>
                      <input
                        type="number"
                        name="total_sessions"
                        value={formData.total_sessions}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        min="1"
                        placeholder="Number of sessions"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration (minutes)</label>
                      <input
                        type="number"
                        name="session_duration"
                        value={formData.session_duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        min="15"
                        placeholder="Minutes per session"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Session (₹)</label>
                      <input
                        type="number"
                        name="price_per_session"
                        value={formData.price_per_session}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="0 for free"
                        min="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="Any special notes about this coaching..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    disabled={!searchResult}
                  >
                    Assign Student
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="font-medium text-gray-700 text-sm">Filter by Level:</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="all">All Levels</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  {filteredStudents.length} students found
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Your Coaching Students</h2>
                <span className="text-sm text-gray-500">{filteredStudents.length} students</span>
              </div>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No coaching students assigned yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Assign New Student" to start coaching.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{student.student_name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              student.status === 'active' ? 'bg-green-100 text-green-700' :
                              student.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.status.toUpperCase()}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {student.current_level} → {student.target_level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{student.student_email}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span>Skill: {student.skill_name}</span>
                            <span>Sessions: {student.session_count}/{student.total_sessions}</span>
                            {student.price_per_session > 0 && (
                              <span>₹{student.price_per_session}/session</span>
                            )}
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                            <div 
                              className="h-2 bg-purple-600 rounded-full transition-all"
                              style={{ width: `${(student.session_count / student.total_sessions) * 100}%` }}
                            />
                          </div>
                          {student.notes && (
                            <p className="text-sm text-gray-500 mt-2">📌 {student.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(student.id, 'active')}
                              className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition"
                            >
                              Start Coaching
                            </button>
                          )}
                          {student.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleIncrementSession(student.id)}
                                className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition"
                              >
                                + Session
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(student.id, 'completed')}
                                className="bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 transition"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteCoaching(student.id)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition"
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

        {activeTab === 'availability' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Availability & Pricing</h2>
            <form onSubmit={handleSaveAvailability} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        availability.available_days.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="available_time_start"
                    value={availability.available_time_start}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="available_time_end"
                    value={availability.available_time_end}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹/hour)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={availability.hourly_rate}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="0 for free"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills Offered</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Add skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availability.skills_offered.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Save Availability & Pricing
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Profile Settings</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                  <textarea
                    name="about"
                    value={trainerSettings.about}
                    onChange={(e) => setTrainerSettings(prev => ({ ...prev, about: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Tell students about your coaching style and experience..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise</label>
                  <input
                    type="text"
                    name="expertise"
                    value={trainerSettings.expertise}
                    onChange={(e) => setTrainerSettings(prev => ({ ...prev, expertise: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="e.g., Python, Data Science, Web Development"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={trainerSettings.qualifications}
                    onChange={(e) => setTrainerSettings(prev => ({ ...prev, qualifications: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="e.g., M.Tech, 5+ years experience"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Save Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalizedTrainerDashboard