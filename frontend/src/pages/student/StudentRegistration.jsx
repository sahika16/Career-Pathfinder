import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../../config'

function StudentRegistration() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [referralCode, setReferralCode] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    year_of_passout: '',
    degree: '',
    branch: '',
    experience: '',
    skills: ''
  })

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
      // Store referral code in sessionStorage for later use
      sessionStorage.setItem('referralCode', ref)
      console.log('Referral code detected:', ref)
    }
  }, [searchParams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Check if email already registered
      try {
        const checkEmailResponse = await axios.get(`${API_BASE_URL}/student/check-email/${formData.email}`)
        if (checkEmailResponse.data.exists) {
          setError('This email is already registered. Please login instead.')
          setLoading(false)
          return
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Email check error:', err)
        }
      }

      // Check if phone already registered
      try {
        const checkPhoneResponse = await axios.get(`${API_BASE_URL}/student/check-phone/${formData.phone}`)
        if (checkPhoneResponse.data.exists) {
          setError('This phone number is already registered. Please login instead.')
          setLoading(false)
          return
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Phone check error:', err)
        }
      }

      // Register the student
      const registerResponse = await axios.post(`${API_BASE_URL}/student/register`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        year_of_passout: formData.year_of_passout || '',
        degree: formData.degree || '',
        branch: formData.branch || '',
        experience: formData.experience || '',
        skills: formData.skills || ''
      })

      const studentId = registerResponse.data.id

      // If referral code exists, apply it
      if (referralCode) {
        try {
          await axios.post(`${API_BASE_URL}/referral/apply`, {
            referral_code: referralCode,
            student_id: studentId,
            student_email: formData.email.trim()
          })
          console.log('✅ Referral code applied successfully!')
        } catch (refError) {
          console.error('Error applying referral code:', refError)
          // Don't block registration if referral fails
        }
      }

      setSuccess('Registration successful! You earned 10 bonus points! Redirecting to login...')
      setTimeout(() => {
        navigate('/login/student')
      }, 2000)

    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleGoToLogin = () => {
    navigate('/login/student')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-2xl mx-auto pt-24 pb-12 px-6">
        {/* Back Button */}
        <button
          onClick={handleBackToHome}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition mb-4 cursor-pointer"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Student Registration
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">
              Create Your Account
            </h1>
            <p className="text-gray-600 mt-2">
              Register with your details to get started
            </p>
            {referralCode && (
              <div className="mt-3 inline-block bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                🎉 Referral code <strong>{referralCode}</strong> detected! You'll get 10 bonus points!
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-blue-600 hover:underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Phone - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your 10-digit phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Year of Passout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Passout
              </label>
              <input
                type="text"
                name="year_of_passout"
                value={formData.year_of_passout}
                onChange={handleChange}
                placeholder="e.g., 2024, 2025"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Degree */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="e.g., B.Tech, MCA, B.Sc"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g., Computer Science, IT, Electronics"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g., Fresher, 2 years, 5+ years"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., Python, React, SQL (comma separated)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Login Here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StudentRegistration