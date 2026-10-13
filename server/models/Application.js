import mongoose from 'mongoose'

export const STATUSES = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Technical Interview',
  'HR Interview',
  'Selected',
  'Rejected',
]

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
)

const interviewSchema = new mongoose.Schema(
  {
    round: { type: String, trim: true, maxlength: 60, default: 'Interview' },
    date: { type: Date, required: true },
  },
  { _id: false }
)

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    applicationDate: { type: Date, required: true },
    packageLpa: { type: Number, min: 0, max: 500, default: null },
    jobUrl: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: STATUSES, default: 'Applied' },
    statusHistory: [historySchema],
    interviews: [interviewSchema],
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
)

applicationSchema.index({ user: 1, applicationDate: -1 })

const Application = mongoose.model('Application', applicationSchema)
export default Application