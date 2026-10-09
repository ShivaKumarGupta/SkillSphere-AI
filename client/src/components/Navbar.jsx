import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="mr-4 text-lg font-bold text-indigo-600">SkillSphere AI</span>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            Projects
          </NavLink>
          <NavLink to="/certificates" className={linkClass}>
            Certificates
          </NavLink>
          <NavLink to="/dsa" className={linkClass}>
             DSA
          </NavLink>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:block">{user.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}