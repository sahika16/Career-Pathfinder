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
    // Use sessionStorage - each tab has its own session
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY)
    const loginTime = sessionStorage.getItem(LOGIN_TIME_KEY)
    
    console.log('AppContent - storedUser:', storedUser)
    console.log('AppContent - loginTime:', loginTime)
    
    if (storedUser && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime)
      
      // Session timeout (3 hours)
      if (elapsed > 3 * 60 * 60 * 1000) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
        setUser(null)
        setLoading(false)
        return
      }
      
      try {
        const userData = JSON.parse(storedUser)
        console.log('AppContent - userData from sessionStorage:', userData)
        setUser(userData)
      } catch (e) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
      }
    }
    setLoading(false)
  }

  const handleLogin = (userData) => {
    console.log('AppContent - handleLogin:', userData)
    setUser(userData)
    
    // Store in sessionStorage - only for this tab
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
      <Route path="/" element={<LandingPage user={user} onLogout={handleLogout} />} />
      
      <Route path="/login/student" element={<StudentLogin onLogin={handleLogin} />} />
      <Route path="/login/trainer" element={<TrainerLoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage onLogin={handleLogin} />} />
      <Route path="/trainer/register" element={<TrainerRegistration />} />
      
      <Route path="/skill-review/:resumeId" element={<SkillReviewPage user={user} onLogout={handleLogout} />} />
      <Route path="/skill-rating/:resumeId" element={<SkillRatingPage user={user} onLogout={handleLogout} />} />
      
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