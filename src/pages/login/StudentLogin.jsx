import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { sendLoginOTP, verifyLoginOTP, checkUserExists, getUserProgress } from '../../utils/api'

function StudentLogin({ onLogin }) {
  const navigate = useNavigate()
  
  const [step, setStep] = useState('send')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const [deliveryMethod, setDeliveryMethod] = useState('')

  const handleSendOTP = async () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const userCheck = await checkUserExists(emailOrPhone.trim())
      
      if (!userCheck.exists) {
        setError('No account found with this email/phone. Please upload resume first.')
        setLoading(false)
        return
      }
      
      const input = emailOrPhone.trim()
      const isEmail = input.includes('@') && input.includes('.')
      setDeliveryMethod(isEmail ? 'email' : 'phone')
      
      const data = await sendLoginOTP(input)
      setResumeData(data)
      setSuccess(true)
      setStep('verify')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await verifyLoginOTP(otp, resumeData.resume_id)
      
      const progress = await getUserProgress(resumeData.resume_id)
      
      alert(`Welcome, ${data.name}!`)
      
      let redirectPath = '/'
      if (progress.skills_rated && progress.total_skills > 0) {
        redirectPath = '/assessment'
      } else if (progress.has_skills && progress.total_skills > 0) {
        redirectPath = `/skill-rating/${data.resume_id}`
      } else {
        redirectPath = `/skill-review/${data.resume_id}`
      }
      
      const userData = {
        name: data.name || 'Student',
        email: data.email || 'No email',
        resumeId: data.resume_id,
        has_skills: progress.has_skills || false,
        skills_rated: progress.skills_rated || false,
        current_step: progress.current_step || 'review',
        role: 'student'
      }
      
      localStorage.setItem('careerUser', JSON.stringify(userData))
      localStorage.setItem('careerLoginTime', Date.now().toString())
      
      onLogin(userData)
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-md mx-auto pt-24 pb-12 px-6">
        <button onClick={handleBackToHome} className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition mb-4">
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Login</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">{step === 'send' ? 'Welcome!' : 'Verify OTP'}</h1>
            <p className="text-gray-600 mt-2">
              {step === 'send' ? '' : `Enter the 6-digit OTP sent to your ${deliveryMethod === 'email' ? 'email' : 'phone'}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
          )}

          {step === 'send' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email or Phone Number</label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter your email or phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-2">Enter the email or phone number which was in resume</p>
              </div>

              <button onClick={handleSendOTP} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-2">OTP expires in 5 minutes • Check your {deliveryMethod === 'email' ? 'email' : 'phone'}</p>
              </div>

              <button onClick={handleVerifyOTP} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button onClick={() => { setStep('send'); setOtp(''); setError(null) }} className="w-full mt-3 text-gray-500 hover:text-gray-700 transition text-sm">← Back</button>
              <button onClick={handleSendOTP} disabled={loading} className="w-full mt-2 text-blue-500 hover:text-blue-700 transition text-sm">Resend OTP</button>
            </>
          )}

          {success && step === 'verify' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
              OTP sent successfully! Check your {deliveryMethod === 'email' ? 'email' : 'phone number'}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentLogin