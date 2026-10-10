import mongoose from 'mongoose'

const str = (max) => ({ type: String, trim: true, maxlength: max, default: '' })

const contactSchema = new mongoose.Schema(
  {
    fullName: str(100),
    email: str(100),
    phone: str(30),
    location: str(100),
    linkedin: str(300),
    github: str(300),
    portfolio: str(300),
  },
  { _id: false }
)

const educationSchema = new mongoose.Schema(
  {
    institution: str(150),
    degree: str(100),
    field: str(100),
    startYear: str(10),
    endYear: str(10),
    score: str(30),
  },
  { _id: false }
)

const projectSchema = new mongoose.Schema(
  {
    name: str(100),
    technologies: [{ type: String, trim: true, maxlength: 50 }],
    link: str(300),
    bullets: [{ type: String, trim: true, maxlength: 400 }],
  },
  { _id: false }
)

const experienceSchema = new mongoose.Schema(
  {
    company: str(100),
    role: str(100),
    startDate: str(10),
    endDate: str(10),
    current: { type: Boolean, default: false },
    bullets: [{ type: String, trim: true, maxlength: 400 }],
  },
  { _id: false }
)

const certificationSchema = new mongoose.Schema(
  {
    name: str(150),
    organization: str(100),
    year: str(10),
  },
  { _id: false }
)

const codingProfileSchema = new mongoose.Schema(
  {
    platform: str(50),
    url: str(300),
  },
  { _id: false }
)

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    contact: { type: contactSchema, default: () => ({}) },
    summary: str(600),
    education: [educationSchema],
    skills: [{ type: String, trim: true, maxlength: 50 }],
    projects: [projectSchema],
    experience: [experienceSchema],
    achievements: [{ type: String, trim: true, maxlength: 300 }],
    certifications: [certificationSchema],
    codingProfiles: [codingProfileSchema],
  },
  { timestamps: true }
)

const Resume = mongoose.model('Resume', resumeSchema)
export default Resume