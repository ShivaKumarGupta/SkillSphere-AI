import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const { percentage, missing } = user.profileCompletion

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name} 👋</h1>
      <p className="mt-1 text-slate-500">
        {user.targetRole
          ? `Target role: ${user.targetRole}`
          : 'Set a target role to personalise your journey'}
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Profile completion</h2>
          <span className="font-bold text-indigo-600">{percentage}%</span>
        </div>

        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {missing.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-600">Still missing: {missing.join(', ')}</p>
            <Link
              to="/profile"
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Complete your profile
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-green-600">🎉 Your profile is complete!</p>
        )}
      </div>
    </div>
  )
}