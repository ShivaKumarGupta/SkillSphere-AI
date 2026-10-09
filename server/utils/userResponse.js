import { getProfileCompletion } from './profileCompletion.js'

const toUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  college: user.college,
  degree: user.degree,
  branch: user.branch,
  graduationYear: user.graduationYear,
  cgpa: user.cgpa,
  skills: user.skills,
  careerInterests: user.careerInterests,
  targetRole: user.targetRole,
  experienceLevel: user.experienceLevel,
  github: user.github,
  linkedin: user.linkedin,
  profileCompletion: getProfileCompletion(user),
})

export default toUserResponse