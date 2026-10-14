import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Build',
    items: [
      { to: '/profile', label: 'Profile' },
      { to: '/projects', label: 'Projects' },
      { to: '/certificates', label: 'Certificates' },
      {
        to: '/resume',
        label: 'Resume',
        // The resume pages share a prefix with the AI review, which has its own menu item
        match: (p) => p.startsWith('/resume') && !p.startsWith('/resume/analysis'),
      },
      { to: '/portfolio', label: 'Portfolio' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/dsa', label: 'DSA tracker' },
      { to: '/roadmap', label: 'Career roadmap' },
      { to: '/interview', label: 'Mock interview' },
      { to: '/resume/analysis', label: 'AI resume review' },
      { to: '/assistant', label: 'Career assistant' },
    ],
  },
  {
    label: 'Placement',
    items: [{ to: '/applications', label: 'Applications' }],
  },
]

export function Brand() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-semibold text-white">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="6.5" r="3" className="fill-amber-400" />
      </svg>
      SkillSphere AI
    </span>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isActive = (item) =>
    item.match ? item.match(pathname) : pathname === item.to || pathname.startsWith(`${item.to}/`)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      id="app-sidebar"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-indigo-900 transition-transform motion-reduce:transition-none lg:translate-x-0 print:hidden ${
        open ? 'translate-x-0' : 'invisible -translate-x-full lg:visible'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <Brand />
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-white hover:bg-white/10 focus-visible:outline-amber-300 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-6 px-3 pb-6">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs font-semibold text-slate-300">{group.label}</p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(item)
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-amber-300 ${
                        active
                          ? 'bg-white/10 font-semibold text-white'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-amber-400"
                        />
                      )}
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          to="/settings"
          onClick={onClose}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          className="block rounded-lg px-2 py-1.5 text-sm text-white hover:bg-white/5 focus-visible:outline-amber-300"
        >
          <span className="block truncate font-semibold">{user.name}</span>
          <span className="block text-xs text-slate-300">Account settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10 focus-visible:outline-amber-300"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}