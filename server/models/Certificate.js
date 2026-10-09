import mongoose from 'mongoose'

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    organization: { type: String, required: true, trim: true, maxlength: 100 },
    issueDate: { type: Date, required: true },
    credentialUrl: { type: String, trim: true, maxlength: 300, default: '' },
    relatedSkill: { type: String, trim: true, maxlength: 50, default: '' },
  },
  { timestamps: true }
)

const Certificate = mongoose.model('Certificate', certificateSchema)
export default Certificate