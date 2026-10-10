const usage = new Map()

const todayKey = () => new Date().toISOString().slice(0, 10)

// Limits how many AI requests one student can make per day (resets at midnight UTC)
export const aiLimit = (req, res, next) => {
  const limit = Number(process.env.AI_DAILY_LIMIT) || 20
  const key = String(req.user._id)
  const day = todayKey()

  const entry = usage.get(key)
  const used = entry && entry.day === day ? entry.count : 0

  if (used >= limit) {
    return res.status(429).json({
      message: `You have reached today's limit of ${limit} AI requests. Please try again tomorrow.`,
    })
  }

  usage.set(key, { day, count: used + 1 })
  next()
}