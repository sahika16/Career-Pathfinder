import React from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ user, allowedRoles, children }) {
  console.log('ProtectedRoute - user prop:', user)
  console.log('ProtectedRoute - allowedRoles:', allowedRoles)
  
  // If no user, try to get from sessionStorage
  let currentUser = user
  if (!currentUser) {
    const storedUser = sessionStorage.getItem('careerUser')
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
        console.log('ProtectedRoute - user from sessionStorage:', currentUser)
      } catch (e) {
        console.error('Error parsing user from sessionStorage:', e)
      }
    }
  }
  
  // If still no user, redirect to student login
  if (!currentUser) {
    console.log('ProtectedRoute - No user, redirecting to login')
    return <Navigate to="/login/student" replace />
  }

  // If role not allowed, redirect to home
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.log(`ProtectedRoute - Role ${currentUser.role} not allowed. Allowed: ${allowedRoles}`)
    return <Navigate to="/" replace />
  }

  console.log('ProtectedRoute - Access granted for role:', currentUser.role)
  return children
}

export default ProtectedRoute