import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SkillReviewPage from './pages/SkillReviewPage'
import SkillRatingPage from './pages/SkillRatingPage'
import StudentLogin from './pages/login/StudentLogin'
import TrainerLoginPage from './pages/login/TrainerLoginPage'
import AdminLoginPage from './pages/login/AdminLoginPage'
import InstituteLoginPage from './pages/login/InstituteLoginPage'
import TrainerRegistration from './pages/trainer/TrainerRegistration'
import StudentRegistration from './pages/student/StudentRegistration'
import InstituteRegistration from './pages/institute/InstituteRegistration'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import InstituteDashboard from './pages/dashboard/InstituteDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AssessmentPage from './pages/AssessmentPage'
import TestResultsPage from './pages/TestResultsPage'
import AdminSkills from './pages/AdminSkills'
import AdminStudents from './pages/AdminStudents'
import AdminTrainers from './pages/AdminTrainers'
import AdminInstitutes from './pages/AdminInstitutes'
import RecruiterLoginPage from './pages/login/RecruiterLoginPage'
import RecruiterRegistration from './pages/recruiter/RecruiterRegistration'
import RecruiterDashboard from './pages/dashboard/RecruiterDashboard'
import MemberDashboard from './pages/dashboard/MemberDashboard'
import RegularTrainerDashboard from './pages/dashboard/RegularTrainerDashboard'
import PersonalizedTrainerDashboard from './pages/dashboard/PersonalizedTrainerDashboard'
import AdminRecruiters from './pages/AdminRecruiters'
import LearningResourcesPage from './pages/LearningResourcesPage'
import EnrollmentPage from './pages/EnrollmentPage'
import RecruiterPositions from './pages/RecruiterPositions'
import AdminRecommendations from './pages/AdminRecommendations'

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
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY)
    const loginTime = sessionStorage.getItem(LOGIN_TIME_KEY)

    if (storedUser && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime)

      if (elapsed > 3 * 60 * 60 * 1000) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
        setUser(null)
        setLoading(false)
        return
      }

      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        sessionStorage.removeItem(USER_STORAGE_KEY)
        sessionStorage.removeItem(LOGIN_TIME_KEY)
      }
    }
    setLoading(false)
  }

  const handleLogin = (userData) => {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    sessionStorage.setItem(LOGIN_TIME_KEY, Date.now().toString())
    setUser(userData)

    setTimeout(() => {
      const role = userData.role
      const category = userData.category

      if (role === 'student') navigate('/student-dashboard')
      else if (role === 'admin') navigate('/admin-dashboard')
      else if (role === 'member') navigate('/member-dashboard')
      else if (role === 'trainer') {
        if (category === 'personalized') navigate('/personalized-dashboard')
        else navigate('/trainer-dashboard')
      }
      else if (role === 'institute') navigate('/institute-dashboard')
      else if (role === 'recruiter') navigate('/recruiter-dashboard')
      else navigate('/student-dashboard')
    }, 0)
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
      <Route path="/login/institute" element={<InstituteLoginPage onLogin={handleLogin} />} />
      <Route path="/login/recruiter" element={<RecruiterLoginPage />} />

      <Route path="/trainer/register" element={<TrainerRegistration />} />
      <Route path="/student/register" element={<StudentRegistration />} />
      <Route path="/institute/register" element={<InstituteRegistration />} />
      <Route path="/recruiter/register" element={<RecruiterRegistration />} />

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

      <Route path="/admin/institutes" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminInstitutes user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/admin/recruiters" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminRecruiters user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/admin/position/:positionId/recommend" element={
        <ProtectedRoute user={user} allowedRoles={['admin']}>
          <AdminRecommendations user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/member-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['member']}>
          <MemberDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/trainer-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['trainer', 'personalized_trainer']}>
          <RegularTrainerDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/personalized-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['trainer', 'personalized_trainer']}>
          <PersonalizedTrainerDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/institute-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['institute']}>
          <InstituteDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/recruiter-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['recruiter']}>
          <RecruiterDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/recruiter/positions" element={
        <ProtectedRoute user={user} allowedRoles={['recruiter']}>
          <RecruiterPositions user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/learning-resources" element={<LearningResourcesPage user={user} onLogout={handleLogout} />} />

      <Route path="/enroll" element={
        <ProtectedRoute user={user} allowedRoles={['student']}>
          <EnrollmentPage user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/student-dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['student']}>
          <StudentDashboard user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute user={user} allowedRoles={['student', 'trainer', 'personalized_trainer', 'admin', 'member', 'institute', 'recruiter']}>
          {user?.role === 'student' && <StudentDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'trainer' && user?.category === 'personalized' && <PersonalizedTrainerDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'trainer' && user?.category !== 'personalized' && <RegularTrainerDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'member' && <MemberDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'institute' && <InstituteDashboard user={user} onLogout={handleLogout} />}
          {user?.role === 'recruiter' && <RecruiterDashboard user={user} onLogout={handleLogout} />}
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