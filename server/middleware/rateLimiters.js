import rateLimit from 'express-rate-limit'

const make = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { message },
  })

// The whole API, per IP address
export const apiLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: 'Too many requests. Please slow down and try again in a few minutes.',
})

// Only FAILED logins count, so normal students are not affected
export const loginLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
})

export const registerLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: 'Too many accounts created from this network. Please try again later.',
})

// Password change and account deletion, which both ask for the current password
export const sensitiveLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many attempts. Please try again in 15 minutes.',
})

// The pages and files anyone can open without logging in
export const publicLimiter = make({
  windowMs: 60 * 1000,
  limit: 60,
  message: 'Too many requests. Please try again in a minute.',
})