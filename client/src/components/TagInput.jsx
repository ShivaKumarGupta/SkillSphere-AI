import { useState } from 'react'

export default function TagInput({ label, value, onChange, placeholder }) {
  const [text, setText] = useState('')

  const addTag = () => {
    const tag = text.trim()
    if (tag && !value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag])
    }
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2 rounded-lg border border-slate-300 p-2 focus-within:border-indigo-500">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="font-bold hover:text-indigo-900"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length ? '' : placeholder}
          className="min-w-32 flex-1 p-1 outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add</p>
    </div>
  )
}