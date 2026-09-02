import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProfileDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayUser, setDisplayUser] = useState(user)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let currentUser = user
    if (!currentUser || !currentUser.resumeId) {
      const storedUser = sessionStorage.getItem('careerUser')
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser)
          setDisplayUser(currentUser)
        } catch (e) {}
      }
    } else {
      setDisplayUser(user)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const handleLogout = () => {
    setIsOpen(false)
    sessionStorage.removeItem('careerUser')
    sessionStorage.removeItem('careerLoginTime')
    onLogout()
    navigate('/')
  }

  const handleDashboard = () => {
    setIsOpen(false)
    navigate('/dashboard')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center hover:shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title={displayUser?.name || 'User'}
      >
        {getInitials(displayUser?.name)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-3xl flex items-center justify-center mx-auto mb-3 border-3 border-white/40 shadow-lg">
              {getInitials(displayUser?.name)}
            </div>
            <p className="text-white font-semibold text-lg truncate">{displayUser?.name || 'Student'}</p>
            <p className="text-white/80 text-sm truncate">{displayUser?.email || 'No email'}</p>
          </div>

          <button
            onClick={handleDashboard}
            className="w-full px-6 py-3.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition font-medium flex items-center space-x-3 border-b border-gray-100"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-3.5 text-left text-sm text-red-600 hover:bg-red-50 transition font-medium flex items-center space-x-3"
          >
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown