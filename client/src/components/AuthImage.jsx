import { useState, useEffect } from 'react'
import api from '../api/axios'

// Private files need the login token, so the image is fetched with it and shown from memory
export default function AuthImage({ fileId, alt, className }) {
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl = null
    let cancelled = false

    api
      .get(`/files/${fileId}`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId])

  if (failed) return <div className={`${className} flex items-center justify-center bg-slate-100 text-xs text-slate-400`}>Error</div>
  if (!src) return <div className={`${className} animate-pulse bg-slate-100`} />
  return <img src={src} alt={alt} className={className} />
}