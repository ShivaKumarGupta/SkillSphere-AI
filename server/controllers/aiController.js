import { generateJson, aiInfo, AiError } from '../services/aiService.js'

const testSchema = {
  type: 'object',
  properties: {
    greeting: { type: 'string', description: 'One friendly welcome sentence.' },
    tip: { type: 'string', description: 'One short study tip.' },
  },
  required: ['greeting', 'tip'],
}

export const testAi = async (req, res) => {
  try {
    const result = await generateJson({
      system: 'You are a friendly assistant inside a career platform for college students. Keep answers short.',
      prompt: 'Write a one-sentence welcome for a new student, and one short study tip.',
      schema: testSchema,
    })

    res.json({
      greeting: String(result.greeting || ''),
      tip: String(result.tip || ''),
      model: aiInfo().model,
    })
  } catch (error) {
    if (error instanceof AiError) {
      return res.status(error.status).json({ message: error.message })
    }
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}