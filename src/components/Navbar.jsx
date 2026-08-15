import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProfileDropdown from './ProfileDropdown'
import RoleDropdown from './RoleDropdown'

function Navbar({ onUploadClick, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const isHomePage = location.pathname === '/'

  const handleNavigation = (sectionId) => {
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
    navigate('/login/student')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm py-3 px-6 fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo - Click to go home */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Career Pathfinder
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
          
          {/* Show Profile or Login */}
          {user ? (
            <ProfileDropdown user={user} onLogout={onLogout} />
          ) : (
            <>
              {/* Login Button - Goes to Student Login */}
              <button 
                onClick={handleStudentLogin}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2.5 rounded-full hover:shadow-lg transition font-semibold cursor-pointer"
              >
                Login
              </button>
              
              {/* Role Dropdown Icon - Shows all roles */}
              <RoleDropdown />
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-2xl text-gray-700">
          ☰
        </button>
      </div>
    </nav>
  )
}

export default Navbar