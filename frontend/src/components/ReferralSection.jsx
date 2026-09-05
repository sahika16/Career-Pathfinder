import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FiCopy, FiShare2, FiAward, FiUsers, FiGift } from 'react-icons/fi'

const API_BASE_URL = 'http://localhost:8000/api'

function ReferralSection({ user }) {
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [referralLink, setReferralLink] = useState('')
  const [applyCode, setApplyCode] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [userIdentifier, setUserIdentifier] = useState(null)

  useEffect(() => {
    // Get user from session storage if not passed as prop
    let currentUser = user
    if (!currentUser) {
      const storedUser = sessionStorage.getItem('careerUser')
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser)
        } catch (e) {}
      }
    }
    
    // Use resumeId if available, otherwise use email or name as identifier
    if (currentUser) {
      const identifier = currentUser.resumeId || currentUser.id || currentUser.email
      if (identifier) {
        setUserIdentifier(identifier)
        fetchReferralInfo(identifier, currentUser)
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchReferralInfo = async (identifier, currentUser) => {
    try {
      setLoading(true)
      
      // Try to get existing referral info
      const response = await axios.get(`${API_BASE_URL}/referral/${identifier}`)
      setReferralData(response.data)
      setReferralLink(response.data.referral_link)
    } catch (error) {
      // If no referral code exists, generate one
      if (error.response?.status === 404) {
        await generateReferralCode(identifier, currentUser)
      } else {
        console.error('Error fetching referral info:', error)
        // Try generating a code using email as fallback
        if (currentUser?.email) {
          await generateReferralCode(currentUser.email, currentUser)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = async (identifier, currentUser) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-referral`, {
        identifier: identifier,
        name: currentUser?.name || 'Student',
        email: currentUser?.email || ''
      })
      
      setReferralData({
        referral_code: response.data.referral_code,
        referred_count: 0,
        referral_earnings: 0,
        referral_link: `https://careerpathfinder.com/signup?ref=${response.data.referral_code}`
      })
      setReferralLink(`https://careerpathfinder.com/signup?ref=${response.data.referral_code}`)
    } catch (error) {
      console.error('Error generating referral code:', error)
      // Fallback: generate a temporary code
      const tempCode = 'STU' + Math.random().toString(36).substring(2, 6).toUpperCase()
      setReferralData({
        referral_code: tempCode,
        referred_count: 0,
        referral_earnings: 0,
        referral_link: `https://careerpathfinder.com/signup?ref=${tempCode}`
      })
      setReferralLink(`https://careerpathfinder.com/signup?ref=${tempCode}`)
    }
  }

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Career Pathfinder',
        text: 'Discover your perfect career path with AI-powered guidance!',
        url: referralLink
      })
    } else {
      handleCopyLink()
    }
  }

  const handleApplyReferral = async () => {
    if (!applyCode.trim()) return
    
    try {
      const storedUser = sessionStorage.getItem('careerUser')
      let studentId = null
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          studentId = parsed.resumeId || parsed.id || parsed.email
        } catch (e) {}
      }
      
      const response = await axios.post(`${API_BASE_URL}/referral/apply`, {
        referral_code: applyCode.trim(),
        student_id: studentId,
        student_email: user?.email || ''
      })
      setApplyMessage('✅ Referral applied successfully!')
      setApplyCode('')
      setTimeout(() => setApplyMessage(''), 5000)
    } catch (error) {
      setApplyMessage('❌ ' + (error.response?.data?.detail || 'Invalid referral code'))
      setTimeout(() => setApplyMessage(''), 5000)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="text-center mb-4">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          Refer & Earn
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-2">Invite Friends, Earn Rewards</h3>
        <p className="text-sm text-gray-500">Share your referral code and earn rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{referralData?.referral_earnings || 0}</p>
          <p className="text-xs text-gray-500">Reward Points</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-purple-600">{referralData?.referred_count || 0}</p>
          <p className="text-xs text-gray-500">Referred Friends</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-600">1</p>
          <p className="text-xs text-gray-500">Per Referral</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3 text-center">
        <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
        <p className="text-2xl font-bold text-gray-900 tracking-widest">{referralData?.referral_code}</p>
      </div>

      {/* Referral Link */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-600"
        />
        <button
          onClick={handleCopyLink}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Copy
        </button>
        <button
          onClick={handleShare}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
        >
          Share
        </button>
      </div>

      {copySuccess && (
        <p className="text-sm text-green-600 text-center mb-3">✅ Link copied to clipboard!</p>
      )}

      {/* Apply Referral Code */}
      {!user?.referred_by && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleApplyReferral}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
            >
              Apply
            </button>
          </div>
          {applyMessage && (
            <p className={`text-sm mt-2 ${applyMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {applyMessage}
            </p>
          )}
        </div>
      )}

      {/* Rewards Info */}
      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          💡 Each referral earns you <strong>1 point</strong>. Points can be redeemed for exclusive career resources.
        </p>
      </div>
    </div>
  )
}

export default ReferralSection