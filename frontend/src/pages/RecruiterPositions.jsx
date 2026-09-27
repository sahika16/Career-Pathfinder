import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../config'

const WORK_MODES = ['On-site', 'Hybrid', 'Remote']
const EMPLOYMENT_TYPES = ['Full-time', 'Internship', 'Contract', 'Apprenticeship']
const QUALIFICATIONS = ['B.E.', 'B.Tech', 'BCA', 'MCA', 'B.Sc.', 'M.Sc.', 'MBA', 'Other']

function RecruiterPositions({ user, onLogout }) {
  const navigate = useNavigate()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [form, setForm] = useState({
    title: '',
    department: '',
    vacancies: 1,
    location: '',
    work_mode: '',
    employment_type: 'Full-time',
    min_qualification: '',
    specialization: '',
    graduation_years: '',
    min_percentage: '',
    required_skills: '',
    preferred_skills: '',
    experience_level: 'Fresher',
    salary_range: '',
    joining_requirement: 'Immediately'
  })

  useEffect(() => { fetchPositions() }, [])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/recruiter/${user.id}/positions`)
      setPositions(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }

    try {
      setSubmitting(true)
      setError(null)
      await axios.post(`${API_BASE_URL}/recruiter/position`, {
        ...form,
        recruiter_id: user.id,
        vacancies: parseInt(form.vacancies) || 1
      })
      setSuccess('Position created successfully!')
      setShowForm(false)
      setForm({
        title: '', department: '', vacancies: 1, location: '',
        work_mode: '', employment_type: 'Full-time',
        min_qualification: '', specialization: '',
        graduation_years: '', min_percentage: '',
        required_skills: '', preferred_skills: '',
        experience_level: 'Fresher', salary_range: '',
        joining_requirement: 'Immediately'
      })
      fetchPositions()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create position')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto pt-28 px-6 pb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Positions</h1>
            <p className="text-gray-500">Create and manage job openings</p>
          </div>
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            ← Dashboard
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2.5 rounded-lg font-medium mb-6 ${showForm ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
        >
          {showForm ? 'Cancel' : '+ Post a Position'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Create Position</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
                <input className={inputClass} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g., Java Developer – Fresher" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input className={inputClass} value={form.department} onChange={e => update('department', e.target.value)} placeholder="IT / Software" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Vacancies</label>
                <input type="number" className={inputClass} value={form.vacancies} onChange={e => update('vacancies', e.target.value)} min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className={inputClass} value={form.location} onChange={e => update('location', e.target.value)} placeholder="Pune" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                <select className={inputClass} value={form.work_mode} onChange={e => update('work_mode', e.target.value)}>
                  <option value="">Select</option>
                  {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select className={inputClass} value={form.employment_type} onChange={e => update('employment_type', e.target.value)}>
                  {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Qualification</label>
                <select className={inputClass} value={form.min_qualification} onChange={e => update('min_qualification', e.target.value)}>
                  <option value="">Select</option>
                  {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input className={inputClass} value={form.specialization} onChange={e => update('specialization', e.target.value)} placeholder="Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Years (comma-separated)</label>
                <input className={inputClass} value={form.graduation_years} onChange={e => update('graduation_years', e.target.value)} placeholder="2025,2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Percentage/CGPA</label>
                <input className={inputClass} value={form.min_percentage} onChange={e => update('min_percentage', e.target.value)} placeholder="60%" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                <input className={inputClass} value={form.required_skills} onChange={e => update('required_skills', e.target.value)} placeholder="Java, Spring Boot, SQL" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Skills (comma-separated)</label>
                <input className={inputClass} value={form.preferred_skills} onChange={e => update('preferred_skills', e.target.value)} placeholder="AWS, Docker" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <input className={inputClass} value={form.experience_level} onChange={e => update('experience_level', e.target.value)} placeholder="Fresher / 0-1 year" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                <input className={inputClass} value={form.salary_range} onChange={e => update('salary_range', e.target.value)} placeholder="₹3–5 LPA" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Requirement</label>
                <input className={inputClass} value={form.joining_requirement} onChange={e => update('joining_requirement', e.target.value)} placeholder="Immediately / 30 days" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Position'}
            </button>
          </form>
        )}

        {/* Positions List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : positions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No positions created yet.</p>
              <p className="text-sm text-gray-400 mt-1">Post your first position to receive candidate recommendations.</p>
            </div>
          ) : (
            positions.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{p.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {p.department} • {p.location || 'Location N/A'} • {p.employment_type} • {p.work_mode || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Skills:</span> {p.required_skills || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Vacancies: {p.vacancies} • Candidates received: <span className="font-semibold text-green-600">{p.candidate_count}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      p.status === 'open' ? 'bg-green-100 text-green-700' :
                      p.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.status}</span>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RecruiterPositions