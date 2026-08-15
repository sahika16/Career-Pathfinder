import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getSkills, updateSkill, deleteSkill, addSkill } from '../utils/api'

function SkillReviewPage({ user, onLogout }) {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)

  useEffect(() => {
    fetchSkills()
  }, [resumeId])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSkills(resumeId)
      setSkills(data || [])
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError('Failed to load skills. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (skill) => {
    setEditingId(skill.id)
    setEditValue(skill.skill_name)
  }

  const handleSaveEdit = async (skillId) => {
    try {
      await updateSkill(skillId, { skill_name: editValue })
      setSkills(skills.map(s => 
        s.id === skillId ? { ...s, skill_name: editValue } : s
      ))
      setEditingId(null)
      setEditValue('')
    } catch (err) {
      setError('Failed to update skill. Please try again.')
    }
  }

  const handleDelete = async (skillId) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await deleteSkill(skillId)
        setSkills(skills.filter(s => s.id !== skillId))
      } catch (err) {
        setError('Failed to delete skill. Please try again.')
      }
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      alert('Please enter a skill name')
      return
    }

    try {
      const data = await addSkill(resumeId, newSkill.trim())
      setSkills([...skills, { id: data.id, skill_name: newSkill.trim() }])
      setNewSkill('')
      setShowAddInput(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add skill. Please try again.')
    }
  }

  const handleContinue = () => {
    if (skills.length === 0) {
      alert('Please add at least one skill before continuing.')
      return
    }
    navigate(`/skill-rating/${resumeId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Navbar user={user} onLogout={onLogout} />
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} onLogout={onLogout} />
      <div className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
            Step 1 of 2
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-6">
            Review Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">Skills</span>
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Review the skills we extracted from your resume. Edit, delete, or add new skills as needed.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6">
            {error}
            <button 
              onClick={fetchSkills} 
              className="ml-4 text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-3">
          {skills.map((skill) => (
            <div 
              key={skill.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 p-4 flex items-center justify-between"
            >
              {editingId === skill.id ? (
                <div className="flex-1 flex items-center space-x-3">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(skill.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-lg font-medium text-gray-800">{skill.skill_name}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(skill)}
                      className="text-blue-500 hover:text-blue-700 transition p-2"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="text-red-500 hover:text-red-700 transition p-2"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {skills.length === 0 && !showAddInput && !error && (
          <div className="text-center mt-8">
            <p className="text-gray-500">No skills found. Add your skills manually.</p>
          </div>
        )}

        <div className="mt-6">
          {showAddInput ? (
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill name..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddSkill}
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-xl hover:shadow-lg transition font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddInput(false)
                  setNewSkill('')
                }}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#667eea] hover:text-[#667eea] transition font-semibold"
            >
              + Add Skill
            </button>
          )}
        </div>

        <div className="mt-10">
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 rounded-xl hover:shadow-lg transition font-bold text-lg"
          >
            Confirm & Continue →
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkillReviewPage