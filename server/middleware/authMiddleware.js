import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }

    // A password change invalidates every token issued before it
    if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat) {
      return res.status(401).json({ message: 'Not authorized, please log in again' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' })
  }
}