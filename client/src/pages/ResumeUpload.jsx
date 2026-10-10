import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const MAX_SIZE = 2 * 1024 * 1024

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function ResumeUpload() {
  const [current, setCurrent] = useState(undefined) // undefined = loading, null = nothing uploaded
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    api
      .get('/resume/upload')
      .then((res) => setCurrent(res.data))
      .catch(() => {
        setError('Could not load your uploaded resume')
        setCurrent(null)
      })
  }, [])

  const clearInput = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleChoose = (e) => {
    const chosen = e.target.files[0]
    setError('')
    setMessage('')
    if (!chosen) return clearInput()

    if (!chosen.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file')
      return clearInput()
    }
    if (chosen.size > MAX_SIZE) {
      setError('The file is too large. The limit is 2 MB.')
      return clearInput()
    }
    setFile(chosen)
  }

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setMessage('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/resume/upload', formData)
      setCurrent(data)
      setMessage('Resume uploaded and read successfully')
      clearInput()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!window.confirm('Remove your uploaded resume?')) return
    try {
      await api.delete('/resume/upload')
      setCurrent(null)
      setMessage('')
    } catch {
      setError('Could not remove the resume')
    }
  }

  if (current === undefined) return <p className="text-slate-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upload existing resume</h1>
          <p className="mt-1 text-slate-500">
            We read the text from your PDF. The AI Resume Analyzer will use it later.
          </p>
        </div>
        <Link
          to="/resume"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to resume builder
        </Link>
      </div>

      {message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">
          {current ? 'Replace your uploaded resume' : 'Choose a PDF'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          PDF only, up to 2 MB and 5 pages. It must contain real text (not a scan or photo). Only
          the extracted text is stored, not the file itself.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleChoose}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {uploading ? 'Reading PDF...' : 'Upload'}
          </button>
        </div>
      </div>

      {current && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words font-semibold text-slate-800">{current.fileName}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatSize(current.fileSize)} · {current.pageCount}{' '}
                {current.pageCount === 1 ? 'page' : 'pages'} · {current.charCount.toLocaleString()}{' '}
                characters · uploaded {formatDateTime(current.uploadedAt)}
              </p>
            </div>
            <button onClick={handleRemove} className="text-sm text-slate-500 hover:text-red-600">
              Remove
            </button>
          </div>

          <h3 className="mt-5 text-sm font-medium text-slate-700">Text we extracted</h3>
          <p className="mt-1 text-xs text-slate-400">
            This is what software sees. If sections are missing, jumbled or out of order, an ATS
            would struggle with this PDF too.
          </p>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {current.text}
          </pre>
        </div>
      )}
    </div>
  )
}