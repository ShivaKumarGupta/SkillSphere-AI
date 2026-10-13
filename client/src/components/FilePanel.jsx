import { useState, useRef } from 'react'
import api from '../api/axios'
import AuthImage from './AuthImage'
import { openFile } from '../utils/files'

const MB = 1024 * 1024

export default function FilePanel({ kind, ownerId, files, onAdded, onRemoved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const isProject = kind === 'project'
  const limit = isProject ? 1 * MB : 2 * MB
  const full = isProject && files.length >= 3
  const current = isProject ? null : files[0]

  const choose = async (e) => {
    const file = e.target.files[0]
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return

    setError('')
    if (file.size > limit) {
      setError(`The file is too large. The limit is ${limit / MB} MB.`)
      return
    }

    const body = new FormData()
    body.append('file', file)
    setBusy(true)
    try {
      const { data } = await api.post(`/files/${isProject ? 'projects' : 'certificates'}/${ownerId}`, body)
      onAdded(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this file?')) return
    setError('')
    try {
      await api.delete(`/files/${id}`)
      onRemoved(id)
    } catch {
      setError('Could not remove the file')
    }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <input
        ref={inputRef}
        type="file"
        accept={isProject ? 'image/png,image/jpeg,image/webp' : 'image/png,image/jpeg,image/webp,application/pdf'}
        onChange={choose}
        className="hidden"
      />

      {isProject ? (
        <>
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f) => (
                <div key={f.id} className="relative">
                  <button type="button" onClick={() => openFile(f.id)} aria-label="Open screenshot">
                    <AuthImage
                      fileId={f.id}
                      alt="Project screenshot"
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    aria-label="Remove screenshot"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-slate-700 text-xs leading-5 text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || full}
            className="text-sm font-medium text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
          >
            {busy ? 'Uploading...' : full ? 'Screenshot limit reached (3)' : '+ Add screenshot'}
          </button>
          <p className="mt-1 text-xs text-slate-400">PNG, JPG or WebP, up to 1 MB each.</p>
        </>
      ) : (
        <>
          {current ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button type="button" onClick={() => openFile(current.id)} className="break-all text-indigo-600 hover:underline">
                View file: {current.name}
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="text-slate-500 hover:text-indigo-600 disabled:opacity-60"
              >
                {busy ? 'Uploading...' : 'Replace'}
              </button>
              <button type="button" onClick={() => remove(current.id)} className="text-slate-500 hover:text-red-600">
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-60"
            >
              {busy ? 'Uploading...' : '+ Attach certificate file'}
            </button>
          )}
          <p className="mt-1 text-xs text-slate-400">
            PNG, JPG, WebP or PDF, up to 2 MB. If your portfolio is public and shows certificates,
            visitors can open this file, so check it for personal details first.
          </p>
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}