import mongoose from 'mongoose'

export const TYPES = ['Technical', 'HR', 'Mixed']
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
export const COUNTS = [3, 5, 8]

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 400 },
  category: { type: String, enum: ['Technical', 'HR'], default: 'Technical' },
  topic: { type: String, trim: true, maxlength: 60, default: '' },
  keyPoints: [{ type: String, trim: true, maxlength: 200 }],
  answer: { type: String, maxlength: 2000, default: '' },
  // filled in Step 21
  score: { type: Number, min: 0, max: 10, default: null },
  feedback: { type: String, trim: true, maxlength: 600, default: '' },
})

const list = [{ type: String, trim: true, maxlength: 300 }]

const evaluationSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalScore: { type: Number, min: 0, max: 10, default: 0 },
    communicationScore: { type: Number, min: 0, max: 10, default: 0 },
    summary: { type: String, trim: true, maxlength: 600, default: '' },
    strengths: list,
    improvementAreas: list,
    weakTopics: list,
    studyTopics: list,
  },
  { _id: false }
)

const interviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: TYPES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    questions: [questionSchema],
    evaluation: { type: evaluationSchema, default: null },
    completedAt: { type: Date, default: null },
    model: { type: String, trim: true, maxlength: 60, default: '' },
  },
  { timestamps: true }
)

interviewSessionSchema.index({ user: 1, createdAt: -1 })

// A student can have only one interview in progress at a time
interviewSessionSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: 'in_progress' } }
)

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema)
export default InterviewSession