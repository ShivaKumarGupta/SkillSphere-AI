import { Brand } from './Sidebar'

function TrailArt() {
  return (
    <svg viewBox="0 0 400 260" className="w-full max-w-md text-white" aria-hidden="true">
      <path
        d="M 24 232 C 130 232, 120 150, 200 150 S 300 72, 372 52"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <circle cx="24" cy="232" r="9" className="fill-white" />
      <circle cx="200" cy="150" r="9" className="fill-white" />
      <circle cx="372" cy="52" r="13" className="fill-amber-400" />
      <path d="M 372 38 V 12 L 392 20 L 372 28" className="fill-amber-400" />
    </svg>
  )
}

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-indigo-900 p-12 text-white lg:flex">
        <Brand />
        <TrailArt />
        <div>
          <p className="font-display text-3xl font-semibold leading-tight">
            From your first skill to your first offer, on one trail.
          </p>
          <p className="mt-3 max-w-sm text-slate-200">
            Track your skills, practise interviews and follow a roadmap built for the role you want.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-100 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 rounded-xl bg-indigo-900 px-4 py-3 lg:hidden">
            <Brand />
          </div>

          <div className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-indigo-900">{title}</h1>
            <p className="mb-6 mt-1 text-slate-500">{subtitle}</p>
            {children}
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </div>
    </div>
  )
}