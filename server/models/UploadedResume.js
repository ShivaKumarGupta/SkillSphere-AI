import mongoose from 'mongoose'

const uploadedResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fileName: { type: String, trim: true, maxlength: 100, default: 'resume.pdf' },
    fileSize: { type: Number, min: 0 },
    pageCount: { type: Number, min: 0 },
    text: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: true }
)

const UploadedResume = mongoose.model('UploadedResume', uploadedResumeSchema)
export default UploadedResume