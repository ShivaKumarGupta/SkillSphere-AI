import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    technologies: [{ type: String, trim: true }],
    githubUrl: { type: String, trim: true, maxlength: 300, default: '' },
    liveUrl: { type: String, trim: true, maxlength: 300, default: '' },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed'],
      default: 'In Progress',
    },
  },
  { timestamps: true }
)

const Project = mongoose.model('Project', projectSchema)
export default Project