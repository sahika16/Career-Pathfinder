import React from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ user, allowedRoles, children }) {
  let currentUser = user
  if (!currentUser) {
    const storedUser = sessionStorage.getItem('careerUser')
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
      } catch (e) {}
    }
  }

  if (!currentUser) {
    return <Navigate to="/login/student" replace />
  }

  const userRole = currentUser.role || 'student'

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login/student" replace />
  }

  return children
}

export default ProtectedRoute