import React, { useState } from 'react'
import API_BASE_URL from '../../config'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'

function InstituteLoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(`${API_BASE_URL}/institute/login`, formData)
      const data = response.data

      if (!data.is_approved || data.status === 'pending_approval') {
        setError('Your account is pending admin approval. You will be able to login once approved.')
        setLoading(false)
        return
      }

      if (data.status === 'rejected') {
        setError('Your registration was rejected. Please contact support for more information.')
        setLoading(false)
        return
      }

      if (data.status === 'suspended') {
        setError('Your account has been suspended. Please contact support.')
        setLoading(false)
        return
      }

      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        institute_name: data.institute_name,
        institute_type: data.institute_type,
        role: 'institute',
        is_approved: data.is_approved,
        status: data.status,
        referral_code: data.referral_code
      }

      if (onLogin) onLogin(userData)
      navigate('/institute-dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-24 pb-12 px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition mb-4"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Institute Login
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Welcome!</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/institute/register')}
                className="text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Register as Institute/Partner
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstituteLoginPage