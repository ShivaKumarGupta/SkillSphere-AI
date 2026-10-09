import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    // Profile fields
    college: { type: String, trim: true, maxlength: 100, default: '' },
    degree: { type: String, trim: true, maxlength: 100, default: '' },
    branch: { type: String, trim: true, maxlength: 100, default: '' },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    cgpa: { type: Number, min: 0, max: 10 },
    skills: [{ type: String, trim: true }],
    careerInterests: [{ type: String, trim: true }],
    targetRole: { type: String, trim: true, maxlength: 100, default: '' },
    experienceLevel: {
      type: String,
      enum: ['', 'Beginner', 'Intermediate', 'Advanced'],
      default: '',
    },
    github: { type: String, trim: true, maxlength: 200, default: '' },
    linkedin: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User