import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100 print:min-h-0 print:bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl p-6 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  )
}