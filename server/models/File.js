import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['project', 'certificate'], required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, trim: true, maxlength: 100, default: 'file' },
    contentType: {
      type: String,
      enum: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
      required: true,
    },
    size: { type: Number, required: true, min: 0 },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true }
)

const File = mongoose.model('File', fileSchema)
export default File