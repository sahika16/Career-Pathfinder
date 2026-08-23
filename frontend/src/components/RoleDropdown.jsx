import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function RoleDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleSelect = (role) => {
    setIsOpen(false)
    navigate(`/login/${role}`)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center hover:shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title="Login Options"
      >
        👤
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600">
            <p className="text-white text-sm font-semibold">Login As</p>
          </div>
          
          <button onClick={() => handleRoleSelect('student')} className="w-full px-5 py-3.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition font-medium flex items-center space-x-3 border-b border-gray-100">
            
            <span>Student</span>
          </button>

          <button onClick={() => handleRoleSelect('trainer')} className="w-full px-5 py-3.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition font-medium flex items-center space-x-3 border-b border-gray-100">
            
            <span>Trainer</span>
          </button>

          <button onClick={() => handleRoleSelect('admin')} className="w-full px-5 py-3.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition font-medium flex items-center space-x-3">
            
            <span>Admin</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default RoleDropdown