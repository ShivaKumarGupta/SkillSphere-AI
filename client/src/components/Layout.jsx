import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { Brand } from './Sidebar'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // The resume editor needs room for the editor and the preview side by side
  const wide = pathname === '/resume'

  // Escape closes the menu on phones
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen bg-slate-100 print:min-h-0 print:bg-white">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden print:hidden"
        />
      )}

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-indigo-900 px-4 py-3 lg:hidden print:hidden">
          <Brand />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="app-sidebar"
            className="rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-amber-300"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main
          className={`mx-auto p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0 ${
            wide ? 'max-w-[1500px]' : 'max-w-5xl'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}