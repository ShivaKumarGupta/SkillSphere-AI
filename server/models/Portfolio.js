import mongoose from 'mongoose'

export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'register',
  'dashboard',
  'profile',
  'projects',
  'certificates',
  'dsa',
  'roadmap',
  'assistant',
  'interview',
  'applications',
  'resume',
  'portfolio',
  'settings',
  'about',
  'help',
  'support',
  'assets',
  'static',
  'u',
]

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    isPublic: { type: Boolean, default: false },
    headline: { type: String, trim: true, maxlength: 100, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    showEmail: { type: Boolean, default: false },
    showEducation: { type: Boolean, default: true },
    showSkills: { type: Boolean, default: true },
    showProjects: { type: Boolean, default: true },
    showCertificates: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Portfolio = mongoose.model('Portfolio', portfolioSchema)
export default Portfolio