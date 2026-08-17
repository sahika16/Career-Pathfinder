import React from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ user, allowedRoles, children }) {
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login/student" replace />
  }

  // If role not allowed, redirect to home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute