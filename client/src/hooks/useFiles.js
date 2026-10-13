import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function useFiles() {
  const [files, setFiles] = useState([])

  useEffect(() => {
    api
      .get('/files')
      .then((res) => setFiles(res.data))
      .catch(() => {})
  }, [])

  // A certificate keeps one file, so a new one replaces the old one in the list
  const add = (file) =>
    setFiles((list) => [
      ...(file.kind === 'certificate' ? list.filter((f) => f.ownerId !== file.ownerId) : list),
      file,
    ])

  const remove = (id) => setFiles((list) => list.filter((f) => f.id !== id))

  const forOwner = (kind, ownerId) => files.filter((f) => f.kind === kind && f.ownerId === ownerId)

  return { add, remove, forOwner }
}