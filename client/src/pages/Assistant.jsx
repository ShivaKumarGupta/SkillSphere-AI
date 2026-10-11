import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { todayKey } from '../utils/date'

const MAX_LENGTH = 1000

const SUGGESTIONS = [
  'What should I learn next?',
  'How is my progress so far?',
  'Which DSA topic should I study next?',
  'Give me interview questions based on my resume',
]

function Bubble({ role, content }) {
  const mine = role === 'user'
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
          mine ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

export default function Assistant() {
  const [messages, setMessages] = useState(null)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    api
      .get('/assistant')
      .then((res) => setMessages(res.data.messages))
      .catch(() => {
        setError('Could not load your chat')
        setMessages([])
      })
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending, sending])

  const send = async (text) => {
    const message = text.trim()
    if (!message || sending || messages === null) return

    setError('')
    setSending(true)
    setPending(message)
    setInput('')
    try {
      const res = await api.post('/assistant/message', { message, today: todayKey() })
      setMessages((m) => [...m, ...res.data.messages])
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
      setInput(message)
    } finally {
      setPending(null)
      setSending(false)
    }
  }

  const clearChat = async () => {
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return
    try {
      await api.delete('/assistant')
      setMessages([])
      setError('')
    } catch {
      setError('Could not clear the chat')
    }
  }

  if (messages === null) return <p className="text-slate-500">Loading...</p>

  const empty = messages.length === 0 && !pending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Career Assistant</h1>
          <p className="mt-1 text-slate-500">
            Ask anything about your career prep. I can see your profile and progress.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            disabled={sending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="flex h-[70vh] min-h-[28rem] flex-col rounded-2xl bg-white shadow">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {empty && (
            <div className="py-6 text-center">
              <p className="text-slate-500">Try one of these to get started:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={sending}
                    className="rounded-full border border-indigo-200 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}
          {pending && <Bubble role="user" content={pending} />}
          {sending && <p className="text-sm text-slate-400">Thinking... this can take up to a minute.</p>}
        </div>

        {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={2}
              maxLength={MAX_LENGTH}
              placeholder="Ask about your roadmap, DSA, resume or interviews..."
              className="flex-1 resize-none rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              className="self-end rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Enter to send, Shift + Enter for a new line · {input.length}/{MAX_LENGTH}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        AI answers can be wrong, so double-check important advice. With each message, your profile
        data and uploaded resume text are sent to an AI provider, and each message uses one of
        your daily AI requests.
      </p>
    </div>
  )
}