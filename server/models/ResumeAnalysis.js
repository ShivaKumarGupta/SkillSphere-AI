import mongoose from 'mongoose'

const weakSectionSchema = new mongoose.Schema(
  {
    section: { type: String, trim: true, maxlength: 100, default: '' },
    issue: { type: String, trim: true, maxlength: 300, default: '' },
    suggestion: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: false }
)

const list = [{ type: String, trim: true, maxlength: 300 }]

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    targetRole: { type: String, trim: true, maxlength: 100, default: '' },
    fileName: { type: String, trim: true, maxlength: 100, default: '' },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true, trim: true, maxlength: 600 },
    strengths: list,
    skillGaps: list,
    missingKeywords: list,
    weakSections: [weakSectionSchema],
    roleRecommendations: list,
    atsAndFormatting: list,
    hiddenInstructionsDetected: { type: Boolean, default: false },
    inputHash: { type: String, required: true },
    model: { type: String, trim: true, maxlength: 60, default: '' },
  },
  { timestamps: true }
)

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema)
export default ResumeAnalysis