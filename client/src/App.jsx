import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import Certificates from './pages/Certificates'
import Dsa from './pages/Dsa'
import Resume from './pages/Resume'
import ResumePreview from './pages/ResumePreview'
import ResumeUpload from './pages/ResumeUpload'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/dsa" element={<Dsa />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/resume/preview" element={<ResumePreview />} />
        <Route path="/resume/upload" element={<ResumeUpload />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App