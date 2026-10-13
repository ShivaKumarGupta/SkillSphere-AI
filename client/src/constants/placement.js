export const STATUSES = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Technical Interview',
  'HR Interview',
  'Selected',
  'Rejected',
]

// Stages where an application is still moving
export const ACTIVE_STATUSES = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview']

export const STATUS_STYLES = {
  Saved: 'bg-slate-100 text-slate-700',
  Applied: 'bg-sky-100 text-sky-700',
  'Online Assessment': 'bg-amber-100 text-amber-700',
  'Technical Interview': 'bg-indigo-100 text-indigo-700',
  'HR Interview': 'bg-purple-100 text-purple-700',
  Selected: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
}