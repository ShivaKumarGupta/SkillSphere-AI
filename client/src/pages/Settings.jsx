import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500'

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirm: '' }

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [pw, setPw] = useState(EMPTY_PASSWORDS)
  const [pwMessage, setPwMessage] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)

  const [confirmText, setConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    setPwMessage(null)

    if (pw.newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'The new password must be at least 8 characters' })
      return
    }
    if (pw.newPassword !== pw.confirm) {
      setPwMessage({ type: 'error', text: 'The new passwords do not match' })
      return
    }

    setPwSaving(true)
    try {
      const { data } = await api.put('/account/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      // Every older login stops working, so this device keeps going with the new token
      localStorage.setItem('token', data.token)
      setPw(EMPTY_PASSWORDS)
      setPwMessage({
        type: 'success',
        text: 'Password updated. You have been logged out of your other devices.',
      })
    } catch (err) {
      setPwMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' })
    } finally {
      setPwSaving(false)
    }
  }

  const deleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    const ok = window.confirm(
      'This permanently deletes your account and everything in it. It cannot be undone. Continue?'
    )
    if (!ok) return

    setDeleting(true)
    try {
      await api.delete('/account', { data: { password: deletePassword } })
      logout()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Something went wrong')
      setDeleting(false)
    }
  }

  const canDelete = confirmText === 'DELETE' && deletePassword.length > 0 && !deleting

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account settings</h1>
        <p className="mt-1 text-slate-500">
          {user.name} · {user.email}
        </p>
      </div>

      <form onSubmit={changePassword} className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">
          After changing it, you stay logged in here and are logged out everywhere else.
        </p>

        {pwMessage && (
          <p
            className={`mt-4 rounded-lg p-3 text-sm ${
              pwMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {pwMessage.text}
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pwSaving}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pwSaving ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <form onSubmit={deleteAccount} className="rounded-2xl border border-red-200 bg-white p-6 shadow">
        <h2 className="font-semibold text-red-700">Delete account</h2>
        <p className="mt-1 text-sm text-slate-600">
          This permanently deletes your account and all of your data: profile, projects,
          certificates, uploaded files, DSA log, resume and AI analysis, roadmap, assistant chat,
          interviews, applications and public portfolio. Your public link stops working
          immediately. This cannot be undone.
        </p>

        {deleteError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteError}</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Your password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canDelete}
          className="mt-5 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete my account'}
        </button>
      </form>
    </div>
  )
}