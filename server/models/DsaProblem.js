import mongoose from 'mongoose'

export const PLATFORMS = [
  'LeetCode',
  'GeeksforGeeks',
  'Codeforces',
  'HackerRank',
  'CodeChef',
  'Other',
]

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const TOPICS = [
  'Arrays',
  'Strings',
  'Hashing',
  'Two Pointers & Sliding Window',
  'Binary Search',
  'Sorting',
  'Linked List',
  'Stack & Queue',
  'Recursion & Backtracking',
  'Trees',
  'Heaps',
  'Graphs',
  'Greedy',
  'Dynamic Programming',
  'Bit Manipulation',
  'Math',
  'Other',
]

const dsaProblemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    platform: { type: String, enum: PLATFORMS, default: 'LeetCode' },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    topic: { type: String, enum: TOPICS, required: true },
    solvedDate: { type: Date, required: true },
    link: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
)

dsaProblemSchema.index({ user: 1, solvedDate: -1 })

const DsaProblem = mongoose.model('DsaProblem', dsaProblemSchema)
export default DsaProblem