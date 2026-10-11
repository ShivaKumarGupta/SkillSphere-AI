import mongoose from 'mongoose'

export const CATEGORIES = ['Skills', 'Projects', 'DSA', 'Certification', 'Resume', 'Interview Prep']

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 400, default: '' },
  category: { type: String, enum: CATEGORIES, default: 'Skills' },
  estimatedWeeks: { type: Number, min: 1, max: 26, default: 2 },
  topics: [{ type: String, trim: true, maxlength: 100 }],
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
})

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    targetRole: { type: String, trim: true, maxlength: 100, default: '' },
    summary: { type: String, required: true, trim: true, maxlength: 600 },
    milestones: [milestoneSchema],
    inputHash: { type: String, required: true },
    model: { type: String, trim: true, maxlength: 60, default: '' },
  },
  { timestamps: true }
)

const Roadmap = mongoose.model('Roadmap', roadmapSchema)
export default Roadmap