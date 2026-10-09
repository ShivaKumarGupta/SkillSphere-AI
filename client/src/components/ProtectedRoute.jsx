import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="p-10 text-center text-slate-600">Loading...</p>
  }

  return user ? children : <Navigate to="/login" replace />
}