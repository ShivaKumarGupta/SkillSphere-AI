import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-3.8-flash'
const TIMEOUT_MS = 30000

// A friendly error that is safe to show to students
export class AiError extends Error {
  constructor(code, userMessage, status = 503) {
    super(userMessage)
    this.code = code
    this.status = status
  }
}

// The key and model are read when needed, because .env is loaded after this file is imported
let client = null
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AiError('not_configured', 'AI is not set up on the server yet.', 503)
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return client
}

export const aiInfo = () => ({ model: process.env.GEMINI_MODEL || DEFAULT_MODEL })

const withTimeout = (promise, ms) => {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AiError('timeout', 'The AI took too long to respond. Please try again.', 504)),
      ms
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Turns any provider error into a safe message. Details go to the server log only.
const mapError = (error) => {
  if (error instanceof AiError) return error

  const status = Number(error?.status ?? error?.code)
  console.error('AI provider error:', status || '', String(error?.message || '').slice(0, 300))

  if (status === 429) {
    return new AiError('rate_limited', 'The AI service is busy right now. Please try again in a minute.', 429)
  }
  if (status === 400 || status === 401 || status === 403) {
    return new AiError('config', 'The AI service is not set up correctly. Please check the server settings.', 502)
  }
  return new AiError('unavailable', 'The AI service is unavailable right now. Please try again later.', 503)
}

// Sends one request and returns the answer text.
// store: false means we do not ask Google to keep this conversation for server-side chaining.
const run = async ({ system, prompt, schema }) => {
  try {
    const params = {
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      input: prompt,
      store: false,
    }
    if (system) params.system_instruction = system
    if (schema) {
      params.response_format = { type: 'text', mime_type: 'application/json', schema }
    }

    const interaction = await withTimeout(getClient().interactions.create(params), TIMEOUT_MS)
    const text = interaction.output_text

    if (typeof text !== 'string' || !text.trim()) {
      throw new AiError('empty', 'The AI returned an empty answer. Please try again.', 502)
    }
    return text
  } catch (error) {
    throw mapError(error)
  }
}

export const generateText = ({ system, prompt }) => run({ system, prompt })

// Asks for JSON that matches a schema, then parses it
export const generateJson = async ({ system, prompt, schema }) => {
  const text = await run({ system, prompt, schema })
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    throw new AiError('bad_output', 'The AI returned an answer we could not read. Please try again.', 502)
  }
}