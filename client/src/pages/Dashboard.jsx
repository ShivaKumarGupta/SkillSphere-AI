import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-indigo-600">Welcome, {user.name} 👋</h1>
        <p className="mt-1 text-slate-600">{user.email}</p>
        <p className="mt-6 text-slate-500">Your career dashboard will appear here.</p>
        <button
          onClick={handleLogout}
          className="mt-6 rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Log out
        </button>
      </div>
    </div>
  )
}