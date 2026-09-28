import React from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ user, allowedRoles, children }) {
  let currentUser = user

  if (!currentUser) {
    const storedUser = sessionStorage.getItem('careerUser')
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
      } catch (e) {
        console.error('ProtectedRoute: failed to parse stored user', e)
      }
    }
  }

  if (!currentUser) {
    return <Navigate to="/login/student" replace />
  }

  const rawRole = currentUser.role || 'student'
  const userRole = rawRole === 'personalized_trainer' ? 'trainer' : rawRole

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (rawRole === 'admin') return <Navigate to="/admin-dashboard" replace />
    if (rawRole === 'trainer' || rawRole === 'personalized_trainer') {
      const cat = currentUser.category || 'regular'
      return <Navigate to={cat === 'personalized' ? '/personalized-dashboard' : '/trainer-dashboard'} replace />
    }
    if (rawRole === 'recruiter') return <Navigate to="/recruiter-dashboard" replace />
    if (rawRole === 'institute') return <Navigate to="/institute-dashboard" replace />
    if (rawRole === 'member') return <Navigate to="/member-dashboard" replace />
    return <Navigate to="/student-dashboard" replace />
  }

  return children
}

export default ProtectedRoute