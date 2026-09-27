import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProfileDropdown from './ProfileDropdown'
import RoleDropdown from './RoleDropdown'

function Navbar({ onUploadClick, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isHomePage = location.pathname === '/'

  const handleNavigation = (sectionId) => {
    setIsMobileMenuOpen(false)
    if (isHomePage) {
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/#${sectionId}`)
      setTimeout(() => {
        const section = document.getElementById(sectionId)
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const handleUploadClick = () => {
    setIsMobileMenuOpen(false)
    if (isHomePage) {
      if (onUploadClick) {
        onUploadClick()
      } else {
        const section = document.getElementById('upload-section')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } else {
      navigate('/')
      setTimeout(() => {
        const section = document.getElementById('upload-section')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const handleStudentLogin = () => {
    setIsMobileMenuOpen(false)
    navigate('/login/student')
  }

  const handleStudentRegister = () => {
    setIsMobileMenuOpen(false)
    navigate('/student/register')
  }

  const handleLogoClick = () => {
    setIsMobileMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-sm py-3 px-6 fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative">
          {/* Logo - Click to go home */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              CareerPath
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavigation('features')}
              className="text-gray-600 hover:text-blue-600 transition font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => handleNavigation('how-it-works')}
              className="text-gray-600 hover:text-blue-600 transition font-medium"
            >
              Working
            </button>
            <button 
              onClick={() => handleNavigation('faq')}
              className="text-gray-600 hover:text-blue-600 transition font-medium"
            >
              FAQ
            </button>
            <button 
              onClick={handleUploadClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg transition font-semibold cursor-pointer"
            >
              Upload Resume
            </button>
            
            {/* Show Profile or Login/Register */}
            {user ? (
              <ProfileDropdown user={user} onLogout={onLogout} />
            ) : (
              <>
                {/* Register Button */}
                <button 
                  onClick={handleStudentRegister}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg transition font-semibold cursor-pointer"
                >
                  Register
                </button>
                
                {/* Login Button */}
                <button 
                  onClick={handleStudentLogin}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2.5 rounded-full hover:shadow-lg transition font-semibold cursor-pointer"
                >
                  Login
                </button>
                
                <RoleDropdown />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-2xl text-gray-700 hover:text-blue-600 transition p-2 rounded-lg hover:bg-gray-100 focus:outline-none relative z-50"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 md:hidden z-50">
              <div className="p-4">
                {/* Navigation Links */}
                <div className="space-y-1">
                  <button 
                    onClick={() => handleNavigation('features')}
                    className="w-full text-gray-700 hover:text-blue-600 transition font-medium text-left px-4 py-2.5 hover:bg-blue-50 rounded-xl"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => handleNavigation('how-it-works')}
                    className="w-full text-gray-700 hover:text-blue-600 transition font-medium text-left px-4 py-2.5 hover:bg-blue-50 rounded-xl"
                  >
                    Working
                  </button>
                  <button 
                    onClick={() => handleNavigation('faq')}
                    className="w-full text-gray-700 hover:text-blue-600 transition font-medium text-left px-4 py-2.5 hover:bg-blue-50 rounded-xl"
                  >
                    FAQ
                  </button>
                </div>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                {/* Upload Resume Button */}
                <button 
                  onClick={handleUploadClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl hover:shadow-lg transition font-semibold"
                >
                  Upload Resume
                </button>
                
                {user ? (
                  <div className="mt-3">
                    <ProfileDropdown user={user} onLogout={onLogout} />
                  </div>
                ) : (
                  <>
                    {/* Register and Login Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button 
                        onClick={handleStudentRegister}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl hover:shadow-lg transition font-semibold text-sm"
                      >
                        Register
                      </button>
                      <button 
                        onClick={handleStudentLogin}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl hover:shadow-lg transition font-semibold text-sm"
                      >
                        Login
                      </button>
                    </div>
                    
                    {/* Role Dropdown */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-2">Login As</p>
                      <RoleDropdown />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default Navbar