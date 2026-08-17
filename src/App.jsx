import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SkillReviewPage from './pages/SkillReviewPage'
import SkillRatingPage from './pages/SkillRatingPage'
import StudentLogin from './pages/login/StudentLogin'
import TrainerLoginPage from './pages/login/TrainerLoginPage'
import AdminLoginPage from './pages/login/AdminLoginPage'
import TrainerRegistration from './pages/trainer/TrainerRegistration'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import TrainerDashboard from './pages/dashboard/TrainerDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

// ====== Assessment Pages ======
import AssessmentPage from './pages/AssessmentPage'
import TestResultsPage from './pages/TestResultsPage'

// ====== Admin Pages ======
import AdminSkills from './pages/AdminSkills'
import AdminStudents from './pages/AdminStudents'
import AdminTrainers from './pages/AdminTrainers'

// ====== SESSION TIMEOUT ======
const SESSION_TIMEOUT = 3 * 60 * 60 * 1000 // 3 hours

// ====== STORAGE KEYS ======
const USER_STORAGE_KEY = 'careerUser'
const LOGIN_TIME_KEY = 'careerLoginTime'

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    // Use sessionStorage instead of localStorage
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY)
    const loginTime = sessionStorage.getItem(LOGIN_TIME_KEY)
    
    if (storedUser && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime)
      
      if (elapsed > SESSION_TIMEOUT) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
        setUser(null)
        navigate('/login/student')
        setLoading(false)
        return
      }
      
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (e) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
      }
    }
    setLoading(false)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    // Use sessionStorage (separate per tab)
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    sessionStorage.setItem(LOGIN_TIME_KEY, Date.now().toString())
    
    if (userData.role === 'student') {
      navigate('/student-dashboard')
    } else if (userData.role === 'trainer') {
      navigate('/trainer-dashboard')
    } else if (userData.role === 'admin') {
      navigate('/admin-dashboard')
    } else {
      navigate('/student-dashboard')
    }
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem(USER_STORAGE_KEY)
    sessionStorage.removeItem(LOGIN_TIME_KEY)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage user={user} onLogout={handleLogout} />} />
      
      {/* Login Routes */}
      <Route path="/login/student" element={<StudentLogin onLogin={handleLogin} />} />
      <Route path="/login/trainer" element={<TrainerLoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage onLogin={handleLogin} />} />
      <Route path="/trainer/register" element={<TrainerRegistration />} />
      
      {/* Skill Routes */}
      <Route path="/skill-review/:resumeId" element={<SkillReviewPage user={user} onLogout={handleLogout} />} />
      <Route path="/skill-rating/:resumeId" element={<SkillRatingPage user={user} onLogout={handleLogout} />} />
      
      {/* Assessment Routes - with skillName */}
      <Route path="/assessment/:resumeId/:skillName" element={
        <ProtectedRoute user={user} allowedRoles={['student']}>
          <AssessmentPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/results/:resumeId/:skillName" element={
        <ProtectedRoute user={user} allowedRoles={['student']}>
          <TestResultsPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/skills" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminSkills user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/students" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminStudents user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/trainers" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminTrainers user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      {/* Dashboard Routes */}
      <Route path="/student-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['student']}>
          <StudentDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/trainer-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['trainer', 'admin']}>
          <TrainerDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['student', 'trainer', 'admin']}>
          {user?.role === 'student' && <StudentDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'trainer' && <TrainerDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App