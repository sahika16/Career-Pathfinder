import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAllSkillNames, getAllQuestions, addQuestion, updateQuestion, deleteQuestion, addAdminSkill } from '../utils/api'

function AdminSkills({ user, onLogout }) {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [skillQuestions, setSkillQuestions] = useState([])
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [questionForm, setQuestionForm] = useState({
    skill_name: '',
    difficulty: 'Medium',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [skillsData, questionsData] = await Promise.all([
        getAllSkillNames(),
        getAllQuestions()
      ])
      
      const skillList = skillsData.skills || []
      const skillWithCounts = skillList.map(skill => ({
        name: skill,
        count: questionsData.filter(q => q.skill_name === skill).length
      }))
      
      setSkills(skillWithCounts)
      
      if (skillWithCounts.length > 0 && !selectedSkill) {
        setSelectedSkill(skillWithCounts[0].name)
        setSkillQuestions(questionsData.filter(q => q.skill_name === skillWithCounts[0].name))
      } else if (selectedSkill) {
        setSkillQuestions(questionsData.filter(q => q.skill_name === selectedSkill))
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkillClick = (skillName) => {
    setSelectedSkill(skillName)
    setShowAddQuestion(false)
    setEditingQuestionId(null)
    getAllQuestions().then(data => {
      setSkillQuestions(data.filter(q => q.skill_name === skillName))
    }).catch(err => {
      console.error('Error fetching questions:', err)
    })
  }

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      setError('Please enter a skill name')
      return
    }
    try {
      await addAdminSkill(newSkillName.trim())
      setSuccessMessage(`Skill "${newSkillName}" added successfully!`)
      setShowAddSkill(false)
      setNewSkillName('')
      await fetchData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add skill.')
    }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!questionForm.question_text.trim()) {
      setError('Please enter question text')
      return
    }
    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, questionForm)
        setSuccessMessage('Question updated successfully!')
      } else {
        await addQuestion(questionForm)
        setSuccessMessage('Question added successfully!')
      }
      setShowAddQuestion(false)
      setEditingQuestionId(null)
      setQuestionForm({
        skill_name: selectedSkill || '',
        difficulty: 'Medium',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: ''
      })
      await fetchData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to save question.')
    }
  }

  const handleEditQuestion = (question) => {
    setQuestionForm({
      skill_name: question.skill_name,
      difficulty: question.difficulty,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation || ''
    })
    setEditingQuestionId(question.id)
    setShowAddQuestion(true)
  }

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteQuestion(id)
      setSuccessMessage('Question deleted!')
      await fetchData()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to delete question.')
    }
  }

  const goBackToDashboard = () => {
    navigate('/admin-dashboard')
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
      
      <div className="max-w-7xl mx-auto pt-28 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skills Management</h1>
            <p className="text-gray-500">View all skills and manage their questions</p>
          </div>
          <button
            onClick={goBackToDashboard}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={fetchData} className="ml-3 text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Skills</h3>
              <button
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAddSkill ? '✕' : '+ Add'}
              </button>
            </div>

            {showAddSkill && (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="New skill name"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddSkill}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {skills.map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => handleSkillClick(skill.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedSkill === skill.name
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{skill.name}</span>
                  <span className="float-right text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {skill.count}
                  </span>
                </button>
              ))}
              {skills.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No skills yet</p>
              )}
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            {selectedSkill ? (
              <>
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Questions for <span className="text-blue-600">{selectedSkill}</span>
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({skillQuestions.length} questions)
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddQuestion(!showAddQuestion)
                      setEditingQuestionId(null)
                      if (!showAddQuestion) {
                        setQuestionForm({
                          skill_name: selectedSkill,
                          difficulty: 'Medium',
                          question_text: '',
                          option_a: '',
                          option_b: '',
                          option_c: '',
                          option_d: '',
                          correct_answer: 'A',
                          explanation: ''
                        })
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    {showAddQuestion ? '✕ Cancel' : '+ Add Question'}
                  </button>
                </div>

                {showAddQuestion && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">
                      {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                    </h4>
                    <form onSubmit={handleAddQuestion} className="space-y-3">
                      <textarea
                        value={questionForm.question_text}
                        onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                        placeholder="Enter question..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={questionForm.option_a}
                          onChange={(e) => setQuestionForm({...questionForm, option_a: e.target.value})}
                          placeholder="Option A"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          value={questionForm.option_b}
                          onChange={(e) => setQuestionForm({...questionForm, option_b: e.target.value})}
                          placeholder="Option B"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          value={questionForm.option_c}
                          onChange={(e) => setQuestionForm({...questionForm, option_c: e.target.value})}
                          placeholder="Option C"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          value={questionForm.option_d}
                          onChange={(e) => setQuestionForm({...questionForm, option_d: e.target.value})}
                          placeholder="Option D"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={questionForm.difficulty}
                          onChange={(e) => setQuestionForm({...questionForm, difficulty: e.target.value})}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <select
                          value={questionForm.correct_answer}
                          onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <input
                          value={questionForm.explanation}
                          onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                          placeholder="Explanation (optional)"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        {editingQuestionId ? 'Update' : 'Add'} Question
                      </button>
                    </form>
                  </div>
                )}

                {skillQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions for this skill yet.</p>
                    <p className="text-sm">Click "Add Question" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {skillQuestions.map((q, index) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">Q{index + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm">{q.question_text}</p>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-gray-600">
                              <span>A: {q.option_a}</span>
                              <span>B: {q.option_b}</span>
                              <span>C: {q.option_c}</span>
                              <span>D: {q.option_d}</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">Correct: {q.correct_answer}</p>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Select a skill from the left to view its questions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSkills