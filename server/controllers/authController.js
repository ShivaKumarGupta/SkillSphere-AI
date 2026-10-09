import toUserResponse from '../utils/userResponse.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (![name, email, password].every((v) => typeof v === 'string' && v.trim())) {
      return res.status(400).json({ message: 'Please fill all fields' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const exists = await User.findOne({ email: cleanEmail })
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = await User.create({ name, email: cleanEmail, password })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please enter email and password' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      })
    }

    res.status(401).json({ message: 'Invalid email or password' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMe = (req, res) => {
  res.json(toUserResponse(req.user))
}