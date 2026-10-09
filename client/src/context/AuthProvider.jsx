import { useState, useEffect } from 'react'
import api from '../api/axios'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  useEffect(() => {
    if (!localStorage.getItem('token')) return

    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const startSession = async (token) => {
    localStorage.setItem('token', token)
    const { data } = await api.get('/auth/me')
    setUser(data)
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    await startSession(data.token)
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    await startSession(data.token)
  }

  const updateProfile = async (profile) => {
    const { data } = await api.put('/profile', profile)
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}