import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 3000 },
  createdAt: { type: Date, default: Date.now },
})

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
)

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation