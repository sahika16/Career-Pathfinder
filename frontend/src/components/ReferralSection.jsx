import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FiCopy, FiShare2 } from 'react-icons/fi'
import API_BASE_URL from '../config'

function ReferralSection({ user }) {
  const [referralData, setReferralData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [referralLink, setReferralLink] = useState('')
  const [applyCode, setApplyCode] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    let currentUser = user
    if (!currentUser) {
      const storedUser = sessionStorage.getItem('careerUser')
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser)
        } catch (e) {}
      }
    }
    
    if (currentUser) {
      const identifier = currentUser.email || currentUser.resumeId || currentUser.id
      if (identifier) {
        fetchReferralInfo(identifier, currentUser)
        checkIfApplied(currentUser)
      } else {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [user])

  const checkIfApplied = async (currentUser) => {
    try {
      const studentId = currentUser.resumeId || currentUser.id
      if (studentId) {
        const response = await axios.get(`${API_BASE_URL}/referral/check/${studentId}`)
        if (response.data && response.data.has_applied) {
          setHasApplied(true)
        }
      }
    } catch (error) {
      console.error('Error checking referral status:', error)
    }
  }

  const fetchReferralInfo = async (identifier, currentUser) => {
    try {
      setLoading(true)
      
      try {
        const response = await axios.get(`${API_BASE_URL}/referral/${encodeURIComponent(identifier)}`)
        if (response.data && response.data.referral_code) {
          setReferralData(response.data)
          setReferralLink(`https://careerpath.synersyst.com/register?ref=${response.data.referral_code}`)
          setLoading(false)
          return
        }
      } catch (error) {
        if (error.response?.status === 404) {
          await generateReferralCode(identifier, currentUser)
        } else {
          console.error('Error fetching referral:', error)
          await generateReferralCode(identifier, currentUser)
        }
      }
    } catch (error) {
      console.error('Error in fetchReferralInfo:', error)
      setLoading(false)
    }
  }

  const generateReferralCode = async (identifier, currentUser) => {
    try {
      const payload = {
        identifier: identifier,
        name: currentUser?.name || 'Student',
        email: currentUser?.email || ''
      }
      
      const response = await axios.post(`${API_BASE_URL}/generate-referral`, payload)
      
      if (response.data && response.data.referral_code) {
        setReferralData({
          referral_code: response.data.referral_code,
          referred_count: 0,
          referral_earnings: 0,
          referral_link: `https://careerpath.synersyst.com/register?ref=${response.data.referral_code}`
        })
        setReferralLink(`https://careerpath.synersyst.com/register?ref=${response.data.referral_code}`)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error generating referral code:', error)
      const tempCode = 'STU' + Math.random().toString(36).substring(2, 6).toUpperCase()
      setReferralData({
        referral_code: tempCode,
        referred_count: 0,
        referral_earnings: 0,
        referral_link: `https://careerpath.synersyst.com/register?ref=${tempCode}`
      })
      setReferralLink(`https://careerpath.synersyst.com/register?ref=${tempCode}`)
      setLoading(false)
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
        text: 'Discover your perfect career path with AI-powered guidance! Sign up and get 10 bonus points!',
        url: referralLink
      })
    } else {
      handleCopyLink()
    }
  }

  const handleApplyReferral = async () => {
    if (!applyCode.trim()) return
    
    if (hasApplied) {
      setApplyMessage('❌ You have already applied a referral code!')
      setTimeout(() => setApplyMessage(''), 5000)
      return
    }
    
    try {
      const storedUser = sessionStorage.getItem('careerUser')
      let studentId = null
      let studentEmail = null
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          studentId = parsed.resumeId || parsed.id
          studentEmail = parsed.email
        } catch (e) {}
      }
      
      const response = await axios.post(`${API_BASE_URL}/referral/apply`, {
        referral_code: applyCode.trim(),
        student_id: studentId,
        student_email: studentEmail || user?.email || ''
      })
      
      setApplyMessage('✅ Referral applied successfully! You earned 10 points!')
      setHasApplied(true)
      setApplyCode('')
      if (studentEmail) {
        fetchReferralInfo(studentEmail, { email: studentEmail })
      }
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

      <div className="bg-gray-50 rounded-xl p-3 mb-3 text-center">
        <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
        <p className="text-2xl font-bold text-gray-900 tracking-widest">{referralData?.referral_code || 'Loading...'}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-600"
        />
        <button
          onClick={handleCopyLink}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex-shrink-0"
        >
          <FiCopy />
        </button>
        <button
          onClick={handleShare}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex-shrink-0"
        >
          <FiShare2 />
        </button>
      </div>

      {copySuccess && (
        <p className="text-sm text-green-600 text-center mb-3">✅ Link copied to clipboard!</p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Have a referral code?</p>
        {hasApplied ? (
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-sm text-green-700">✅ You have already applied a referral code!</p>
            <p className="text-xs text-gray-500 mt-1">You earned 10 points towards your next course.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleApplyReferral}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium flex-shrink-0"
            >
              Apply
            </button>
          </div>
        )}
        {applyMessage && (
          <p className={`text-sm mt-2 ${applyMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
            {applyMessage}
          </p>
        )}
      </div>

      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-700">
          💡 Each referral earns you <strong>10 points</strong>. Points can be redeemed for courses.
        </p>
      </div>
    </div>
  )
}

export default ReferralSection