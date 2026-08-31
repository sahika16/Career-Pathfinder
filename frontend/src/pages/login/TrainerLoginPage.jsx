import React, { useState } from 'react'
import API_BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'


function TrainerLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.post(`${API_BASE_URL}/login/trainer`, {
        email: email.trim(),
        password: password
      })
      
      const data = response.data
      
      if (!data.is_approved) {
        setError('Your account is pending approval. Please wait for admin approval.')
        setLoading(false)
        return
      }
      
      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role || 'trainer',
        category: data.category || 'regular',
        is_approved: data.is_approved
      }
      
      // Store in sessionStorage
      sessionStorage.setItem('careerUser', JSON.stringify(userData))
      sessionStorage.setItem('careerLoginTime', Date.now().toString())
      
      // ====== REDIRECT BASED ON CATEGORY ======
      if (userData.role === 'member') {
        navigate('/member-dashboard')
      } else if (userData.category === 'personalized') {
        navigate('/personalized-dashboard')
      } else {
        navigate('/trainer-dashboard')
      }
      
    } catch (err) {
      console.error('Login error:', err)
      if (err.response?.status === 403) {
        setError('Your account is pending approval. Please wait for admin approval.')
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => {
    navigate('/trainer/register')
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
              Trainer Login
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">
              Welcome!
            </h1>
            <p className="text-gray-600 mt-2">
              Enter your credentials to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={handleRegister}
                className="text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Register as Trainer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerLoginPage